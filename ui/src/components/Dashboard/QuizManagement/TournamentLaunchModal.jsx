import {useEffect,useState} from 'react';
import {Modal,Stack,Select,NumberInput,Group,Text,Button,Alert,Loader} from '@mantine/core';
import apiClient from '../../../api/apiClient.js';
const levels=[{value:'easy',label:'Легкі'},{value:'medium',label:'Середні'},{value:'hard',label:'Складні'}];
const names=['Кваліфікація','Півфінал','Фінал'];
export default function TournamentLaunchModal({quizId,onClose,onStarted}){
 const [quiz,setQuiz]=useState(null),[mode,setMode]=useState('AUTO'),[teams,setTeams]=useState('4'),[assignment,setAssignment]=useState('AUTO'),[stages,setStages]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setQuiz(null);setError('');setMode('AUTO');if(quizId)apiClient.get(`/quizzes/${quizId}`).then(({data})=>{if(!active)return;setQuiz(data);setStages(levels.map(({value})=>({selection:{easy:0,medium:0,hard:0,[value]:data.questionSelection?.[value]??data.questions.filter(q=>(q.difficulty||'medium')===value).length}})));}).catch(()=>{if(active)setError('Не вдалося завантажити питання.');});return()=>{active=false;};},[quizId]);
 const pool=Object.fromEntries(levels.map(({value})=>[value,quiz?.questions.filter(q=>(q.difficulty||'medium')===value).length||0]));
 const chosen=mode==='AUTO'?levels.map(({value})=>({selection:{easy:0,medium:0,hard:0,[value]:quiz?.questionSelection?.[value]??pool[value]}})):stages;
 const needed={easy:0,medium:0,hard:0};chosen.forEach(s=>levels.forEach(({value})=>needed[value]+=Number(s.selection[value])||0));
 const valid=chosen.length===3&&chosen.every(s=>levels.every(({value})=>Number.isInteger(s.selection[value])&&s.selection[value]>=0)&&Object.values(s.selection).reduce((a,b)=>a+b,0)>0)&&levels.every(({value})=>needed[value]<=pool[value]);
 const update=(i,field,value)=>setStages(current=>current.map((s,j)=>j===i?{...s,selection:{...s.selection,[field]:value}}:s));
 const start=async()=>{setBusy(true);setError('');try{const {data}=await apiClient.post('/game-sessions',{quizId,mode:'TOURNAMENT',tournamentTeamCount:Number(teams),teamAssignment:assignment,tournamentQuestionMode:mode,...(mode==='MANUAL'?{tournamentStagePlan:stages}:{})});onStarted(data);}catch(e){setError([e.response?.data?.message||'Не вдалося запустити турнір.'].flat().join(' '));}finally{setBusy(false);}};
 return <Modal opened={Boolean(quizId)} onClose={onClose} title="Запуск турніру" centered size="lg"><Stack>
 {error&&<Alert color="red">{error}</Alert>}
 {!quiz?<Loader/>:<>
 <Group grow><Select label="Команди" data={['4','8']} value={teams} onChange={setTeams}/><Select label="Розподіл учасників" data={[{value:'AUTO',label:'Автоматично'},{value:'CODES',label:'За кодами команд'}]} value={assignment} onChange={setAssignment}/></Group>
 <Select label="Розподіл питань" value={mode} onChange={setMode} data={[{value:'AUTO',label:'Автоматичний: легкі → середні → складні'},{value:'MANUAL',label:'Ручний: змішані рівні складності'}]}/>
 <Text size="sm" c="dimmed">У квізі: {pool.easy} легких, {pool.medium} середніх, {pool.hard} складних. Питання без позначеної складності вважаються середніми.</Text>
 {chosen.map((stage,i)=><Stack key={i} gap="xs"><Text size="sm" fw={600}>{names[i]} · {Object.values(stage.selection).reduce((sum,n)=>sum+(Number(n)||0),0)} питань</Text><Group grow>{levels.map(({value,label})=><NumberInput key={value} label={label} aria-label={`${names[i]}: ${label}`} value={stage.selection[value]} min={0} max={1000} allowDecimal={false} allowNegative={false} disabled={mode==='AUTO'} onChange={count=>update(i,value,count)}/>)}</Group></Stack>)}
 <Text size="sm">Разом: {chosen.reduce((sum,s)=>sum+Object.values(s.selection).reduce((a,b)=>a+(Number(b)||0),0),0)} питань. Усі учасники отримають однакову кількість питань кожного рівня на етапі; питання обираються випадково без повторів у межах особистого набору.</Text>
 {mode==='AUTO'&&<Text size="sm" c="dimmed">Використовуються квоти складності квізу, якщо вони задані; інакше — усі питання кожного рівня.</Text>}
 {!valid&&<Alert color="orange">Кожен етап повинен мати хоча б одне питання. Загальна потреба кожного рівня не може перевищувати кількість у квізі. Змініть ручний розподіл або додайте питання потрібної складності.</Alert>}
 <Button loading={busy} disabled={!valid} onClick={start}>Запустити турнір</Button>
 </>}
 </Stack></Modal>;
}
