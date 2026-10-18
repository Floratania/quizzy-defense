const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/player-answers/player-answers.service.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText;
const types = Object.fromEntries(['MULTIPLE_CHOICE','TRUE_FALSE','MULTIPLE_RESPONSE','OPEN_TEXT','MATCHING','ORDERING','FILL_BLANK'].map(key => [key, key.toLowerCase()]));
const exported = {};
vm.runInNewContext(compiled, { exports: exported, require: () => ({ Injectable: () => () => {}, InjectRepository: () => () => {}, QuestionType: types }), });
const service = new exported.PlayerAnswersService();
let failed = 0;
function check(name, question, selected, response, expected) {
    const actual = service.calculateCorrectness(question, selected, response);
    try { assert.equal(actual, expected); console.log('PASS', name); }
    catch { failed++; console.log('FAIL', name, { expected, actual }); }
}
check('single correct', {type:'multiple_choice'}, {isCorrect:true}, {}, 1);
check('single wrong', {type:'multiple_choice'}, {isCorrect:false}, {}, 0);
check('true false', {type:'true_false'}, {isCorrect:true}, {}, 1);
const multiple = {type:'multiple_response',answers:[{id:'a',isCorrect:true},{id:'b',isCorrect:true},{id:'c',isCorrect:false}]};
check('multiple full', multiple, null, {answerIds:['a','b']}, 1);
check('multiple partial', multiple, null, {answerIds:['a']}, 0.5);
check('multiple all selected penalty', multiple, null, {answerIds:['a','b','c']}, 0.5);
check('duplicate IDs cannot inflate score', multiple, null, {answerIds:['a','a','a']}, 0.5);
check('text normalization', {type:'open_text',answers:[{isCorrect:true,text:'Київ'}]}, null, {text:'  КИЇВ '}, 1);
check('matching partial', {type:'matching',configuration:{pairs:[{leftId:'l1',rightId:'r1'},{leftId:'l2',rightId:'r2'}]}}, null, {matches:[{leftId:'l1',rightId:'r1'}]}, 0.5);
for (const type of ['ordering','fill_blank']) {
    const question = {type,configuration:{items:[{id:'a',correctPosition:0},{id:'b',correctPosition:1},{id:'c',correctPosition:2}]}};
    check(type+' full', question, null, {order:['a','b','c']}, 1);
    check(type+' partial', question, null, {order:['a','c','b']}, 1/3);
    check(type+' timeout', question, null, {timedOut:true}, 0);
}
process.exitCode = failed ? 1 : 0;
