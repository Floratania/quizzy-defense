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
for(let i=0;i<180;i++){try{await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,500));}if(i===179)throw new Error('Server failed to start');}
const users={};
for(const role of ['owner','viewer','editor','stranger']){const email=role+'@collaboration.example.test';const password='Quizzy-test-2026!';await call('/auth/signup','POST',{email,password,name:role+' teacher'},null,201);users[role]=await call('/auth/login','POST',{email,password});}
const token=key=>users[key].accessToken;
const question=text=>({text,type:'open_text',timeLimit:30,points:1000,answers:[{text:'Київ',isCorrect:true},{text:'Kyiv',isCorrect:true}]});
const payload={title:'Collaboration check',questions:[question('First'),question('Second')]};
const quiz=await call('/quizzes','POST',payload,token('owner'),201); const id=quiz.id;
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
async function guest(code,name){const socket=io(base,{transports:['websocket'],autoConnect:false});sockets.push(socket);const connected=event(socket,'connect');socket.connect();await connected;const joined=event(socket,'joined_successfully');socket.emit('join_session',{roomCode:code,nickname:name});return {socket,joined:await joined};}
try {
const levels=['easy','medium','hard'];
const pool=levels.flatMap((difficulty,level)=>Array.from({length:level===0?18:16},(_,i)=>({...question(difficulty+' '+i),difficulty})));
const balanced=await call('/quizzes','POST',{title:'Balanced 50',questionSelection:{easy:8,medium:8,hard:8},questions:pool},token('owner'),201);
const difficultyById=new Map(balanced.questions.map(q=>[q.id,q.difficulty]));
const game=await call('/game-sessions','POST',{quizId:balanced.id},token('owner'),201);
const a=await guest(game.roomCode,'Balanced A');const b=await guest(game.roomCode,'Balanced B');
let state=await call('/game-sessions/'+game.id);
for(const p of state.players){assert.equal(p.questionOrder.length,24);assert.equal(new Set(p.questionOrder).size,24);for(const level of levels)assert.equal(p.questionOrder.filter(id=>difficultyById.get(id)===level).length,8);}
const firstOrder=state.players.find(p=>p.id===a.joined.playerId).questionOrder;
assert.notDeepEqual(firstOrder,state.players.find(p=>p.id===b.joined.playerId).questionOrder);
const restored=io(base,{transports:['websocket'],autoConnect:false});sockets.push(restored);let connected=event(restored,'connect');restored.connect();await connected;const resumed=event(restored,'session_resumed');restored.emit('resume_session',{...a.joined});await resumed;
state=await call('/game-sessions/'+game.id);assert.deepEqual(firstOrder,state.players.find(p=>p.id===a.joined.playerId).questionOrder);
const qa=event(restored,'question_started');const qb=event(b.socket,'question_started');restored.emit('start_game',{sessionId:game.id});
assert.equal(difficultyById.get((await qa).id),'easy');assert.equal(difficultyById.get((await qb).id),'easy');
await call('/game-sessions/'+game.id+'/finish','POST',{},token('owner'),201);
const balancedReport=await call('/session-reports/'+game.id,'GET',null,token('owner'));assert.equal(balancedReport.summary.totalQuestions,24);assert.equal(balancedReport.summary.poolQuestionCount,50);for(const p of balancedReport.players){assert.equal(p.assignedQuestionIds.length,24);assert.equal(p.totalQuestions,24);}
const progress=await call('/game-sessions','POST',{quizId:balanced.id,mode:'PROGRESS'},token('owner'),201);const c=await guest(progress.roomCode,'Balanced C');const qc=event(c.socket,'question_started');c.socket.emit('start_game',{sessionId:progress.id});assert.equal((await qc).totalQuestions,24);
console.log('Balanced sets: independent 24-question sets, 8/8/8, stable resume, Classic and Progress passed');
} finally {sockets.forEach(s=>s.disconnect());}
await call('/quizzes/'+id,'DELETE',null,token('owner'));
console.log('Collaboration, audit and host isolation: '+checks+' HTTP checks passed');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(child){child.kill();await new Promise(r=>setTimeout(r,700));}if(admin._connected){await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1',[dbName]);await admin.query('DROP DATABASE IF EXISTS '+dbName);await admin.end();}console.log('Isolated test database removed');});
