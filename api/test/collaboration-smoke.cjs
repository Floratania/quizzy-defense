// Run after npm run build: node test/collaboration-smoke.cjs
// Uses local PostgreSQL DB_* settings; creates and removes an isolated database.
const fs=require('node:fs');
fs.mkdirSync('.tmp',{recursive:true});
require('dotenv').config({quiet:true});
const {Client}=require('pg'); const {spawn}=require('node:child_process'); const assert=require('node:assert/strict');
const dbName='quizzy_collaboration_check_'+Date.now();
const config={host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),user:process.env.DB_USERNAME||'postgres',password:process.env.DB_PASSWORD||'1111',database:'postgres'};
const admin=new Client(config); let child; let checks=0;
const base='http://127.0.0.1:3002';
async function call(path,method='GET',body,token,status=200){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>null);assert.equal(r.status,status,method+' '+path+' '+JSON.stringify(data));checks++;return data;}
(async()=>{
await new Promise((resolve,reject)=>{const server=require('node:net').createServer();server.once('error',reject);server.listen(3002,'127.0.0.1',()=>server.close(resolve));});
await admin.connect();await admin.query('CREATE DATABASE '+dbName);
const env={...process.env,DATABASE_URL:'',DB_DATABASE:dbName,PORT:'3002',JWT_SECRET:'isolated-test-secret',NODE_ENV:'development'};
const log=fs.openSync('.tmp/collaboration-api.log','w'); child=spawn(process.execPath,['dist/main.js'],{env,stdio:['ignore',log,log],windowsHide:true});
for(let i=0;i<180;i++){try{await fetch(base);break;}catch{if(child.exitCode!==null)throw new Error('API exited during startup; inspect .tmp/collaboration-api.log');await new Promise(r=>setTimeout(r,500));}if(i===179)throw new Error('Server failed to start');}
const users={};
for(const role of ['owner','viewer','editor','stranger']){const email=role+'@collaboration.example.test';const password='Quizzy-test-2026!';await call('/auth/signup','POST',{email,password,name:role+' teacher'},null,201);users[role]=await call('/auth/login','POST',{email,password});}
const token=key=>users[key].accessToken;

// Independent devices, one-time browser proof, and top-level cookie restoration.
const {createHash}=require('node:crypto');
const verifier='a'.repeat(43), challenge=createHash('sha256').update(verifier).digest('base64url');
async function browserLogin(){
 const r=await fetch(base+'/auth/browser-login',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:'owner@collaboration.example.test',password:'Quizzy-test-2026!',challenge})});
 assert.equal(r.status,303);checks++;
 const cookie=r.headers.get('set-cookie').split(';')[0];
 const code=new URL(r.headers.get('location')).searchParams.get('code');assert.match(code,/^[a-f0-9]{64}$/);
 return {cookie,code};
}
const browserA=await browserLogin(), browserB=await browserLogin();assert.notEqual(browserA.cookie,browserB.cookie);
await call('/auth/exchange','POST',{code:browserA.code,verifier:'b'.repeat(43)},null,401);
const exchanged=await call('/auth/exchange','POST',{code:browserA.code,verifier});assert.ok(exchanged.accessToken);
await call('/auth/exchange','POST',{code:browserA.code,verifier},null,401);
for(const browser of [browserA,browserB]){
 const restored=await fetch(base+'/auth/restore?challenge='+challenge,{redirect:'manual',headers:{Cookie:browser.cookie}});
 assert.equal(restored.status,302);const code=new URL(restored.headers.get('location')).searchParams.get('code');assert.ok(code);checks++;
 const restoredTokens=await call('/auth/exchange','POST',{code,verifier});await call('/auth/me','GET',null,restoredTokens.accessToken);
}
const logout=await fetch(base+'/auth/browser-logout',{method:'POST',redirect:'manual',headers:{Cookie:browserB.cookie,Origin:new URL(process.env.FRONTEND_URL||'http://localhost:5173').origin}});assert.equal(logout.status,303);checks++;
for(const [browser,valid]of [[browserA,true],[browserB,false]]){
 const restored=await fetch(base+'/auth/restore?challenge='+challenge,{redirect:'manual',headers:{Cookie:browser.cookie}});
 const url=new URL(restored.headers.get('location'));assert.equal(url.searchParams.has('code'),valid);checks++;
}


