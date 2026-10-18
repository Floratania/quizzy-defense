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
for(let i=0;i<90;i++){try{await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,500));}if(i===89)throw new Error('Server failed to start');}
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
await call('/quizzes/'+id,'DELETE',null,token('owner'));
console.log('Collaboration, audit and host isolation: '+checks+' HTTP checks passed');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{if(child){child.kill();await new Promise(r=>setTimeout(r,700));}if(admin._connected){await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1',[dbName]);await admin.query('DROP DATABASE IF EXISTS '+dbName);await admin.end();}console.log('Isolated test database removed');});
