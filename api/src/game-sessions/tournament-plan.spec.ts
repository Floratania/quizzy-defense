import {buildTournamentPlan,tournamentOrder,tournamentBoundaries} from './tournament-plan';
import {sessionQuestionCount} from '../quizzes/question-selection';
const pool=['easy','medium','hard'].flatMap(difficulty=>Array.from({length:10},(_,i)=>({id:difficulty+i,difficulty})));
describe('Tournament stage plans',()=>{
 it('uses easy, medium and hard quotas as distinct automatic stages',()=>{
  const plan=buildTournamentPlan(pool,'AUTO',undefined,{easy:3,medium:4,hard:5});
  expect(plan.stages.map(s=>s.count)).toEqual([3,4,5]);
  const ids=tournamentOrder(pool,plan);
  expect(ids.map(id=>id.replace(/\d/g,''))).toEqual([...Array(3).fill('easy'),...Array(4).fill('medium'),...Array(5).fill('hard')]);
  expect(tournamentBoundaries({tournamentPlan:plan},12)).toEqual({qualificationEnd:3,semifinalEnd:7});
 });
 it('preserves manual stage boundaries and never repeats questions across stages',()=>{
  const plan=buildTournamentPlan(pool,'MANUAL',[{difficulty:'medium',count:2},{difficulty:'easy',count:3},{difficulty:'medium',count:4}]);
  for(let i=0;i<20;i++){
   const ids=tournamentOrder(pool,plan);expect(new Set(ids).size).toBe(9);
   expect(ids.slice(0,2).every(id=>id.startsWith('medium'))).toBe(true);
   expect(ids.slice(2,5).every(id=>id.startsWith('easy'))).toBe(true);
   expect(ids.slice(5).every(id=>id.startsWith('medium'))).toBe(true);
  }
  expect(sessionQuestionCount({quiz:{questions:pool,questionSelection:{easy:1,medium:1,hard:1}},settings:{tournamentPlan:plan}})).toBe(9);
  expect(tournamentBoundaries({tournamentPlan:plan},9)).toEqual({qualificationEnd:2,semifinalEnd:5});
 });
 it('supports mixed quotas per stage with the same difficulty slots for all players',()=>{
  const plan=buildTournamentPlan(pool,'MANUAL',[{selection:{easy:4,medium:5,hard:0}},{selection:{easy:1,medium:2,hard:3}},{selection:{easy:0,medium:0,hard:4}}]);
  expect(plan.stages.map(s=>s.count)).toEqual([9,6,4]);
  expect(tournamentBoundaries({tournamentPlan:plan},19)).toEqual({qualificationEnd:9,semifinalEnd:15});
  for(let i=0;i<10;i++){
   const ids=tournamentOrder(pool,plan);expect(new Set(ids).size).toBe(19);
   expect(ids.slice(0,9).map(id=>id.replace(/\d/g,''))).toEqual([...Array(4).fill('easy'),...Array(5).fill('medium')]);
   expect(ids.slice(9,15).map(id=>id.replace(/\d/g,''))).toEqual(['easy','medium','medium','hard','hard','hard']);
  }
  expect(()=>buildTournamentPlan(pool,'MANUAL',[{selection:{easy:4,medium:5,hard:0}},{selection:{easy:0,medium:6,hard:1}},{selection:{easy:0,medium:0,hard:1}}])).toThrow('Недостатньо');
 });
 it('rejects empty stages, missing levels and cumulative over-allocation',()=>{
  expect(()=>buildTournamentPlan(pool,'MANUAL',[{difficulty:'easy',count:6},{difficulty:'easy',count:5},{difficulty:'hard',count:1}])).toThrow('Недостатньо');
  expect(()=>buildTournamentPlan(pool,'MANUAL',[])).toThrow();
  expect(()=>buildTournamentPlan(pool.filter(q=>q.difficulty!=='hard'))).toThrow();
 });
});
