import {ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import {DataSource} from 'typeorm';
import {GamePlayer} from '@/game-players/entities/game-player.entity';
import {User} from './entities/user.entity';
import {PlayerAnswersService} from '@/player-answers/player-answers.service';
import {QuizFeedbackMode} from '@/quizzes/entities/quiz.entity';
@Injectable()
export class StudentLearningService {
 constructor(private data:DataSource,private answers:PlayerAnswersService){}
 private async completed(userId:number) {
  return (await this.data.getRepository(GamePlayer).find({where:{studentId:userId},relations:['session','session.quiz'],order:{joinedAt:'DESC'}})).filter(p=>p.session.quiz&&(p.session.status==='FINISHED'||Boolean(p.completedAt)));
 }
 async assignments(userId:number) {
  const rows=await this.data.query(`SELECT a.id,a.room_code AS "roomCode",a.due_at AS "dueAt",a.max_attempts AS "maxAttempts",a.variant_settings AS "variantSettings",q.title,q.topic,q.available_from AS "quizFrom",q.available_until AS "quizUntil",q.max_attempts AS "quizMaxAttempts",c.name AS "className",u.name AS "teacherName",s.id AS "sessionId",s.status AS "sessionStatus" FROM quiz_assignments a JOIN class_students m ON m.class_id=a.class_id JOIN learning_classes c ON c.id=a.class_id JOIN "user" u ON u.id=c.teacher_id JOIN quizzes q ON q.id=a.quiz_id JOIN game_sessions s ON s."roomCode"=a.room_code WHERE m.student_id=$1 ORDER BY a."createdAt" DESC`,[userId]);
  const players=await this.data.getRepository(GamePlayer).find({where:{studentId:userId},order:{joinedAt:'DESC'}});
  const now=Date.now();
  return rows.map(a=>{
   const attempts=players.filter(p=>p.session_id===a.sessionId),active=attempts.find(p=>!p.completedAt),completed=attempts.some(p=>Boolean(p.completedAt));
   const starts=[a.quizFrom,a.variantSettings?.availableFrom].filter(Boolean).map(d=>new Date(d).getTime());
   const ends=[a.quizUntil,a.dueAt].filter(Boolean).map(d=>new Date(d).getTime());
   const availableFrom=starts.length?new Date(Math.max(...starts)).toISOString():null,dueAt=ends.length?new Date(Math.min(...ends)).toISOString():null;
   const exhausted=attempts.length>=a.maxAttempts&&!active;
   const status=completed&&exhausted?'COMPLETED':a.sessionStatus==='FINISHED'?'CLOSED':dueAt&&now>new Date(dueAt).getTime()?'OVERDUE':availableFrom&&now<new Date(availableFrom).getTime()?'UPCOMING':exhausted?'EXHAUSTED':'OPEN';
   return {id:a.id,title:a.title,topic:a.topic,className:a.className,teacherName:a.teacherName,availableFrom,dueAt,status,attemptsUsed:attempts.length,maxAttempts:a.maxAttempts,sessionId:status==='OPEN'?a.sessionId:undefined,roomCode:status==='OPEN'?a.roomCode:undefined,activePlayer:status==='OPEN'&&active?{id:active.id,nickname:active.nickname}:null};
  });
 }
 async summary(userId:number){
  const players=await this.completed(userId);const attempts:any[]=[];
  for(const p of players){const result=await this.answers.getPlayerFinalResult(p.id,false);attempts.push({playerId:p.id,title:p.session.quiz.title,topic:p.session.quiz.topic||'Без теми',date:p.completedAt||p.joinedAt,reviewAllowed:p.session.quiz.feedbackMode!==QuizFeedbackMode.END_SCORE_ONLY,...result});}
  const groups=new Map<string,any>();
  for(const a of attempts){const t=groups.get(a.topic)||{topic:a.topic,attempts:0,correct:0,questions:0,reviewAvailable:false};t.attempts++;t.correct+=a.correctCount;t.questions+=a.totalAnswers;t.reviewAvailable ||= a.reviewAllowed;groups.set(a.topic,t);}
  const correct=attempts.reduce((n,a)=>n+a.correctCount,0),questions=attempts.reduce((n,a)=>n+a.totalAnswers,0);
  const user=await this.data.getRepository(User).findOneByOrFail({id:userId});
  return {teacherPromptSeen:user.teacherPromptSeen,stats:{attempts:attempts.length,correct,questions,accuracy:questions?Math.round(correct/questions*100):0,passed:attempts.filter(a=>a.passed).length},topics:[...groups.values()].map(t=>({...t,accuracy:t.questions?Math.round(t.correct/t.questions*100):0})).sort((a,b)=>a.accuracy-b.accuracy),attempts};
 }
 async review(userId:number,playerId?:string,topic?:string){
  let players=await this.completed(userId);
  if(playerId){players=players.filter(p=>p.id===playerId);if(!players.length)throw new NotFoundException('Спробу не знайдено');}
  if(topic)players=players.filter(p=>(p.session.quiz.topic||'Без теми')===topic);
  const latest=new Map<string,any>();
  for(const p of players){if(p.session.quiz.feedbackMode===QuizFeedbackMode.END_SCORE_ONLY){if(playerId)throw new ForbiddenException('Викладач вимкнув перегляд відповідей');continue;}const result=await this.answers.getPlayerFinalResult(p.id,true);for(const a of result.answers||[]){const key=a.practiceQuestion.id;if(!latest.has(key))latest.set(key,a);}}
  return {answers:[...latest.values()].filter(a=>!a.correct)};
 }
}
