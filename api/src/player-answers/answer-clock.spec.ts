import {PlayerAnswersService} from './player-answers.service';
describe('Server answer clock',()=>{
    let saved:any;
    let service:PlayerAnswersService;
    beforeEach(()=>{
        jest.spyOn(Date,'now').mockReturnValue(100000);
        const player={id:'p',session_id:'s',totalScore:0,questionOrder:['q'],activeQuestionId:'q',questionStartedAt:new Date(95000),session:{status:'RUNNING',mode:'PROGRESS',quizId:'quiz'},currentQuestionIndex:0};
        const question={id:'q',quizId:'quiz',type:'multiple_choice',points:1000,timeLimit:10,answers:[{id:'a',isCorrect:true}]};
        service=new PlayerAnswersService({findOne:async()=>null,create:(x:any)=>x,save:async(x:any)=>{saved=x;}} as any,{findOne:async()=>player,save:async()=>{}} as any,{findOne:async()=>question} as any,{findOne:async()=>question.answers[0]} as any);
    });
    afterEach(()=>jest.restoreAllMocks());
    it('ignores client zero and applies server penalty',async()=>{
        const result=await service.submitAnswer('socket','q','a',undefined,0);
        expect(result.earnedPoints).toBe(950);expect(saved.timeTaken).toBe(5000);
    });
    it('accepts delayed timeout with zero points',async()=>{
        jest.spyOn(Date,'now').mockReturnValue(106000);
        const result=await service.submitAnswer('socket','q',undefined,{timedOut:true},11000);
        expect(result.earnedPoints).toBe(0);expect(saved.timeTaken).toBe(10000);
    });
    it('late correct answer becomes timeout',async()=>{
        jest.spyOn(Date,'now').mockReturnValue(106000);
        const result=await service.submitAnswer('socket','q','a',undefined,0);
        expect(result.correct).toBe(false);expect(result.earnedPoints).toBe(0);
    });
});
