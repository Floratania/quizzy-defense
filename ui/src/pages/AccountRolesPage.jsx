import {useSearchParams} from 'react-router-dom';
import {useEffect,useState} from 'react';
import {Alert,Button,Checkbox,Group,Paper,Stack,Text,TextInput,Title} from '@mantine/core';
import {useAuthContext} from '../context/AuthContext.jsx';
import apiClient from '../api/apiClient.js';
export default function AccountRolesPage(){
 const [params]=useSearchParams();const [onlyRequests,setOnlyRequests]=useState(params.get('requests')==='1');
 const {user}=useAuthContext();const [users,setUsers]=useState([]),[error,setError]=useState(''),[search,setSearch]=useState(''),[busy,setBusy]=useState(null);
 const load=async()=>{try{setUsers((await apiClient.get('/account/users')).data);}catch{setError('Немає доступу до керування ролями');}};
 useEffect(()=>{if(user?.role!=='ADMIN')return;load();const refresh=()=>load();window.addEventListener('teacher-requests-updated',refresh);return()=>window.removeEventListener('teacher-requests-updated',refresh);},[user?.role]);
 useEffect(()=>{if(params.get('requests')==='1')setOnlyRequests(true);},[params]);
 if(user?.role!=='ADMIN')return <Alert>Лише адміністратор керує ролями.</Alert>;
 const change=async(u,role)=>{setBusy(u.id);setError('');try{await apiClient.patch('/account/role',{userId:u.id,role});await load();window.dispatchEvent(new Event('teacher-request-reviewed'));}catch{setError('Не вдалося змінити роль');}finally{setBusy(null);}};
 return <Stack><Title order={2}>Користувачі та ролі</Title><Text c="dimmed">Підтверджуйте викладачів лише після перевірки їхньої особи. Роль викладача не відкриває чужі приватні банки.</Text><TextInput label="Пошук за ім’ям або поштою" value={search} onChange={e=>setSearch(e.currentTarget.value)}/><Checkbox label="Лише заявки викладачів" checked={onlyRequests} onChange={e=>setOnlyRequests(e.currentTarget.checked)}/>{error&&<Alert color="red">{error}</Alert>}{users.filter(u=>!onlyRequests||u.teacherRequested).filter(u=>(u.name+' '+u.email).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>Number(b.teacherRequested)-Number(a.teacherRequested)).map(u=><Paper key={u.id} withBorder p="md"><Group justify="space-between"><div><Text fw={600}>{u.name}</Text><Text size="sm">{u.email}</Text><Text size="sm">{{ADMIN:'Адміністратор',TEACHER:'Викладач',STUDENT:'Учень'}[u.role]}{u.teacherRequested?' · Заявка викладача':''}</Text></div>{u.role!=='ADMIN'&&<Button variant="default" loading={busy===u.id} onClick={()=>change(u,u.role==='TEACHER'?'STUDENT':'TEACHER')}>{u.role==='TEACHER'?'Зробити учнем':'Підтвердити викладача'}</Button>}</Group></Paper>)}</Stack>;
}