const fixtures=new Client({...config,database:dbName});await fixtures.connect();await fixtures.query(`UPDATE "user" SET role='ADMIN' WHERE id=$1`,[users.owner.user.id]);await fixtures.end();
for(const role of ['viewer','editor','stranger']) {await call('/account/teacher-request','POST',{},token(role),201);await call('/account/role','PATCH',{userId:users[role].user.id,role:'TEACHER'},token('owner'));}
const pupilEmail='pupil@collaboration.example.test';
const pupil=await call('/auth/signup','POST',{name:'Test Pupil',email:pupilEmail,password:'Quizzy-test-2026!'},null,201);assert.equal(pupil.role,'STUDENT');
users.pupil=await call('/auth/login','POST',{email:pupilEmail,password:'Quizzy-test-2026!'});
await call('/auth/signup','POST',{name:'Bad Role',email:'badrole@example.test',password:'Quizzy-test-2026!',role:'ADMIN'},null,400);
await call('/quizzes','GET',null,token('pupil'),403);
await call('/quizzes/generate','POST',{topic:'test'},token('pupil'),403);
await call('/question-bank','GET',null,token('pupil'),403);
await call('/account/users','GET',null,token('pupil'),403);
await call('/account/teacher-requests','GET',null,token('pupil'),403);
await call('/account/teacher-request','POST',{},token('pupil'),201);
await call('/account/teacher-request','POST',{},token('pupil'),201);
const pendingRequests=await call('/account/teacher-requests','GET',null,token('owner'));assert.equal(pendingRequests.length,1);assert.equal(pendingRequests[0].id,pupil.id);assert.ok(!('password' in pendingRequests[0]));
await call('/account/role','PATCH',{userId:pupil.id,role:'TEACHER'},token('pupil'),403);
await call('/answers','GET',null,null,404);await call('/questions','GET',null,null,404);

const question=text=>({text,type:'open_text',timeLimit:30,points:1000,answers:[{text:'Київ',isCorrect:true},{text:'Kyiv',isCorrect:true}]});
const payload={title:'Collaboration check',questions:[question('First'),question('Second')]};
const quiz=await call('/quizzes','POST',payload,token('owner'),201); const id=quiz.id;assert.equal(quiz.showQuestionLeaderboard,false);
await call('/quizzes/'+id,'GET',null,token('stranger'),403);
await call('/quizzes/'+id+'/history','GET',null,token('stranger'),403);
await call('/game-sessions','POST',{quizId:id},token('stranger'),403);
await call('/quizzes/'+id+'/collaborators','POST',{email:'viewer@collaboration.example.test',role:'OWNER'},token('owner'),400);
for(const [name,role] of [['viewer','VIEWER'],['editor','EDITOR']])await call('/quizzes/'+id+'/collaborators','POST',{email:name+'@collaboration.example.test',role},token('owner'),201);
assert.equal((await call('/quizzes/my','GET',null,token('viewer')))[0].accessRole,'VIEWER');
await call('/quizzes/'+id,'PATCH',payload,token('viewer'),403);
await call('/quizzes/'+id,'DELETE',null,token('viewer'),404);
await call('/quizzes/'+id+'/collaborators','GET',null,token('editor'),403);
await call('/quizzes/'+id+'/collaborators','POST',{email:'stranger@collaboration.example.test',role:'EDITOR'},token('editor'),403);
await call('/quizzes/'+id+'/collaborators/'+users.viewer.user.id,'DELETE',null,token('editor'),403);
const session=await call('/game-sessions','POST',{quizId:id},token('viewer'),201);assert.equal(session.userId,users.viewer.user.id);assert.ok(session.roomCode);
await call('/game-sessions/'+session.id+'/finish','POST',{},token('viewer'),201);
await call('/session-reports','GET',null,null,401);
await call('/session-reports/'+session.id,'GET',null,token('owner'),403);
await call('/session-reports/'+session.id,'GET',null,token('stranger'),403);
assert.equal((await call('/session-reports/'+session.id,'GET',null,token('viewer'))).canManageReport,true);
assert.equal((await call('/session-reports','GET',null,token('owner'))).length,0);
await call('/session-reports/'+session.id+'/share-owner','PATCH',{shared:true},token('owner'),403);
await call('/session-reports/'+session.id+'/share-owner','PATCH',{shared:true},token('viewer'));
const sharedReport=await call('/session-reports/'+session.id,'GET',null,token('owner'));assert.equal(sharedReport.canManageReport,false);
const ownerReports=await call('/session-reports','GET',null,token('owner'));assert.equal(ownerReports.length,1);assert.equal(ownerReports[0].sharedByTeacher,true);
assert.equal((await call('/session-reports','GET',null,token('stranger'))).length,0);
await call('/session-reports/'+session.id+'/share-owner','PATCH',{shared:false},token('viewer'));
await call('/session-reports/'+session.id,'GET',null,token('owner'),403);
assert.equal((await call('/session-reports','GET',null,token('owner'))).length,0);

