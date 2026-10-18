export function inspectQuiz(quiz) {
    const issues = [];
    const seen = new Map();
    if (!quiz.questions?.length) issues.push({severity:'error',message:'Квіз не містить питань'});
    for (const [index,q] of (quiz.questions || []).entries()) {
        const text = String(q.text || '').trim();
        const add = (message,severity='error') => issues.push({severity,message:`Питання ${index+1}: ${message}`});
        if (!text) add('порожній текст');
        const key = text.toLocaleLowerCase().replace(/\s+/g,' ');
        if (key && seen.has(key)) add(`дублює питання ${seen.get(key)+1}`,'warning');
        seen.set(key,index);
        if (!(Number(q.timeLimit)>0)) add('некоректний таймер');
        const answers=q.answers || [];
        if (['multiple_choice','true_false','multiple_response','open_text'].includes(q.type)) {
            if (!answers.length || answers.some(a=>!String(a.text||'').trim())) add('порожні варіанти відповідей');
            const correct=answers.filter(a=>a.isCorrect).length;
            if (q.type==='multiple_response' ? correct<2 : correct<1) add('недостатньо правильних відповідей');
            if (['multiple_choice','true_false'].includes(q.type) && correct!==1) add('має бути одна правильна відповідь');
        }
        if(q.type==='matching' && (!(q.configuration?.pairs?.length>=2) || q.configuration.pairs.some(p=>!p.left?.trim()||!p.right?.trim()))) add('заповніть щонайменше дві пари');
        if(['ordering','fill_blank'].includes(q.type)) {
            const items=q.configuration?.items || [];
            if(items.length<2 || items.some(i=>!i.text?.trim())) add('не заповнено елементи');
            const positions=items.map(i=>i.correctPosition);
            if(new Set(positions).size!==items.length || positions.some(p=>!Number.isInteger(p)||p<0||p>=items.length)) add('некоректний правильний порядок');
            if(q.type==='fill_blank' && ((text.match(/___/g)||[]).length!==items.length || items.length>8)) add('кількість пропусків і слів має збігатися (2–8)');
        }
    }
    return issues;
}

export async function checkQuizQuality(quiz) {
    const issues=inspectQuiz(quiz);
    const urls=[...new Set((quiz.questions||[]).flatMap(q=>[q.mediaUrl,...(q.answers||[]).map(a=>a.mediaUrl)]).filter(Boolean))];
    await Promise.all(urls.map(url=>new Promise(resolve=>{
        const image=new Image();
        let finished=false;
        const finish=ok=>{if(finished)return;finished=true;clearTimeout(timer);image.onload=null;image.onerror=null;if(!ok)issues.push({severity:'error',message:`Зображення недоступне: ${url}`});resolve();};
        const timer=setTimeout(()=>finish(false),7000);
        image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=url;
    })));
    return issues;
}
