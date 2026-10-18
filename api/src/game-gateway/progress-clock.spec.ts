import {GameFlowService} from './game-gateway.service';
describe('Progress server timeout',()=>{
    afterEach(()=>jest.useRealTimers());
    it('advances once without a browser timeout',async()=>{
        jest.useFakeTimers();
        const player={id:'p',session_id:'s',socketId:'socket',currentQuestionIndex:0,activeQuestionId:'q'};
        const question={id:'q',type:'multiple_choice',timeLimit:1,answers:[],text:'test'};
        const sessions={getRoundState:async()=>({totalQuestions:2,session:{quiz:{}}}),getPlayerQuestion:async()=>question,getById:async()=>({mode:'PROGRESS',quiz:{feedbackMode:'IMMEDIATE'}})};
        const answers={hasPlayerAnswered:async()=>false,submitAnswer:jest.fn(async()=>({sessionId:'s',playerId:'p',correct:false}))};
        const emit=jest.fn();
        const flow=new GameFlowService({} as any,{getOne:async()=>player,startQuestionClock:async()=>{}} as any,sessions as any,answers as any,{} as any,{} as any,{server:{to:()=>({emit})}} as any);
        const advance=jest.spyOn(flow as any,'advanceProgressPlayer').mockResolvedValue(undefined);
        await (flow as any).sendProgressQuestion(player);
        await jest.advanceTimersByTimeAsync(1000);
        expect(answers.submitAnswer).toHaveBeenCalledTimes(1);
        expect(advance).toHaveBeenCalledWith('s','p');
    });
});
