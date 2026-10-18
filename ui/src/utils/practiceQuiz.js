export function gradePractice(q, {answerId,response={}}) {
    if(['multiple_choice','true_false'].includes(q.type)) return q.answers.find(a=>a.id===answerId)?.isCorrect ? 1:0;
    if(q.type==='open_text') return q.answers.some(a=>a.isCorrect && (q.configuration?.caseSensitive ? a.text.trim()===String(response.text||'').trim():a.text.trim().toLocaleLowerCase()===String(response.text||'').trim().toLocaleLowerCase())) ? 1:0;
    if(q.type==='multiple_response') {
        const correct=q.answers.filter(a=>a.isCorrect).map(a=>a.id);
        const selected=[...new Set(response.answerIds||[])];
        return correct.length ? Math.max(0,Math.min(1,selected.reduce((score,id)=>score+(correct.includes(id)?1:-1),0)/correct.length)):0;
    }
    if(q.type==='matching') {
        const pairs=q.configuration?.pairs||[];
        return pairs.length ? pairs.filter(p=>(response.matches||[]).some(m=>m.leftId===p.leftId&&m.rightId===p.rightId)).length/pairs.length:0;
    }
    const items=[...(q.configuration?.items||[])].sort((a,b)=>a.correctPosition-b.correctPosition);
    return items.length ? items.filter((item,index)=>item.id===response.order?.[index]).length/items.length:0;
}
export function playablePractice(q) {
    const shuffle=items=>[...items].sort(()=>Math.random()-0.5);
    return {...q, answers:(q.answers||[]).map(a=>({id:a.id,text:a.text,imageUrl:a.mediaUrl})), configuration:q.type==='matching'
        ? {leftItems:shuffle(q.configuration.pairs.map(p=>({id:p.leftId,text:p.left}))),rightItems:shuffle(q.configuration.pairs.map(p=>({id:p.rightId,text:p.right})))}
        : ['ordering','fill_blank'].includes(q.type) ? {items:shuffle(q.configuration.items.map(i=>({id:i.id,text:i.text})))} : q.configuration};
}