const bank=await call('/question-bank','POST',{text:'Private question',payload:{text:'Private question',type:'open_text',answers:['secret'],correctAnswers:[0]}},token('owner'),201);
assert.equal((await call('/question-bank','GET',null,token('viewer'))).length,0);
await call('/question-bank?ownerId='+users.owner.user.id,'GET',null,token('viewer'),403);
await call('/question-bank/collaborators','POST',{email:pupilEmail,role:'VIEWER'},token('owner'),400);
await call('/question-bank/collaborators','POST',{email:users.viewer.user.email,role:'VIEWER'},token('owner'),201);
assert.equal((await call('/question-bank?ownerId='+users.owner.user.id,'GET',null,token('viewer')))[0].id,bank.id);
await call('/question-bank/'+bank.id,'DELETE',null,token('viewer'),403);
await call('/question-bank/collaborators','POST',{email:users.editor.user.email,role:'EDITOR'},token('owner'),201);
await call('/question-bank/'+bank.id,'PATCH',{text:'Edited bank',payload:bank.payload},token('editor'));
await call('/question-bank/collaborators/'+users.viewer.user.id,'DELETE',null,token('owner'));
await call('/question-bank?ownerId='+users.owner.user.id,'GET',null,token('viewer'),403);

const updated=await call('/quizzes/'+id,'PATCH',{...payload,title:'Edited by teacher',questions:[question('Second'),question('First')]},token('editor'));assert.equal(updated.title,'Edited by teacher');
assert.deepEqual((await call('/quizzes/'+id,'GET',null,token('viewer'))).questions.map(q=>q.text),['Second','First']);
let history=await call('/quizzes/'+id+'/history','GET',null,token('viewer'));assert.equal(history[0].action,'EDITED');assert.equal(history[0].actorName,'editor teacher');
await call('/quizzes/'+id+'/collaborators','POST',{email:'editor@collaboration.example.test',role:'VIEWER'},token('owner'),201);
await call('/quizzes/'+id,'PATCH',payload,token('editor'),403);
await call('/quizzes/'+id+'/collaborators/'+users.viewer.user.id,'DELETE',null,token('owner'));
await call('/quizzes/'+id,'GET',null,token('viewer'),403);
await call('/game-sessions','POST',{quizId:id},token('viewer'),403);
assert.equal((await call('/quizzes/my','GET',null,token('viewer'))).length,0);
history=await call('/quizzes/'+id+'/history','GET',null,token('owner'));assert.deepEqual(history.slice(0,2).map(h=>h.action),['REVOKED','ROLE_CHANGED']);

