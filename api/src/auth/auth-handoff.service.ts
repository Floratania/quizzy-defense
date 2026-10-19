import {Injectable,UnauthorizedException,ServiceUnavailableException} from '@nestjs/common';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
@Injectable()
export class AuthHandoffService {
 private codes=new Map<string,{token:string,challenge:string,expires:number}>();
 issue(token:string,challenge:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(challenge))throw new UnauthorizedException('Invalid browser challenge');
  for(const [key,value] of this.codes)if(value.expires<=Date.now())this.codes.delete(key);
  if(this.codes.size>=1000)throw new ServiceUnavailableException('Try signing in again shortly');
  const code=randomBytes(32).toString('hex');this.codes.set(code,{token,challenge,expires:Date.now()+120000});return code;
 }
 exchange(code:string,verifier:string){
  const stored=this.codes.get(code);
  if(!stored||stored.expires<=Date.now()||!/^[A-Za-z0-9_-]{43,128}$/.test(verifier))throw new UnauthorizedException('Sign-in link expired');
  const challenge=createHash('sha256').update(verifier).digest('base64url');
  if(!timingSafeEqual(Buffer.from(challenge),Buffer.from(stored.challenge)))throw new UnauthorizedException('Browser verification failed');
  this.codes.delete(code);return {accessToken:stored.token};
 }
}
