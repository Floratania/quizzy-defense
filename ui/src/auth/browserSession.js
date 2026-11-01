const apiBase=(import.meta.env.VITE_API_URL||'http://localhost:3000').replace(/\/$/,'');
const key='quizzy:browser-sign-in';
const safePath=value=>typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')&&!value.startsWith('/auth')&&!/[\\\x00-\x1f]/.test(value)?value:'/';
export function desiredReturnPath(){
 const next=new URLSearchParams(window.location.search).get('next');
 if(next)return safePath(next);
 if(window.location.pathname==='/join'){const code=new URLSearchParams(window.location.search).get('code')||sessionStorage.getItem('quizzy:pending-room');if(code)return `/join?code=${encodeURIComponent(code)}`;}
 return safePath(window.location.pathname+window.location.search);
}
async function prepare(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));const verifier=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 sessionStorage.setItem(key,JSON.stringify({verifier,returnTo:desiredReturnPath(),created:Date.now()}));return challenge;
}
export function readBrowserSignIn(){try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');return saved&&Date.now()-saved.created<10*60*1000?saved:null;}catch{return null;}}
export function clearBrowserSignIn(){sessionStorage.removeItem(key);}
function formPost(path,fields){const form=document.createElement('form');form.method='POST';form.action=apiBase+path;for(const [name,value]of Object.entries(fields)){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input);}document.body.appendChild(form);form.submit();}
export async function beginGoogleSignIn(personalDataConsent=false){const challenge=await prepare();window.location.assign(`${apiBase}/auth/google?challenge=${encodeURIComponent(challenge)}&personalDataConsent=${personalDataConsent===true}`);}
export async function beginPasswordSignIn(email,password){const challenge=await prepare();formPost('/auth/browser-login',{email,password,challenge});return new Promise(()=>{});}
export async function beginSessionRestore(){const challenge=await prepare();window.location.assign(`${apiBase}/auth/restore?challenge=${encodeURIComponent(challenge)}`);return new Promise(()=>{});}
export function beginBrowserLogout(){clearBrowserSignIn();formPost('/auth/browser-logout',{});return new Promise(()=>{});}