const {io}=require('../../ui/node_modules/socket.io-client');
const sockets=[];
const event=(socket,name)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Timed out: '+name)),8000);socket.once(name,data=>{clearTimeout(timer);resolve(data);});});
async function guest(code,name,authToken){const socket=io(base,{auth:authToken?{token:authToken}:{},transports:['websocket'],autoConnect:false});sockets.push(socket);const connected=event(socket,'connect');socket.connect();await connected;const joined=event(socket,'joined_successfully');socket.emit('join_session',{roomCode:code,nickname:name});return {socket,joined:await joined};}
try {
const levels=['easy','medium','hard'];
const pool=levels.flatMap((difficulty,level)=>Array.from({length:level===0?18:16},(_,i)=>({...question(difficulty+' '+i),difficulty})));
const balanced=await call('/quizzes','POST',{title:'Balanced 50',trackTabSwitches:true,questionSelection:{easy:8,medium:8,hard:8},questions:pool},token('owner'),201);
const difficultyById=new Map(balanced.questions.map(q=>[q.id,q.difficulty]));

const autoTournament=await call('/game-sessions','POST',{quizId:balanced.id,mode:'TOURNAMENT',tournamentQuestionMode:'AUTO',tournamentTeamCount:4},token('owner'),201);
assert.deepEqual(autoTournament.settings.tournamentPlan.stages.map(s=>s.count),[8,8,8]);
const tournamentStages=[{count:2,difficulty:'easy'},{count:3,difficulty:'medium'},{count:4,difficulty:'hard'}];
const manualTournament=await call('/game-sessions','POST',{quizId:balanced.id,mode:'TOURNAMENT',tournamentQuestionMode:'MANUAL',tournamentStagePlan:tournamentStages,tournamentTeamCount:4},token('owner'),201);
for(let i=0;i<4;i++)await guest(manualTournament.roomCode,'Tournament '+i);
const tournamentSession=await call('/game-sessions/'+manualTournament.id,'GET',null,token('owner'));
assert.equal(new Set(tournamentSession.players.map(p=>p.teamId)).size,4);
for(const player of tournamentSession.players){assert.equal(player.questionOrder.length,9);assert.equal(new Set(player.questionOrder).size,9);assert.deepEqual(player.questionOrder.map(id=>difficultyById.get(id)),['easy','easy','medium','medium','medium','hard','hard','hard','hard']);}
await call('/game-sessions','POST',{quizId:balanced.id,mode:'TOURNAMENT',tournamentQuestionMode:'MANUAL',tournamentStagePlan:[{count:18,difficulty:'easy'},{count:1,difficulty:'easy'},{count:1,difficulty:'hard'}]},token('owner'),400);
await call('/game-sessions','POST',{quizId:balanced.id,mode:'TOURNAMENT',tournamentQuestionMode:'MANUAL',tournamentStagePlan:[{count:0,difficulty:'easy'}]},token('owner'),400);
await call('/game-sessions/'+manualTournament.id+'/finish','POST',{},token('owner'),201);
await call('/game-sessions/'+autoTournament.id+'/finish','POST',{},token('owner'),201);
const mixedStages=[{selection:{easy:4,medium:5,hard:0}},{selection:{easy:1,medium:2,hard:3}},{selection:{easy:0,medium:0,hard:4}}];
const mixedTournament=await call('/game-sessions','POST',{quizId:balanced.id,mode:'TOURNAMENT',tournamentQuestionMode:'MANUAL',tournamentStagePlan:mixedStages,tournamentTeamCount:4},token('owner'),201);
for(let i=0;i<4;i++)await guest(mixedTournament.roomCode,'Mixed '+i);
const mixedState=await call('/game-sessions/'+mixedTournament.id,'GET',null,token('owner'));
assert.deepEqual(mixedState.settings.tournamentPlan.stages.map(s=>s.count),[9,6,4]);
for(const player of mixedState.players){assert.equal(player.questionOrder.length,19);assert.equal(new Set(player.questionOrder).size,19);assert.deepEqual(player.questionOrder.slice(0,9).map(id=>difficultyById.get(id)),[...Array(4).fill('easy'),...Array(5).fill('medium')]);}
await call('/game-sessions','POST',{quizId:balanced.id,mode:'TOURNAMENT',tournamentQuestionMode:'MANUAL',tournamentStagePlan:[{selection:{easy:1,medium:1,hard:0}},{selection:{easy:0,medium:16,hard:1}},{selection:{easy:0,medium:0,hard:1}}]},token('owner'),400);
await call('/game-sessions','POST',{quizId:balanced.id,mode:'TOURNAMENT',tournamentQuestionMode:'MANUAL',tournamentStagePlan:[{selection:{easy:1,medium:1,hard:0}},{selection:{easy:0,medium:0,hard:0}},{selection:{easy:0,medium:0,hard:1}}]},token('owner'),400);
await call('/game-sessions/'+mixedTournament.id+'/finish','POST',{},token('owner'),201);
console.log('Mixed tournament: 4 easy + 5 medium in qualification, 9/6/4 stage sizes, no repeated questions, aggregate pool limits and empty-stage validation passed');
console.log('Tournament plans: automatic quotas, manual 2/3/4, four teams with identical difficulty slots and unique questions, invalid pools rejected');

const game=await call('/game-sessions','POST',{quizId:balanced.id},token('owner'),201);
await call('/game-sessions/'+game.id,'GET',null,null,401);await call('/game-sessions/'+game.id,'GET',null,token('pupil'),403);
const intruder=io(base,{transports:['websocket'],auth:{token:token('pupil')}});sockets.push(intruder);await event(intruder,'connect');
const denied=event(intruder,'host_error');intruder.emit('host_join_session',{sessionId:game.id});await denied;
const deniedStart=event(intruder,'host_error');intruder.emit('start_game',{sessionId:game.id});await deniedStart;
assert.equal((await call('/game-sessions/'+game.id,'GET',null,token('owner'))).status,'WAITING');
const a=await guest(game.roomCode,'Balanced A');const b=await guest(game.roomCode,'Balanced B');
let state=await call('/game-sessions/'+game.id,'GET',null,token('owner'));
for(const p of state.players){assert.equal(p.questionOrder.length,24);assert.equal(new Set(p.questionOrder).size,24);for(const level of levels)assert.equal(p.questionOrder.filter(id=>difficultyById.get(id)===level).length,8);}
const firstOrder=state.players.find(p=>p.id===a.joined.playerId).questionOrder;
assert.notDeepEqual(firstOrder,state.players.find(p=>p.id===b.joined.playerId).questionOrder);
const restored=io(base,{transports:['websocket'],autoConnect:false});sockets.push(restored);let connected=event(restored,'connect');restored.connect();await connected;const resumed=event(restored,'session_resumed');restored.emit('resume_session',{...a.joined});await resumed;
state=await call('/game-sessions/'+game.id,'GET',null,token('owner'));assert.deepEqual(firstOrder,state.players.find(p=>p.id===a.joined.playerId).questionOrder);
const controls=io(base,{transports:['websocket'],auth:{token:token('owner')}});sockets.push(controls);await event(controls,'connect');
const qa=event(restored,'question_started');const qb=event(b.socket,'question_started');controls.emit('start_game',{sessionId:game.id});
const firstA=await qa;const firstB=await qb;assert.equal(difficultyById.get(firstA.id),'easy');assert.equal(difficultyById.get(firstB.id),'easy');
const acceptedA=event(restored,'answer_received');const acceptedB=event(b.socket,'answer_received');
restored.emit('submit_answer',{questionId:firstA.id,response:{text:'Київ'},timeTaken:0});
b.socket.emit('submit_answer',{questionId:firstB.id,response:{text:'Київ'},timeTaken:0});
assert.equal((await acceptedA).correct,true);assert.equal((await acceptedB).correct,true);
console.log('Personalized questions accepted:',firstA.id!==firstB.id?'different questions for A and B':'same first slot, independent full sets');

await call('/game-sessions/'+game.id+'/finish','POST',{},token('owner'),201);
const balancedReport=await call('/session-reports/'+game.id,'GET',null,token('owner'));assert.equal(balancedReport.summary.totalQuestions,24);assert.equal(balancedReport.summary.poolQuestionCount,50);for(const p of balancedReport.players){assert.equal(p.assignedQuestionIds.length,24);assert.equal(p.totalQuestions,24);}
const progress=await call('/game-sessions','POST',{quizId:balanced.id,mode:'PROGRESS'},token('owner'),201);const c=await guest(progress.roomCode,'Balanced C');const qc=event(c.socket,'question_started');controls.emit('start_game',{sessionId:progress.id});assert.equal((await qc).totalQuestions,24);
console.log('Balanced sets: independent 24-question sets, 8/8/8, stable resume, Classic and Progress passed');
const cls=await call('/learning-classes','POST',{name:'Assigned class'},token('owner'),201);
assert.equal((await call('/learning-classes/my','GET',null,token('pupil'))).length,0);
await call('/learning-classes/join','POST',{code:cls.joinCode},null,401);
await call('/learning-classes/join','POST',{code:cls.joinCode},token('viewer'),403);
await call('/learning-classes/join','POST',{code:'bad-code'},token('pupil'),400);
await call('/learning-classes/join','POST',{code:cls.joinCode,studentId:users.viewer.user.id},token('pupil'),400);
const selfJoined=await call('/learning-classes/join','POST',{code:cls.joinCode.toLowerCase()},token('pupil'),201);assert.equal(selfJoined.joined,true);assert.equal(selfJoined.id,cls.id);assert.ok(!('students' in selfJoined));
assert.equal((await call('/learning-classes/join','POST',{code:cls.joinCode},token('pupil'),201)).joined,false);
assert.equal((await call('/learning-classes/my','GET',null,token('pupil')))[0].id,cls.id);

const studentProfile=await call('/account/student-summary','GET',null,token('pupil'));assert.match(studentProfile.studentCode,/^QZ-[A-F0-9]{12}$/);
assert.equal((await call('/account/student-summary','GET',null,token('pupil'))).studentCode,studentProfile.studentCode);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{studentCode:studentProfile.studentCode.toLowerCase()},token('owner'),201);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{studentCode:studentProfile.studentCode,email:pupilEmail},token('owner'),400);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{studentCode:'QZ-invalid'},token('owner'),400);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{email:pupilEmail.toUpperCase()},token('owner'),201);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{email:pupilEmail},token('owner'),201);
assert.equal((await call('/learning-classes','GET',null,token('owner'))).find(c=>c.id===cls.id).students.length,1);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{email:pupilEmail},token('viewer'),404);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{email:pupilEmail},token('pupil'),403);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{email:'missing@example.test'},token('owner'),404);
await call('/learning-classes/'+cls.id+'/students/existing','POST',{email:users.viewer.user.email},token('owner'),404);
await call('/learning-classes/'+cls.id+'/students/'+pupil.id,'PATCH',{password:'unwanted-password'},token('owner'),400);

