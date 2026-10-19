import {sessionQuestionCount} from '../quizzes/question-selection';
export function assignmentAvailability(sessionStatus:string|undefined,opens:unknown,due:unknown,now=Date.now()) {
 if(!sessionStatus||sessionStatus==='FINISHED'||Boolean(due&&new Date(String(due)).getTime()<=now))return 'CLOSED';
 return opens&&new Date(String(opens)).getTime()>now?'SCHEDULED':'ACTIVE';
}
export function classStatistics(students:any[],assignments:any[],sessions:any[],now=Date.now()) {
 const rows:any[]=[];
 const assignmentInfo=assignments.map(assignment=>{
  const session=sessions.find(s=>s.roomCode===assignment.roomCode);
  const questions=session?.quiz?.questions||[];
  const types:Record<string,number>={};for(const q of questions)types[q.type]=(types[q.type]||0)+1;
  const availability=assignmentAvailability(session?.status,session?.settings?.assignmentOpensAt,assignment.dueAt,now);
  const closed=availability==='CLOSED',upcoming=availability==='SCHEDULED';
  const info={id:assignment.id,title:session?.quiz?.title||'Вікторина недоступна',sessionId:session?.id,closed,upcoming,dueAt:assignment.dueAt,maxAttempts:assignment.maxAttempts,questionTypes:types,totalQuestions:session?.quiz?sessionQuestionCount(session):0};
  for(const student of students){
   const attempts=(session?.players||[]).filter(p=>p.studentId===Number(student.id)).map(p=>{
    const selected=p.questionOrder?questions.filter(q=>p.questionOrder.includes(q.id)):questions;
    const maxPoints=selected.reduce((sum,q)=>sum+q.points,0),answers=p.answers||[];
    const byType:Record<string,{answered:number;correct:number}>={};
    for(const a of answers){const type=a.question?.type||'unknown';byType[type]??={answered:0,correct:0};byType[type].answered++;if(a.isCorrect)byType[type].correct++;}
    return {id:p.id,startedAt:p.joinedAt,completedAt:p.completedAt,completed:Boolean(p.completedAt),score:p.totalScore,maxPoints,percentage:maxPoints?Math.round(p.totalScore/maxPoints*100):0,answered:answers.length,correct:answers.filter(a=>a.isCorrect).length,totalQuestions:p.questionOrder?.length||info.totalQuestions,questionTypes:byType};
   }).sort((a,b)=>new Date(b.startedAt).getTime()-new Date(a.startedAt).getTime());
   const completed=attempts.filter(a=>a.completed).sort((a,b)=>b.percentage-a.percentage||b.score-a.score);
   const best=completed[0]||attempts[0]||null;
   const status=completed.length?'COMPLETED':closed?'NOT_COMPLETED':attempts.length?'IN_PROGRESS':upcoming?'UPCOMING':'NOT_STARTED';
   rows.push({studentId:Number(student.id),studentName:student.name,email:student.email,assignmentId:assignment.id,quizTitle:info.title,status,passed:completed.length?(best.maxPoints>0&&best.score/best.maxPoints*100>=(Number(session?.settings?.passThreshold??session?.quiz?.passThreshold??60))):null,attemptCount:attempts.length,best,attempts});
  }
  return info;
 });
 const summary={COMPLETED:0,NOT_COMPLETED:0,IN_PROGRESS:0,NOT_STARTED:0,UPCOMING:0};for(const row of rows)summary[row.status]++;
 return {students,assignments:assignmentInfo,rows,summary};
}
