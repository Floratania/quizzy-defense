import {useEffect,useState} from 'react';
import {Alert,Button,Container,Loader,Stack,Text} from '@mantine/core';
import {Link,useNavigate} from 'react-router-dom';
import {useAuthContext} from '../context/AuthContext.jsx';
import {setAccessToken,clearAccessToken} from '../auth/tokenStore.js';
import {readBrowserSignIn,clearBrowserSignIn} from '../auth/browserSession.js';
import apiClient from '../api/apiClient.js';
// React StrictMode may run the effect twice; exchange each one-time code only once.
const exchanges=new Map();
export default function AuthCompletePage(){
 const {me}=useAuthContext(),navigate=useNavigate();const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;const params=new URLSearchParams(window.location.search),code=params.get('code'),saved=readBrowserSignIn();
  if(!code||!saved){clearAccessToken();setError('Сеанс завершився. Увійдіть ще раз, щоб продовжити.');return;}
  if(!exchanges.has(code))exchanges.set(code,apiClient.post('/auth/exchange',{code,verifier:saved.verifier}).then(({data})=>{setAccessToken(data.accessToken);return data;}));
  exchanges.get(code).then(async()=>{if(!active)return;await me();if(!active)return;clearBrowserSignIn();navigate(saved.returnTo||'/',{replace:true});}).catch(()=>{if(active){clearAccessToken();setError('Не вдалося відновити вхід. Натисніть «Увійти» та спробуйте ще раз.');}});
  return()=>{active=false;};
 },[]);
 return <Container size="sm" py="xl"><Stack>{error?<><Alert color="orange">{error}</Alert><Button component={Link} to={`/auth?next=${encodeURIComponent(readBrowserSignIn()?.returnTo||'/')}`} >Увійти</Button></>:<><Loader/><Text>Відновлюємо вхід…</Text></>}</Stack></Container>;
}
