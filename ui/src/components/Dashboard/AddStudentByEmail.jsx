import {useState} from 'react';
import {Alert,Button,Modal,SegmentedControl,Stack,Text,TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import apiClient from '../../api/apiClient.js';
export default function AddStudentByEmail({classId,onClose,onAdded}) {
 const [method,setMethod]=useState('code'),[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const {data}=await apiClient.post(`/learning-classes/${classId}/students/existing`,method==='code'?{studentCode:email.trim().toUpperCase()}:{email:email.trim()});notifications.show({message:`${data.name}: додано до класу`,color:'green'});onAdded();}catch(e){setError(e.response?.data?.message||'Не вдалося додати учня');}finally{setBusy(false);}};
 return <Modal opened onClose={onClose} title="Додати учня до класу" centered><form onSubmit={submit}><Stack><Text size="sm" c="dimmed">Попросіть учня скопіювати особистий код або email з кабінету Quizzy. Його пароль не потрібен.</Text><SegmentedControl value={method} onChange={value=>{setMethod(value);setEmail('');setError('');}} data={[{value:'code',label:'За кодом'},{value:'email',label:'За поштою'}]}/><TextInput type={method==='email'?'email':'text'} required label={method==='code'?'Особистий код учня':'Email учня'} placeholder={method==='code'?'QZ-XXXXXXXXXXXX':'student@example.com'} value={email} onChange={e=>setEmail(e.currentTarget.value)}/>{error&&<Alert color="red">{error}</Alert>}<Button type="submit" loading={busy}>Додати до класу</Button></Stack></form></Modal>;
}
