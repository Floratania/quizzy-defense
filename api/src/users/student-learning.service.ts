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
