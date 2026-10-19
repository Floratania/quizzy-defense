import {socket,getSocketAuthToken} from './socket.js';
import {getAccessToken} from '../auth/tokenStore.js';
import apiClient from '../api/apiClient.js';
let connecting=null;
function nearExpiry(token){try{const payload=JSON.parse(atob(token.split('.')[1].replaceAll('-','+').replaceAll('_','/')));return !payload.exp||payload.exp*1000<=Date.now()+5000;}catch{return true;}}
export const connectionService={
 async ensureConnected(){
  const token=getAccessToken();if(token&&nearExpiry(token))await apiClient.get('/auth/me');
  const current=getAccessToken()||undefined;
  if(socket.connected&&getSocketAuthToken()===current)return;
  if(connecting)return connecting;
  if(socket.connected)socket.disconnect();
  connecting=new Promise((resolve,reject)=>{
   const cleanup=()=>{clearTimeout(timer);socket.off('connect',connected);socket.off('connect_error',failed);};
   const connected=()=>{cleanup();resolve();};const failed=()=>{cleanup();reject(new Error('Не вдалося підключитися до сервера гри'));};
   const timer=setTimeout(failed,10000);socket.once('connect',connected);socket.once('connect_error',failed);socket.connect();
  });
  try{await connecting;}finally{connecting=null;}
 },
 disconnect(){if(socket.connected)socket.disconnect();}
};
