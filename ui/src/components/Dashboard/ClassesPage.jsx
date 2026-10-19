import React,{useEffect,useState} from 'react';
import {Alert,Badge,Button,Card,Container,Group,NumberInput,Paper,Select,Stack,Table,Text,TextInput,Title} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {Link} from 'react-router-dom';
import apiClient from '../../api/apiClient.js';
import {useQuizzes} from '../../hooks/useQuizzes.js';
import {useAuthContext} from '../../context/AuthContext.jsx';
import AddStudentByEmail from './AddStudentByEmail.jsx';
const message=e=>{const value=e.response?.data?.message||e.message||'Не вдалося виконати дію';return Array.isArray(value)?value.join('; '):value;};
export default function ClassesPage(){
 const {user}=useAuthContext();
 const [classes,setClasses]=useState([]),[name,setName]=useState(''),[emailClassId,setEmailClassId]=useState(null);
 const [quizId,setQuizId]=useState(null),[details,setDetails]=useState(null),[detailsLoading,setDetailsLoading]=useState(false);
 const [questionMode,setQuestionMode]=useState('all'),[count,setCount]=useState(10),[maxAttempts,setMaxAttempts]=useState(1);
 const [availableFrom,setAvailableFrom]=useState(''),[dueAt,setDueAt]=useState(''),[assigning,setAssigning]=useState(null),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const {quizzes,loading:quizzesLoading,error:quizzesError,fetchQuizzes}=useQuizzes();
 const load=async()=>{const {data}=await apiClient.get('/learning-classes');setClasses(data);};
 useEffect(()=>{load().catch(e=>setError(message(e)));},[]);
 useEffect(()=>{if(!quizId){setDetails(null);return;}let active=true;setDetails(null);setDetailsLoading(true);setError('');apiClient.get(`/quizzes/${quizId}`).then(({data})=>{if(active){setDetails(data);setCount(current=>Math.min(Number(current)||10,data.questions.length));}}).catch(e=>{if(active)setError(message(e));}).finally(()=>{if(active)setDetailsLoading(false);});return()=>{active=false;};},[quizId]);
 const action=async(fn)=>{setError('');try{await fn();await load();}catch(e){setError(message(e));}};
 const create=()=>action(async()=>{if(!name.trim())return;await apiClient.post('/learning-classes',{name:name.trim()});setName('');});
 const addStudent=id=>action(async()=>{const studentName=prompt("Ім'я учня");if(!studentName)return;const email=prompt('Email нового учня');if(!email)return;const password=prompt('Тимчасовий пароль (мінімум 8 символів)');if(!password)return;await apiClient.post(`/learning-classes/${id}/students`,{name:studentName,email,password});notifications.show({color:'green',message:'Акаунт учня створено й додано до класу'});});
 const editStudent=(classId,student)=>action(async()=>{const studentName=prompt("Ім'я учня",student.name);if(!studentName)return;const email=prompt('Email учня',student.email);if(!email)return;const password=prompt('Новий пароль (порожнє — без зміни)','');if(password===null)return;await apiClient.patch(`/learning-classes/${classId}/students/${student.id}`,{name:studentName,email,...(password?{password}:{})});notifications.show({color:'green',message:'Дані учня оновлено'});});
 const assign=async cls=>{
  setError('');setSuccess('');
  if(!quizId||!details){setError('Оберіть вікторину в налаштуваннях призначення вище.');return;}
  if(questionMode==='count'&&(!Number.isInteger(Number(count))||count<1||count>details.questions.length)){setError(`Оберіть від 1 до ${details.questions.length} питань або «Усі питання».`);return;}
  if(availableFrom&&dueAt&&new Date(availableFrom)>=new Date(dueAt)){setError('Дата початку має бути раніше дедлайну.');return;}
  setAssigning(cls.id);
  try{
   await apiClient.post(`/learning-classes/${cls.id}/assignments`,{quizId,availableFrom:availableFrom?new Date(availableFrom).toISOString():undefined,dueAt:dueAt?new Date(dueAt).toISOString():undefined,maxAttempts:Number(maxAttempts),variantSettings:{questionMode,...(questionMode==='count'?{questionCount:Number(count)}:{}),randomForEachStudent:true}});
   setSuccess(`«${details.title}» призначено класу «${cls.name}». Учні побачать його у своїх кабінетах.`);await load();
  }catch(e){setError(message(e));}finally{setAssigning(null);}
 };
 const copy=async(text,label)=>{try{await navigator.clipboard.writeText(text);notifications.show({message:label});}catch{setError('Не вдалося скопіювати. Скопіюйте вручну.');}};
 return <Container size="xl"><Stack gap="md"><Title>Класи та учні</Title>{error&&<Alert color="red" title="Не вдалося виконати дію">{error}</Alert>}{success&&<Alert color="green">{success}</Alert>}
 <Card withBorder><Group align="end"><TextInput label="Назва нового класу" value={name} onChange={e=>setName(e.currentTarget.value)} style={{flex:1}}/><Button onClick={create} disabled={!name.trim()}>Створити клас</Button></Group></Card>
 <Card withBorder><Stack gap="sm"><Title order={4}>Налаштування призначення</Title>{quizzesError&&<Alert color="red">Не вдалося завантажити вікторини. <Button variant="subtle" size="xs" onClick={fetchQuizzes}>Повторити</Button></Alert>}
 <Select label="Вікторина" placeholder={quizzesLoading?'Завантаження…':'Оберіть вікторину для класу'} searchable clearable nothingFoundMessage="Вікторин не знайдено" disabled={quizzesLoading||Boolean(assigning)} data={quizzes.map(q=>({value:q.id,label:`${q.title}${q.accessRole!=='OWNER'?' · спільний доступ':''}`}))} value={quizId} onChange={value=>{setQuizId(value);setSuccess('');}}/>
 {!quizzesLoading&&!quizzesError&&!quizzes.length&&<Text size="sm">Доступних вікторин поки немає. <Button component={Link} to="/admin/quizzes/new" size="xs" variant="subtle">Створити вікторину</Button></Text>}
 <Group align="end"><Select label="Питань у персональному варіанті" value={questionMode} onChange={setQuestionMode} allowDeselect={false} data={[{value:'all',label:details?`Усі питання (${details.questions.length})`:'Усі питання'},{value:'count',label:'Задати кількість'}]} w={250}/>{questionMode==='count'&&<NumberInput label="Кількість питань" min={1} max={details?.questions.length} allowDecimal={false} value={count} onChange={setCount} w={160}/>}<NumberInput label="Кількість спроб" min={1} max={100} allowDecimal={false} value={maxAttempts} onChange={setMaxAttempts} w={160}/><TextInput type="datetime-local" label="Доступний з (необов’язково)" value={availableFrom} onChange={e=>setAvailableFrom(e.currentTarget.value)}/><TextInput type="datetime-local" label="Виконати до (необов’язково)" value={dueAt} onChange={e=>setDueAt(e.currentTarget.value)}/></Group>
 <Text size="xs" c="dimmed">{detailsLoading?'Завантаження питань…':details?`У банку квізу ${details.questions.length} питань. «Усі питання» призначає весь цей набір; «Задати кількість» формує випадкові варіанти з однаковою кількістю питань кожної складності.`:'Спочатку оберіть вікторину, потім натисніть «Призначити квіз» біля потрібного класу.'}</Text></Stack></Card>
 {classes.map(cls=><Paper key={cls.id} withBorder p="lg"><Group justify="space-between"><div><Title order={3}>{cls.name}</Title><Group gap="xs"><Text size="sm" c="dimmed">Код класу: {cls.joinCode}</Text><Button variant="subtle" size="xs" onClick={()=>copy(cls.joinCode,'Код класу скопійовано')}>Копіювати код</Button></Group></div><Group><Button variant="default" onClick={()=>setEmailClassId(cls.id)}>Додати за кодом або поштою</Button><Button variant="light" onClick={()=>addStudent(cls.id)}>Створити акаунт учня</Button><Button color="teal" loading={assigning===cls.id} disabled={!quizId||!details||detailsLoading||Boolean(assigning&&assigning!==cls.id)} onClick={()=>assign(cls)}>Призначити квіз</Button></Group></Group>
 <Title order={5} mt="md">Учні</Title><Table><Table.Tbody>{cls.students.map(s=><Table.Tr key={s.id}><Table.Td>{s.name}</Table.Td><Table.Td>{s.email}</Table.Td><Table.Td><Group><Badge>Акаунт учня</Badge>{s.managedByTeacherId===user?.id&&<Button size="xs" variant="light" onClick={()=>editStudent(cls.id,s)}>Редагувати</Button>}</Group></Table.Td></Table.Tr>)}</Table.Tbody></Table>
 <Title order={5} mt="md">Завдання</Title>{!cls.assignments.length&&<Text size="sm" c="dimmed">Поки немає призначених тестів.</Text>}{cls.assignments.map(a=><Group key={a.id} mt="xs"><Text>{a.quizTitle}</Text><Badge variant="light">{a.variantSettings?.questionMode==='all'?'Усі питання':a.variantSettings?.questionCount?`${a.variantSettings.questionCount} питань`:'За налаштуваннями квізу'}</Badge><Text size="xs" c="dimmed">Спроб: {a.maxAttempts}</Text><Button size="xs" variant="subtle" onClick={()=>copy(`${location.origin}/join?code=${a.roomCode}`,'Посилання скопійовано')}>Копіювати посилання</Button></Group>)}</Paper>)}
 </Stack>{emailClassId&&<AddStudentByEmail classId={emailClassId} onClose={()=>setEmailClassId(null)} onAdded={()=>{setEmailClassId(null);load().catch(e=>setError(message(e)));}}/>}</Container>;
}