const tomorrow=new Date(Date.now()+86400000).toISOString(),later=new Date(Date.now()+172800000).toISOString();
const futureQuiz=await call('/quizzes','POST',{title:'Future assigned quiz',availableFrom:tomorrow,questions:[{...question('Future'),timeLimit:1}]},token('owner'),201);
const futureAssignment=await call('/learning-classes/'+cls.id+'/assignments','POST',{quizId:futureQuiz.id,availableFrom:tomorrow,dueAt:later,maxAttempts:1},token('owner'),201);
let assigned=await call('/account/assignments','GET',null,token('pupil'));assert.equal(assigned.length,1);assert.equal(assigned[0].status,'UPCOMING');assert.ok(!assigned[0].roomCode);assert.ok(!('token' in assigned[0]));
assert.equal((await call('/account/assignments','GET',null,token('viewer'))).length,0);
async function rejectedJoin(code,authToken){const socket=io(base,{transports:['websocket'],auth:{token:authToken},autoConnect:false});sockets.push(socket);const connected=event(socket,'connect');socket.connect();await connected;const denied=event(socket,'join_error');socket.emit('join_session',{roomCode:code,nickname:'Blocked'});return denied;}
assert.match(await rejectedJoin(futureAssignment.roomCode,token('pupil')),/not available|не відкрито/);
assert.match(await rejectedJoin(futureAssignment.roomCode,token('viewer')),/призначено/);
const openQuiz=await call('/quizzes','POST',{title:'Open assigned quiz',questions:[{...question('One second'),timeLimit:1}]},token('owner'),201);
const openAssignment=await call('/learning-classes/'+cls.id+'/assignments','POST',{quizId:openQuiz.id,dueAt:later,maxAttempts:1},token('owner'),201);
const assignedPupil=await guest(openAssignment.roomCode,'Assigned Pupil',token('pupil'));
const ownFinish=event(assignedPupil.socket,'game_finished');const assignedQuestion=event(assignedPupil.socket,'question_started');assignedPupil.socket.emit('resume_session',assignedPupil.joined);await assignedQuestion;await ownFinish;
assigned=await call('/account/assignments','GET',null,token('pupil'));assert.equal(assigned.find(a=>a.id===openAssignment.id).status,'COMPLETED');
await call('/game-sessions/my/active','GET',null,token('owner'));
const assignedSession=await call('/game-sessions/by-code/'+openAssignment.roomCode);assert.equal(assignedSession.status,'RUNNING');
const secondPupil=await call('/learning-classes/'+cls.id+'/students','POST',{name:'Second Pupil',email:'second-pupil@example.test',password:'Quizzy-test-2026!'},token('owner'),201);
const secondLogin=await call('/auth/login','POST',{email:'second-pupil@example.test',password:'Quizzy-test-2026!'});
assert.equal((await call('/account/assignments','GET',null,secondLogin.accessToken)).find(a=>a.id===openAssignment.id).status,'OPEN');
await guest(openAssignment.roomCode,'Second Pupil',secondLogin.accessToken);
const overdue=await call('/learning-classes/'+cls.id+'/assignments','POST',{quizId:openQuiz.id,dueAt:new Date(Date.now()-60000).toISOString()},token('owner'),201);
assert.equal((await call('/account/assignments','GET',null,token('pupil'))).find(a=>a.id===overdue.id).status,'OVERDUE');
assert.match(await rejectedJoin(overdue.roomCode,token('pupil')),/Термін виконання/);

