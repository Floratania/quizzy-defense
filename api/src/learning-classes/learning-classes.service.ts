import {In} from 'typeorm';
import {GameSession} from '../game-sessions/entities/game-session.entity';
import {classStatistics,assignmentAvailability} from './class-statistics';
import {BadRequestException,ForbiddenException,HttpException,Injectable,NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {randomBytes} from 'crypto';
import * as bcrypt from 'bcrypt';
import {LearningClass} from './entities/learning-class.entity';
import {ClassStudent} from './entities/class-student.entity';
import {QuizAssignment} from './entities/quiz-assignment.entity';
import {User} from '@/users/entities/user.entity';
import {Quiz} from '@/quizzes/entities/quiz.entity';
import {GameSessionsService} from '@/game-sessions/game-sessions.service';
@Injectable()
export class LearningClassesService {
 constructor(@InjectRepository(LearningClass)private classes:Repository<LearningClass>,@InjectRepository(ClassStudent)private members:Repository<ClassStudent>,@InjectRepository(QuizAssignment)private assignments:Repository<QuizAssignment>,@InjectRepository(User)private users:Repository<User>,@InjectRepository(Quiz)private quizzes:Repository<Quiz>,private sessions:GameSessionsService){}
 async statistics(classId:string,teacherId:number){
  const cls=await this.classes.findOneBy({id:classId,teacherId});if(!cls)throw new NotFoundException('Клас не знайдено');
  const students=await this.members.query('SELECT u.id,u.name,u.email FROM class_students m JOIN "user" u ON u.id=m.student_id WHERE m.class_id=$1 ORDER BY u.name',[classId]);
  const assignments=await this.assignments.find({where:{classId},order:{createdAt:'DESC'}});
  const sessions=assignments.length?await this.assignments.manager.getRepository(GameSession).find({where:{roomCode:In(assignments.map(a=>a.roomCode))},relations:['quiz','quiz.questions','players','players.answers','players.answers.question']}):[];
  return {classId,className:cls.name,...classStatistics(students,assignments,sessions)};
 }
 private joinAttempts=new Map<number,{count:number,until:number}>();
 async studentClasses(studentId:number) {
  return this.members.query(`SELECT c.id,c.name,u.name AS "teacherName" FROM class_students m JOIN learning_classes c ON c.id=m.class_id JOIN "user" u ON u.id=c.teacher_id WHERE m.student_id=$1 ORDER BY m."createdAt" DESC`,[studentId]);
 }
 async joinClass(studentId:number,code:string) {
  const now=Date.now();for(const [id,a] of this.joinAttempts)if(a.until<=now)this.joinAttempts.delete(id);
  const attempt=this.joinAttempts.get(studentId)||{count:0,until:now+60000};
  if(++attempt.count>10)throw new HttpException('Забагато спроб. Зачекайте хвилину.',429);
  this.joinAttempts.set(studentId,attempt);
  const student=await this.users.findOneBy({id:studentId});if(student?.role!=='STUDENT')throw new ForbiddenException('Приєднання доступне з акаунта учня');
  const cls=await this.classes.findOneBy({joinCode:code.trim().toUpperCase()});
  if(!cls)throw new NotFoundException('Клас із таким кодом не знайдено. Перевірте код у вчителя.');
  const teacher=await this.users.findOneBy({id:cls.teacherId});if(!teacher||!['TEACHER','ADMIN'].includes(teacher.role))throw new NotFoundException('Клас недоступний');
  const inserted=await this.members.query('INSERT INTO class_students(class_id,student_id) VALUES($1,$2) ON CONFLICT(class_id,student_id) DO NOTHING RETURNING id',[cls.id,studentId]);
  return {id:cls.id,name:cls.name,teacherName:teacher.name,joined:inserted.length>0};
 }
 create(name:string,teacherId:number){return this.classes.save(this.classes.create({name:name.trim(),teacherId,joinCode:randomBytes(4).toString('hex').toUpperCase()}));}
 async all(teacherId:number){
  const classes=await this.classes.findBy({teacherId});
  return Promise.all(classes.map(async item=>{
   const students=await this.members.createQueryBuilder('m').innerJoinAndSelect(User,'u','u.id=m.student_id').where('m.class_id=:id',{id:item.id}).select(['m.id AS "membershipId"','u.id AS id','u.name AS name','u.email AS email','u.managed_by_teacher_id AS "managedByTeacherId"']).getRawMany();
   const assignments=await this.assignments.createQueryBuilder('a').innerJoin(Quiz,'q','q.id=a.quiz_id').leftJoin(GameSession,'s','s."roomCode"=a.room_code').where('a.class_id=:id',{id:item.id}).select(['a.id AS id','a.token AS token','a.room_code AS "roomCode"','a.due_at AS "dueAt"','a.max_attempts AS "maxAttempts"','a.variant_settings AS "variantSettings"','q.id AS "quizId"','q.title AS "quizTitle"','s.id AS "sessionId"','s.status AS "sessionStatus"','s.settings AS "sessionSettings"']).getRawMany();
   return {...item,students,assignments:assignments.map(({sessionSettings,sessionStatus,...a})=>({...a,availableFrom:sessionSettings?.assignmentOpensAt||null,accessStatus:assignmentAvailability(sessionStatus,sessionSettings?.assignmentOpensAt,a.dueAt)}))};
  }));
 }
 async addExistingStudent(classId:string,teacherId:number,dto:{email?:string,studentCode?:string}) {
  if(!await this.classes.existsBy({id:classId,teacherId}))throw new NotFoundException('Клас не знайдено');
  if(Boolean(dto.email)===Boolean(dto.studentCode))throw new BadRequestException('Вкажіть код або пошту учня');
  const student=await this.users.createQueryBuilder('u').where(dto.studentCode?'u.student_code=:code':'lower(u.email)=lower(:email)',dto.studentCode?{code:dto.studentCode.trim().toUpperCase()}:{email:dto.email!.trim()}).andWhere('u.role=:role',{role:'STUDENT'}).getOne();
  if(!student)throw new NotFoundException('Учня не знайдено. Перевірте код або пошту з його кабінету; спочатку він має зареєструватися.');
  await this.members.upsert({classId,studentId:student.id},['classId','studentId']);
  return {id:student.id,name:student.name,email:student.email};
 }
 async addStudent(classId:string,teacherId:number,dto:{name:string,email:string,password:string}){const cls=await this.classes.findOneBy({id:classId,teacherId});if(!cls)throw new NotFoundException('Class not found');let student=await this.users.findOneBy({email:dto.email});if(!student)student=await this.users.save(this.users.create({name:dto.name,email:dto.email,password:await bcrypt.hash(dto.password,10),role:'STUDENT',managedByTeacherId:teacherId}));if(student.role!=='STUDENT')throw new BadRequestException('Цей акаунт не є учнем');if(await this.members.existsBy({classId,studentId:student.id}))throw new BadRequestException('Student already belongs to class');await this.members.save(this.members.create({classId,studentId:student.id}));return {id:student.id,name:student.name,email:student.email};}
 async updateStudent(classId:string,studentId:number,teacherId:number,dto:{name?:string,email?:string,password?:string}){if(!await this.classes.existsBy({id:classId,teacherId})||!await this.members.existsBy({classId,studentId}))throw new NotFoundException('Student not found in class');const student=await this.users.findOneBy({id:studentId});if(!student)throw new NotFoundException('Student not found');if(student.managedByTeacherId!==teacherId)throw new BadRequestException('Особистий акаунт учня не можна змінювати через клас');if(student.role!=='STUDENT')throw new BadRequestException('Цей акаунт не є учнем');if(dto.email&&dto.email!==student.email&&await this.users.existsBy({email:dto.email}))throw new BadRequestException('Email already in use');if(dto.name?.trim())student.name=dto.name.trim();if(dto.email?.trim())student.email=dto.email.trim();if(dto.password?.trim())student.password=await bcrypt.hash(dto.password,10);student.role='STUDENT';await this.users.save(student);return{id:student.id,name:student.name,email:student.email};}
 async changeMembership(classId:string,studentId:number,teacherId:number,targetClassId?:string){
  if(targetClassId===classId)throw new BadRequestException('Оберіть інший клас');
  return this.classes.manager.transaction(async manager=>{
   const owned=await manager.getRepository(LearningClass).find({where:{id:In(targetClassId?[classId,targetClassId]:[classId]),teacherId},order:{id:'ASC'},lock:{mode:'pessimistic_write'}});
   if(owned.length!==(targetClassId?2:1))throw new NotFoundException('Клас не знайдено');
   const members=manager.getRepository(ClassStudent);
   if(!await members.existsBy({classId,studentId}))throw new NotFoundException('Учня не знайдено в класі');
   if(targetClassId)await members.upsert({classId:targetClassId,studentId},['classId','studentId']);
   await members.delete({classId,studentId});
   return {removedFromClassId:classId,studentId,...(targetClassId?{targetClassId}:{})};
  });
 }
 async assign(classId:string,teacherId:number,dto:{quizId:string,dueAt?:string,availableFrom?:string,maxAttempts?:number,variantSettings?:Record<string,unknown>}) {
  if(!await this.classes.existsBy({id:classId,teacherId}))throw new NotFoundException('Клас не знайдено');
  const quiz=await this.quizzes.findOne({where:{id:dto.quizId},relations:['questions']});
  if(!quiz)throw new NotFoundException('Вікторину не знайдено');
  if(quiz.userId!==teacherId){const access=await this.quizzes.query('SELECT 1 FROM quiz_collaborators WHERE "quizId"=$1 AND "userId"=$2',[quiz.id,teacherId]);if(!access.length)throw new NotFoundException('Немає доступу до цієї вікторини');}
  const opens=dto.availableFrom?new Date(dto.availableFrom):null,due=dto.dueAt?new Date(dto.dueAt):null;
  if((opens&&isNaN(opens.getTime()))||(due&&isNaN(due.getTime()))||(opens&&due&&opens>=due))throw new BadRequestException('Дата початку має бути раніше дедлайну');
  const maxAttempts=dto.maxAttempts??1;if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>100)throw new BadRequestException('Кількість спроб має бути від 1 до 100');
  const variant={...dto.variantSettings};
  const levels=['easy','medium','hard'] as const;
  const available=Object.fromEntries(levels.map(level=>[level,quiz.questions.filter(q=>(q.difficulty||'medium')===level).length])) as Record<typeof levels[number],number>;
  let selection:Record<string,number>|undefined;
  if(variant.questionMode!==undefined&&!['all','count'].includes(String(variant.questionMode)))throw new BadRequestException('Невірний режим вибору питань');
  if(variant.questionMode==='all'){selection=available;variant.questionCount=quiz.questions.length;}
  else if(variant.questionCount!==undefined){
   const count=Number(variant.questionCount);
   if(!Number.isInteger(count)||count<1||count>quiz.questions.length)throw new BadRequestException(`Оберіть від 1 до ${quiz.questions.length} питань або «Усі питання»`);
   // Use the same difficulty quotas for every student; sample independently inside each level.
   selection={easy:0,medium:0,hard:0};
   const weights=quiz.questionSelection||available,totalWeight=levels.reduce((sum,level)=>sum+weights[level],0);
   for(let i=0;i<count;i++){
    const level=levels.filter(level=>selection![level]<available[level]).sort((a,b)=>(weights[b]*count/totalWeight-selection![b])-(weights[a]*count/totalWeight-selection![a]))[0];
    selection[level]++;
   }
   variant.questionMode='count';variant.questionCount=count;
  }
  const session=await this.sessions.create({quizId:dto.quizId,mode:'PROGRESS' as any},teacherId,true);
  await this.sessions.mergeSettings(session.id,{...variant,...(selection?{questionSelection:selection}:{}),assignmentMaxAttempts:maxAttempts,classId,assignmentOpensAt:opens?.toISOString()||null,assignmentDueAt:due?.toISOString()||null});
  await this.sessions.start(session.id);
  return this.assignments.save(this.assignments.create({classId,quizId:dto.quizId,roomCode:session.roomCode,token:randomBytes(24).toString('hex'),dueAt:due,maxAttempts,variantSettings:{...variant,availableFrom:opens?.toISOString()||null}}));
 }

 assignment(token:string){return this.assignments.findOneBy({token});}
}
