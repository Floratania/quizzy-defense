import {BadRequestException} from '@nestjs/common';
import {Difficulty, QuestionSelection, difficulties, validateSelection, selectBalancedQuestions} from '../quizzes/question-selection';
export type TournamentStage = {count:number; difficulty:Difficulty};
export type TournamentPlan = {mode:'AUTO'|'MANUAL'; stages:TournamentStage[]};
export function buildTournamentPlan(questions:Array<{difficulty?:string}>, mode:'AUTO'|'MANUAL'='AUTO', stages?:TournamentStage[], selection?:QuestionSelection|null):TournamentPlan {
 const counts=Object.fromEntries(difficulties.map(level=>[level,questions.filter(q=>(q.difficulty||'medium')===level).length])) as QuestionSelection;
 const plan=mode==='AUTO'?difficulties.map(difficulty=>({difficulty,count:selection?.[difficulty]??counts[difficulty]})):stages;
 if(!plan||plan.length!==3||plan.some(s=>!difficulties.includes(s.difficulty)||!Number.isInteger(s.count)||s.count<1))throw new BadRequestException('Кожен із трьох етапів має містити хоча б одне питання обраної складності.');
 const required={easy:0,medium:0,hard:0};for(const stage of plan)required[stage.difficulty]+=stage.count;
 validateSelection(questions,required);
 return {mode,stages:plan};
}
export function tournamentOrder(questions:Array<{id:string;difficulty?:string}>,plan:TournamentPlan){
 const required={easy:0,medium:0,hard:0};for(const stage of plan.stages)required[stage.difficulty]+=stage.count;
 const sampled=selectBalancedQuestions(questions,required);const byId=new Map(questions.map(q=>[q.id,q]));
 const pools=Object.fromEntries(difficulties.map(level=>[level,sampled.filter(id=>(byId.get(id)?.difficulty||'medium')===level)]));
 return plan.stages.flatMap(stage=>pools[stage.difficulty].splice(0,stage.count));
}
export function tournamentBoundaries(settings:Record<string,unknown>,total:number){
 const plan=settings.tournamentPlan as TournamentPlan|undefined;
 const qualificationEnd=plan?plan.stages[0].count:Math.max(1,Math.ceil(total/3));
 const semifinalEnd=plan?qualificationEnd+plan.stages[1].count:Math.max(qualificationEnd+1,Math.ceil(total*2/3));
 return {qualificationEnd,semifinalEnd};
}