await call('/auth/signup','POST',{name:'Self Join Pupil',email:'self-join@example.test',password:'Quizzy-test-2026!'},null,201);
const selfLogin=await call('/auth/login','POST',{email:'self-join@example.test',password:'Quizzy-test-2026!'});
assert.equal((await call('/account/assignments','GET',null,selfLogin.accessToken)).length,0);
await call('/learning-classes/join','POST',{code:cls.joinCode},selfLogin.accessToken,201);
assert.equal((await call('/account/assignments','GET',null,selfLogin.accessToken)).find(a=>a.id===openAssignment.id).status,'OPEN');
console.log('Assignments: class-only visibility, scheduled opening, deadline, independent completion and late class participants passed');
console.log('Class self-join: authenticated student only, class code, no duplicate membership, assigned tests appear after joining');


const timedQuiz=await call('/quizzes','POST',{title:'Personalized deadline regression',showQuestionLeaderboard:true,trackTabSwitches:true,questionSelection:{easy:2,medium:0,hard:0},questions:Array.from({length:6},(_,i)=>({...question('Deadline '+i),difficulty:'easy',timeLimit:2}))},token('owner'),201);
assert.equal(timedQuiz.showQuestionLeaderboard,true);
const timed=await call('/game-sessions','POST',{quizId:timedQuiz.id},token('owner'),201);
const ta=await guest(timed.roomCode,'Timed A'),tb=await guest(timed.roomCode,'Timed B'),silent=await guest(timed.roomCode,'Silent');
const pupilPlayer=await guest(timed.roomCode,'Test Pupil',token('pupil'));
const activeSummary=await call('/account/student-summary','GET',null,token('pupil'));assert.equal(activeSummary.stats.attempts,1);assert.equal(activeSummary.teacherPromptSeen,true);
const isolated=new Client({...config,database:dbName});await isolated.connect();
try {for(const [i,p] of [ta,tb,silent].entries())await isolated.query('UPDATE session_players SET question_order=$1::jsonb WHERE id=$2',[JSON.stringify(timedQuiz.questions.slice(i*2,i*2+2).map(q=>q.id)),p.joined.playerId]);}finally{await isolated.end();}
const host=io(base,{transports:['websocket'],autoConnect:false,auth:{token:token('owner')}});sockets.push(host);const hc=event(host,'connect');host.connect();await hc;const hj=event(host,'host_joined');host.emit('host_join_session',{sessionId:timed.id});await hj;
let playerBoards=0;tb.socket.on('leaderboard',()=>playerBoards++);
let resultCount=0;host.on('question_results',()=>resultCount++);
const started=[ta,tb,silent].map(p=>event(p.socket,'question_started'));const result=event(host,'question_results'),board=event(host,'leaderboard'),silentTimeout=event(silent.socket,'answer_received');
host.emit('start_game',{sessionId:timed.id});const questions=await Promise.all(started);assert.notEqual(questions[0].id,questions[1].id);
const integrity=event(host,'integrity_updated');ta.socket.emit('integrity_event',{hidden:true,reason:'visibility'});assert.equal((await integrity).integrityEvents,1);ta.socket.emit('integrity_event',{hidden:false});
const accepted=[ta,tb].map(p=>event(p.socket,'answer_received'));[ta,tb].forEach((p,i)=>p.socket.emit('submit_answer',{questionId:questions[i].id,response:{text:'Київ'},timeTaken:0}));for(const answer of await Promise.all(accepted))assert.equal(answer.correct,true);
assert.equal((await silentTimeout).timedOut,true);assert.equal((await result).roundClosed,true);await board;await new Promise(r=>setTimeout(r,100));assert.equal(resultCount,1);assert.equal(playerBoards,1);
const next=event(tb.socket,'question_started');host.emit('next_question',{sessionId:timed.id});host.emit('next_question',{sessionId:timed.id});const nextQuestion=await next;assert.notEqual(nextQuestion.id,questions[1].id);
const finished=event(host,'game_finished');await finished;assert.equal(resultCount,2);
const timedReport=await call('/session-reports/'+timed.id,'GET',null,token('owner'));assert.equal(timedReport.players.length,4);
const learning=await call('/account/student-summary','GET',null,token('pupil'));assert.equal(learning.stats.attempts,2);assert.equal(learning.stats.questions,3);assert.equal(learning.stats.accuracy,0);assert.equal(learning.topics.length,1);
const review=await call('/account/student-review?playerId='+pupilPlayer.joined.playerId,'GET',null,token('pupil'));assert.equal(review.answers.length,2);
await call('/account/student-review?playerId='+pupilPlayer.joined.playerId,'GET',null,token('viewer'),404);
const hiddenQuiz=await call('/quizzes','POST',{title:'Hidden answers',feedbackMode:'END_SCORE_ONLY',questions:[question('Secret')]},token('owner'),201);
const hiddenGame=await call('/game-sessions','POST',{quizId:hiddenQuiz.id},token('owner'),201);
const hiddenPupil=await guest(hiddenGame.roomCode,'Hidden Pupil',token('pupil'));
await call('/game-sessions/'+hiddenGame.id+'/finish','POST',{},token('owner'),201);
await call('/account/student-review?playerId='+hiddenPupil.joined.playerId,'GET',null,token('pupil'),403);
await call('/account/teacher-prompt-seen','POST',{},token('pupil'),201);
assert.equal((await call('/account/student-summary','GET',null,token('pupil'))).teacherPromptSeen,true);
console.log('Student learning: private completed attempts, topic stats, scoped practice, hidden answers protected, one-time prompt persisted');
console.log('Personalized Classic: different answers accepted; silent-player timeout; one round result; duplicate Next ignored; final round completed; tab exit persisted');
await call('/quizzes/'+balanced.id+'/collaborators','POST',{email:users.viewer.user.email,role:'VIEWER'},token('owner'),201);
const sharedClass=await call('/learning-classes','POST',{name:'Shared quiz class'},token('viewer'),201);
await call('/learning-classes/'+sharedClass.id+'/students/existing','POST',{email:pupilEmail},token('viewer'),201);
const allAssignment=await call('/learning-classes/'+sharedClass.id+'/assignments','POST',{quizId:balanced.id,variantSettings:{questionMode:'all',randomForEachStudent:true},maxAttempts:2},token('viewer'),201);
const allParticipant=await guest(allAssignment.roomCode,'All Questions',token('pupil'));
const allSessionId=(await call('/game-sessions/by-code/'+allAssignment.roomCode)).id;
const allSession=await call('/game-sessions/'+allSessionId,'GET',null,token('viewer'));assert.equal(allSession.players[0].questionOrder.length,50);assert.equal(allSession.settings.questionCount,50);
assert.equal(allSession.settings.questionSelection.easy+allSession.settings.questionSelection.medium+allSession.settings.questionSelection.hard,50);
const countAssignment=await call('/learning-classes/'+sharedClass.id+'/assignments','POST',{quizId:balanced.id,variantSettings:{questionMode:'count',questionCount:7,randomForEachStudent:true}},token('viewer'),201);
await guest(countAssignment.roomCode,'Seven Questions',token('pupil'));
const countSessionId=(await call('/game-sessions/by-code/'+countAssignment.roomCode)).id;
const countSession=await call('/game-sessions/'+countSessionId,'GET',null,token('viewer'));assert.equal(countSession.players[0].questionOrder.length,7);
await call('/learning-classes/'+sharedClass.id+'/assignments','POST',{quizId:balanced.id,variantSettings:{questionMode:'count',questionCount:51}},token('viewer'),400);
await call('/learning-classes/'+sharedClass.id+'/assignments','POST',{quizId:balanced.id,availableFrom:later,dueAt:tomorrow},token('viewer'),400);
assert.deepEqual((await call('/quizzes/'+balanced.id,'GET',null,token('owner'))).questionSelection,{easy:8,medium:8,hard:8});

