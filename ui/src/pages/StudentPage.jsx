import {useState} from 'react';
import {Button,Container,Paper,Stack,Text,Title} from '@mantine/core';
import {Link,Navigate} from 'react-router-dom';
import {useAuthContext} from '../context/AuthContext.jsx';
import apiClient from '../api/apiClient.js';
export default function StudentPage(){
 const {user,loading,me}=useAuthContext();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 if(loading)return null;if(!user)return <Navigate to="/auth" replace/>;
 if(user.role!=='STUDENT')return <Navigate to="/admin" replace/>;
 return <Container size="sm" py="lg"><Paper withBorder p="lg"><Stack><Title order={2}>Кабінет учня</Title><Text>{user.name}, ваш акаунт дозволяє проходити тести. Банк питань і створення вікторин доступні підтвердженим викладачам.</Text><Button component={Link} to="/join">Приєднатися до тесту</Button><Text size="sm">Ви викладач? Надішліть заявку — адміністратор перевірить її та надасть роль.</Text><Button variant="default" disabled={user.teacherRequested} loading={busy} onClick={async()=>{setBusy(true);try{await apiClient.post('/account/teacher-request');await me();}catch{setError('Не вдалося надіслати заявку');}finally{setBusy(false);}}}>{user.teacherRequested?'Заявка викладача очікує підтвердження':'Подати заявку викладача'}</Button>{error&&<Text c="red">{error}</Text>}</Stack></Paper></Container>;
}
