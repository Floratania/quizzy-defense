export function quizErrors(questions: Array<{text: string; type: string; timeLimit: number; answers: Array<{text:string;isCorrect:boolean}>; configuration?: any}>) {
    const errors: string[]=[];
    if(!questions.length) errors.push('Quiz requires questions');
    questions.forEach((q,index)=>{
        const add=(message:string)=>errors.push(`Question ${index+1}: ${message}`);
        if(!q.text?.trim()) add('empty text');
        if(!(q.timeLimit>0)) add('invalid time limit');
        if(['multiple_choice','multiple_response','true_false','open_text'].includes(q.type)) {
            const correct=q.answers.filter(a=>a.isCorrect).length;
            if(!q.answers.length||q.answers.some(a=>!a.text.trim())) add('empty answers');
            if(q.type==='multiple_response'?correct<2:correct<1) add('missing correct answers');
            if(['multiple_choice','true_false'].includes(q.type)&&correct!==1) add('requires one correct answer');
        }
        if(q.type==='matching'&&(!(q.configuration?.pairs?.length>=2)||q.configuration.pairs.some((p:any)=>!p.left?.trim()||!p.right?.trim())))add('invalid pairs');
        if(['ordering','fill_blank'].includes(q.type)) {
            const items=q.configuration?.items||[];
            if(items.length<2||items.some((i:any)=>!i.text?.trim()))add('empty items');
            const positions=items.map((i:any)=>i.correctPosition);
            if(new Set(positions).size!==items.length||positions.some((p:any)=>!Number.isInteger(p)||p<0||p>=items.length))add('invalid ordering');
            if(q.type==='fill_blank'&&((q.text.match(/___/g)||[]).length!==items.length||items.length>8))add('invalid blanks');
        }
    });
    return errors;
}