const repeatAssignment=await call('/learning-classes/'+cls.id+'/assignments','POST',{quizId:openQuiz.id,maxAttempts:2,variantSettings:{questionMode:'all'}},token('owner'),201);
for(let attempt=0;attempt<2;attempt++){const participant=await guest(repeatAssignment.roomCode,'Same Pupil',token('pupil'));const finish=event(participant.socket,'game_finished');participant.socket.emit('resume_session',participant.joined);await finish;}
assert.equal((await call('/account/assignments','GET',null,token('pupil'))).find(a=>a.id===repeatAssignment.id).status,'COMPLETED');
assert.match(await rejectedJoin(repeatAssignment.roomCode,token('pupil')),/attempt limit/);
const beforeClose=await call('/learning-classes/'+cls.id+'/statistics','GET',null,token('owner'));
assert.equal(beforeClose.rows.find(r=>r.assignmentId===repeatAssignment.id&&r.studentId===pupil.id).status,'COMPLETED');
assert.equal(beforeClose.rows.find(r=>r.assignmentId===futureAssignment.id&&r.studentId===pupil.id).status,'UPCOMING');
await call('/learning-classes/'+cls.id+'/statistics','GET',null,token('viewer'),404);
await call('/learning-classes/'+cls.id+'/statistics','GET',null,token('pupil'),403);
const unattempted=await call('/learning-classes/'+cls.id+'/assignments','POST',{quizId:openQuiz.id,maxAttempts:1,variantSettings:{questionMode:'all'}},token('owner'),201);
let classStats=await call('/learning-classes/'+cls.id+'/statistics','GET',null,token('owner'));
assert.equal(classStats.rows.find(r=>r.assignmentId===unattempted.id&&r.studentId===pupil.id).status,'NOT_STARTED');
const unattemptedSession=(await call('/game-sessions/by-code/'+unattempted.roomCode)).id;
await call('/game-sessions/'+unattemptedSession+'/finish','POST',{},token('owner'),201);
classStats=await call('/learning-classes/'+cls.id+'/statistics','GET',null,token('owner'));
assert.equal(classStats.rows.find(r=>r.assignmentId===unattempted.id&&r.studentId===pupil.id).status,'NOT_COMPLETED');
assert.equal(classStats.assignments.find(a=>a.id===unattempted.id).closed,true);
const classAccess=(await call('/learning-classes','GET',null,token('owner'))).find(c=>c.id===cls.id);assert.equal(classAccess.assignments.find(a=>a.id===unattempted.id).accessStatus,'CLOSED');assert.equal(classAccess.assignments.find(a=>a.id===futureAssignment.id).accessStatus,'SCHEDULED');assert.equal(classAccess.assignments.find(a=>a.id===repeatAssignment.id).accessStatus,'ACTIVE');assert.equal(classAccess.assignments.find(a=>a.id===unattempted.id).sessionId,unattemptedSession);
assert.match(await rejectedJoin(unattempted.roomCode,token('pupil')),/finished|заверш/i);
assert.equal(classStats.assignments.find(a=>a.id===unattempted.id).questionTypes.open_text,1);
assert.equal((await call('/quizzes/'+openQuiz.id,'GET',null,token('owner'))).timePenaltyEnabled,false);
await call('/quizzes/'+openQuiz.id,'PATCH',{title:'Open assigned quiz',questions:[{...question('One second'),timeLimit:1}],timePenaltyEnabled:true},token('owner'));
assert.equal((await call('/quizzes/'+openQuiz.id,'GET',null,token('owner'))).timePenaltyEnabled,true);
const timedSession=await call('/game-sessions','POST',{quizId:openQuiz.id},token('owner'),201);assert.equal(timedSession.settings.timePenaltyEnabled,true);
await call('/quizzes/'+openQuiz.id,'PATCH',{title:'Open assigned quiz',questions:[{...question('One second'),timeLimit:1}],timePenaltyEnabled:false},token('owner'));
assert.equal((await call('/game-sessions/'+timedSession.id,'GET',null,token('owner'))).settings.timePenaltyEnabled,true);
console.log('Class statistics: all members including never-started, upcoming/completed/closed status, question types, teacher isolation; time scoring setting persisted and frozen per session');
console.log('Class assignments: shared quiz permitted; All overrides quiz subset with all 50; custom 7-question balanced set; original quiz unchanged; invalid count/date rejected');


} finally {sockets.forEach(s=>s.disconnect());}
await call('/account/role','PATCH',{userId:users.editor.user.id,role:'STUDENT'},token('owner'));
await call('/question-bank','GET',null,token('editor'),403);
await call('/quizzes/my','GET',null,token('editor'),403);
await call('/quizzes/'+id,'DELETE',null,token('owner'));
console.log('Collaboration, audit and host isolation: '+checks+' HTTP checks passed');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(child){child.kill();await new Promise(r=>setTimeout(r,700));}if(admin._connected){await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1',[dbName]);await admin.query('DROP DATABASE IF EXISTS '+dbName);await admin.end();}console.log('Isolated test database removed');});
