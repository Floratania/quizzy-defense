import {JwtService} from '@nestjs/jwt';
import {GameFlowService} from './game-gateway.service';

describe('Player identity',()=>{
    const jwt=new JwtService({secret:'test-secret-only'});
    let player:any;
    let players:any;
    let flow:GameFlowService;
    const socket=(token?:string)=>({id:'socket',handshake:{auth:{token}},join:jest.fn(),emit:jest.fn()} as any);
    beforeEach(()=>{
        player={id:'p',session_id:'s',studentId:null,completedAt:true};
        players={getOne:jest.fn(async()=>player),resume:jest.fn(async()=>player),joinSession:jest.fn(),addSessionEvent:jest.fn(async()=>null)};
        flow=new GameFlowService(jwt,players,{getById:async()=>({settings:{}})} as any,{} as any,{} as any,{} as any,{} as any);
    });
    it('rejects forged student ID before joining',async()=>{
        await expect(flow.playerJoin(socket(),{roomCode:'123456',nickname:'test',studentId:9} as any)).rejects.toThrow('identity mismatch');
        expect(players.joinSession).not.toHaveBeenCalled();
    });
    it('rejects identity mismatch with valid JWT',async()=>{
        await expect(flow.playerJoin(socket(jwt.sign({id:8})),{studentId:9} as any)).rejects.toThrow('identity mismatch');
    });
    it('rejects guest resume by IDs alone',async()=>{
        await expect(flow.playerResume(socket(),'s','p')).rejects.toThrow('resume token');
        expect(players.resume).not.toHaveBeenCalled();
    });
    it('rejects token for another player',async()=>{
        await expect(flow.playerResume(socket(),'s','p',jwt.sign({purpose:'player-resume',playerId:'other',sessionId:'s'}))).rejects.toThrow('resume token');
    });
    it('allows guest resume with scoped token',async()=>{
        await flow.playerResume(socket(),'s','p',jwt.sign({purpose:'player-resume',playerId:'p',sessionId:'s'}));
        expect(players.resume).toHaveBeenCalled();
    });
    it('rejects another account',async()=>{
        player.studentId=9;
        await expect(flow.playerResume(socket(jwt.sign({id:8})),'s','p')).rejects.toThrow('another student');
    });
    it('allows owning account',async()=>{
        player.studentId=9;await flow.playerResume(socket(jwt.sign({id:9})),'s','p');
        expect(players.resume).toHaveBeenCalled();
    });
    it('rejects expired guest token',async()=>{
        await expect(flow.playerResume(socket(),'s','p',jwt.sign({purpose:'player-resume',playerId:'p',sessionId:'s'},{expiresIn:-1}))).rejects.toThrow('resume token');
    });
});
