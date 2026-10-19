import {GamePlayersService} from './game-players.service';
import {GamePlayersController} from './game-players.controller';

describe('Saved attempt availability',()=>{
 const repo={findOne:jest.fn()};
 const service=new GamePlayersService(repo as never,{} as never,{} as never);
 it('offers only waiting or running incomplete attempts',async()=>{
  for(const status of ['WAITING','RUNNING']){
   repo.findOne.mockResolvedValue({session:{status,settings:{}}});
   expect(await service.canResume('p','s')).toBe(true);
  }
  for(const player of [null,{session:{status:'FINISHED',settings:{}}},{completedAt:new Date(),session:{status:'RUNNING',settings:{classId:'c'}}},{eliminatedAt:new Date(),session:{status:'RUNNING',settings:{}}},{session:{status:'RUNNING',settings:{assignmentDueAt:'2000-01-01'}}}]){
   repo.findOne.mockResolvedValue(player);
   expect(await service.canResume('p','s')).toBe(false);
  }
 });
 it('does not expose attempt state without a matching resume proof',async()=>{
  const canResume=jest.fn(async()=>true),verify=jest.fn();
  const controller=new GamePlayersController({canResume} as never,{verify} as never);
  const dto={sessionId:'s',playerId:'p',resumeToken:'proof'};
  verify.mockReturnValue({purpose:'player-resume',playerId:'other',sessionId:'s'});
  expect(await controller.resumeStatus(dto)).toEqual({resumable:false});
  expect(canResume).not.toHaveBeenCalled();
  verify.mockReturnValue({purpose:'player-resume',playerId:'p',sessionId:'s'});
  expect(await controller.resumeStatus(dto)).toEqual({resumable:true});
 });
});
