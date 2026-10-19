import {BadRequestException} from '@nestjs/common';
import {Difficulty, QuestionSelection, difficulties, validateSelection, selectBalancedQuestions, selectionCount} from '../quizzes/question-selection';
export type TournamentStage = {count?:number; difficulty?:Difficulty; selection?:QuestionSelection};
export type TournamentPlan = {mode:'AUTO'|'MANUAL'; stages:TournamentStage[]};
function stageSelection(stage:TournamentStage):QuestionSelection {
 if(stage.selection)return stage.selection;
 return {easy:0,medium:0,hard:0,...(stage.difficulty?{[stage.difficulty]:stage.count}:{})} as QuestionSelection;
}
export function buildTournamentPlan(questions:Array<{difficulty?:string}>, mode:'AUTO'|'MANUAL'='AUTO', stages?:TournamentStage[], selection?:QuestionSelection|null):TournamentPlan {
 const counts=Object.fromEntries(difficulties.map(level=>[level,questions.filter(q=>(q.difficulty||'medium')===level).length])) as QuestionSelection;
 const source:TournamentStage[]|undefined=mode==='AUTO'?difficulties.map(difficulty=>({difficulty,count:selection?.[difficulty]??counts[difficulty]})):stages;
 if(!source||source.length!==3)throw new BadRequestException('Задайте розподіл для всіх трьох етапів.');
 const required={easy:0,medium:0,hard:0};
 const plan=source.map(stage=>{
  if(!stage.selection&&(!difficulties.includes(stage.difficulty!)||!Number.isInteger(stage.count)||stage.count!<1))throw new BadRequestException('Некоректний розподіл питань етапу.');
  const quota=stageSelection(stage);
  if(difficulties.some(level=>!Number.isInteger(quota[level])||quota[level]<0)||selectionCount(quota)<1)throw new BadRequestException('Кожен етап має містити хоча б одне питання.');
  for(const level of difficulties)required[level]+=quota[level];
  return {selection:quota,count:selectionCount(quota)};
 });
 validateSelection(questions,required);return {mode,stages:plan};
}
export function tournamentOrder(questions:Array<{id:string;difficulty?:string}>,plan:TournamentPlan){
 const quotas=plan.stages.map(stageSelection),required={easy:0,medium:0,hard:0};
 for(const quota of quotas)for(const level of difficulties)required[level]+=quota[level];
 const sampled=selectBalancedQuestions(questions,required),byId=new Map(questions.map(q=>[q.id,q]));
 const pools=Object.fromEntries(difficulties.map(level=>[level,sampled.filter(id=>(byId.get(id)?.difficulty||'medium')===level)]));
 // Identical difficulty slots; independently sampled questions without repeats across stages.
 return quotas.flatMap(quota=>difficulties.flatMap(level=>pools[level].splice(0,quota[level])));
}
export function tournamentBoundaries(settings:Record<string,unknown>,total:number){
 const plan=settings.tournamentPlan as TournamentPlan|undefined;
 const qualificationEnd=plan?selectionCount(stageSelection(plan.stages[0])):Math.max(1,Math.ceil(total/3));
 const semifinalEnd=plan?qualificationEnd+selectionCount(stageSelection(plan.stages[1])):Math.max(qualificationEnd+1,Math.ceil(total*2/3));
 return {qualificationEnd,semifinalEnd};
}
