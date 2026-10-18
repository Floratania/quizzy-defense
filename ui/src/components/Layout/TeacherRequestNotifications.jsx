import {useEffect,useState} from 'react';
import {Badge,Button,Group,Menu,Text} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {IconBell} from '@tabler/icons-react';
import {useNavigate} from 'react-router-dom';
import {useAuthContext} from '../../context/AuthContext.jsx';
import apiClient from '../../api/apiClient.js';

export default function TeacherRequestNotifications(){
 const {user}=useAuthContext();const navigate=useNavigate();const [requests,setRequests]=useState([]);
 useEffect(()=>{
  if(user?.role!=='ADMIN')return;
  let active=true,busy=false;
  const key=`quizzy:teacher-request-notified:${user.id}`;
  let seen=new Set();try{const stored=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(stored))seen=new Set(stored);}catch{}
  const load=async()=>{
   if(!active||busy||document.hidden)return;busy=true;
   try{
    const {data}=await apiClient.get('/account/teacher-requests');if(!active)return;
    setRequests(data);window.dispatchEvent(new CustomEvent('teacher-requests-updated',{detail:data}));
    const unseen=data.filter(r=>!seen.has(r.id));
    if(unseen.length){
     notifications.show({id:'new-teacher-requests',title:unseen.length===1?'Нова заявка викладача':`Нові заявки викладачів: ${unseen.length}`,message:unseen.map(r=>r.name).join(', '),autoClose:10000,onClick:()=>navigate('/admin/users?requests=1'),style:{cursor:'pointer'}});
    }
    seen=new Set(data.map(r=>r.id));try{localStorage.setItem(key,JSON.stringify([...seen].slice(-1000)));}catch{}
   }catch{/* Retry on the next poll; keep the last known count. */}finally{busy=false;}
  };
  load();const timer=setInterval(load,30000);window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);window.addEventListener('teacher-request-reviewed',load);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',load);window.removeEventListener('teacher-request-reviewed',load);};
 },[user?.id,user?.role,navigate]);
 if(user?.role!=='ADMIN')return null;
 return <Menu position="bottom-end" width={300}><Menu.Target><Button variant="default" leftSection={<IconBell size={18}/>} aria-label={`Заявки викладачів: ${requests.length}`}><Group gap={6}>Заявки{requests.length>0&&<Badge color="orange">{requests.length}</Badge>}</Group></Button></Menu.Target><Menu.Dropdown><Menu.Label>Заявки викладачів</Menu.Label>{!requests.length?<Text size="sm" c="dimmed" p="sm">Нових заявок немає</Text>:requests.slice(0,5).map(r=><Menu.Item key={r.id} onClick={()=>navigate('/admin/users?requests=1')}><Text size="sm" fw={600}>{r.name}</Text><Text size="xs" c="dimmed">{r.email}</Text></Menu.Item>)}<Menu.Divider/><Menu.Item onClick={()=>navigate('/admin/users?requests=1')}>Переглянути всі заявки</Menu.Item></Menu.Dropdown></Menu>;
}
