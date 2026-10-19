import {classStatistics,assignmentAvailability} from './class-statistics';
const students=[{id:1,name:'A',email:'a@test'},{id:2,name:'B',email:'b@test'}];
const assignments=[{id:'a',roomCode:'123',maxAttempts:2,dueAt:null}];
const question={id:'q',type:'open_text',points:100};
const session:any={id:'s',roomCode:'123',status:'RUNNING',settings:{passThreshold:60},quiz:{title:'Quiz',questions:[question]},players:[]};
describe('Class assignment statistics',()=>{
 it('exposes class access independently from student completion',()=>{expect(assignmentAvailability('RUNNING',null,null)).toBe('ACTIVE');expect(assignmentAvailability('RUNNING',new Date(Date.now()+10000),null)).toBe('SCHEDULED');expect(assignmentAvailability('FINISHED',null,null)).toBe('CLOSED');expect(assignmentAvailability('RUNNING',null,'2000-01-01')).toBe('CLOSED');});
 it('includes students who never joined and distinguishes upcoming, active and closed assignments',()=>{
  expect(classStatistics(students,assignments,[session]).summary.NOT_STARTED).toBe(2);
  const upcoming={...session,settings:{assignmentOpensAt:new Date(Date.now()+100000).toISOString()}};
  expect(classStatistics(students,assignments,[upcoming]).summary.UPCOMING).toBe(2);
  expect(classStatistics(students,assignments,[{...session,status:'FINISHED'}]).summary.NOT_COMPLETED).toBe(2);
  expect(classStatistics(students,[{...assignments[0],dueAt:'2000-01-01'}],[session]).summary.NOT_COMPLETED).toBe(2);
 });
 it('uses the best completed attempt and preserves incomplete attempts and type counts',()=>{
  const player={studentId:1,joinedAt:new Date(),completedAt:new Date(),questionOrder:['q'],answers:[{isCorrect:true,question}]};
  const data=classStatistics(students,assignments,[{...session,status:'FINISHED',players:[{...player,id:'1',totalScore:80},{...player,id:'2',totalScore:40},{...player,id:'3',totalScore:90,completedAt:null}]}]);
  expect(data.summary).toMatchObject({COMPLETED:1,NOT_COMPLETED:1});
  expect(data.rows[0]).toMatchObject({status:'COMPLETED',passed:true,attemptCount:3,best:{score:80,maxPoints:100,correct:1,questionTypes:{open_text:{answered:1,correct:1}}}});
  expect(data.rows[1].best).toBeNull();
 });
 it('does not confuse a completed failed test with an unfinished test',()=>{
  const data=classStatistics(students,assignments,[{...session,players:[{id:'p',studentId:1,totalScore:20,completedAt:new Date(),joinedAt:new Date(),answers:[]}]}]);
  expect(data.rows[0]).toMatchObject({status:'COMPLETED',passed:false});
 });
});
