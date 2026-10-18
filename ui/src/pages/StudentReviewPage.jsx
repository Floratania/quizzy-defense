import {useEffect,useState} from 'react';
import {Alert,Button,Container,Loader} from '@mantine/core';
import {Link,useSearchParams} from 'react-router-dom';
import apiClient from '../api/apiClient.js';
import {PracticeProvider} from '../context/PlayerGameContext.jsx';
import {MistakePracticeContent} from './MistakePracticePage.jsx';
export default function StudentReviewPage(){
 const [params]=useSearchParams(),[result,setResult]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;setResult(null);setError('');apiClient.get('/account/student-review',{params:{playerId:params.get('playerId')||undefined,topic:params.get('topic')||undefined}}).then(({data})=>{if(active)setResult(data);}).catch(()=>{if(active)setError('Повторення недоступне. Перевірте вхід в акаунт і дозвіл викладача на перегляд відповідей.');});return()=>{active=false;};},[params]);
 if(error)return <Container py="lg"><Alert color="gray">{error}</Alert><Button component={Link} to="/student" mt="md">До кабінету</Button></Container>;
 if(!result)return <Container py="lg"><Loader/></Container>;
 return <PracticeProvider><MistakePracticeContent savedResult={result}/></PracticeProvider>;
}
