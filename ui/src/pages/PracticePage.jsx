import {useCallback,useEffect,useMemo,useState} from 'react';
import {useNavigate,useParams} from 'react-router';
import {Alert,Button,Group,Loader,Paper,Stack,Text,Title} from '@mantine/core';
import apiClient from '../api/apiClient.js';
import {PracticeProvider} from '../context/PlayerGameContext.jsx';
import {QuestionScreen} from '../components/PlayerPage/QuestionScreen.jsx';
import {gradePractice,playablePractice} from '../utils/practiceQuiz.js';

export default function PracticePage() {
    const {quizId}=useParams();const navigate=useNavigate();
    const [quiz,setQuiz]=useState(null);const [error,setError]=useState('');
    const [index,setIndex]=useState(0);const [results,setResults]=useState([]);
    useEffect(()=>{let active=true;apiClient.get(`/quizzes/${quizId}`).then(({data})=>{if(active){
        if(data.questionSelection) data.questions = ['easy','medium','hard'].flatMap(level => {
            const pool = data.questions.filter(q => (q.difficulty || 'medium') === level);
            for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
            return pool.slice(0,data.questionSelection[level]);
        });
        setQuiz(data);
    }}).catch(()=>{if(active)setError('Не вдалося завантажити квіз');});return()=>{active=false;};},[quizId]);
    const question=quiz?.questions?.slice().sort((a,b)=>a.position-b.position)[index];
    const playable=useMemo(()=>question?playablePractice(question):null,[question]);
    const submitAnswer=useCallback(payload=>setResults(current=>current[index]!==undefined?current:[...current,gradePractice(question,payload)]),[index,question]);
    if(error)return <Alert color="red">{error}</Alert>;
    if(!quiz)return <Loader />;
    return <Stack>
        <Alert color="violet">Тестовий перегляд очима учня. Сесія не створюється, результати не записуються у статистику.</Alert>
        {!question ? <Paper p="xl"><Title>Тестовий перегляд завершено</Title><Text>Середня правильність: {results.length?Math.round(results.reduce((a,b)=>a+b,0)/results.length*100):0}%</Text><Button mt="md" onClick={()=>navigate('/admin/quizzes')}>До вікторин</Button></Paper>
        : <>
            <Group justify="space-between"><Text>Питання {index+1}/{quiz.questions.length}</Text><Button variant="subtle" onClick={()=>navigate('/admin/quizzes')}>Вийти</Button></Group>
            {results[index]!==undefined ? <Paper p="xl"><Title order={3}>{results[index]===1?'Правильно':results[index]>0?'Частково правильно':'Неправильно'}</Title><Text>{Math.round(results[index]*100)}% правильності</Text><Button mt="md" onClick={()=>setIndex(index+1)}>Далі</Button></Paper>
            : <PracticeProvider submitAnswer={submitAnswer}><QuestionScreen key={question.id} question={playable}/></PracticeProvider>}
        </>}
    </Stack>;
}
