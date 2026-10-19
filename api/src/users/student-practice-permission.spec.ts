import {StudentLearningService} from './student-learning.service';
describe('Teacher practice permission',()=>{
 const make=()=>{const answers={getPlayerFinalResult:jest.fn()};const player={id:'p',completedAt:new Date(),session:{status:'FINISHED',quiz:{allowMistakePractice:false,feedbackMode:'END_WITH_ANSWERS',topic:'SQL'}}};return {answers,service:new StudentLearningService({getRepository:()=>({find:async()=>[player]})} as any,answers as any)};};
 it('rejects a direct attempt review when practice is disabled',async()=>{const {service,answers}=make();await expect(service.review(1,'p')).rejects.toThrow('Викладач вимкнув');expect(answers.getPlayerFinalResult).not.toHaveBeenCalled();});
 it('excludes disabled attempts from topic reinforcement',async()=>{const {service,answers}=make();expect(await service.review(1,undefined,'SQL')).toEqual({answers:[]});expect(answers.getPlayerFinalResult).not.toHaveBeenCalled();});
});
