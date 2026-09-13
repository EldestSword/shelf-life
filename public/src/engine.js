/* Pure game rules. No DOM, network calls or clocks hidden in this module. */
(function(root){'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./content.js'):root.SHELF_CONTENT;
const W=typeof module!=='undefined'&&module.exports?require('../data/words.js'):root.SHELF_WORDS;
const allowedWords=new Set(W.allowed.split(' '));
const MAX_TIER=6,SIZE=20,VERSION=1;
const recipe=id=>C.recipes.find(r=>r.id===id);
const section=id=>C.sections.find(s=>s.id===id);
const copy=o=>JSON.parse(JSON.stringify(o));
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function dateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function fresh(seed=839021,day=dateKey()){
 const s={version:VERSION,seed:seed>>>0,funds:60,xp:0,board:Array(SIZE).fill(null),upgrades:[],theme:'teal',served:0,merges:0,dishes:0,puzzles:0,discovered:[],catalogued:[],claimed:[],visits:Array(C.visitors.length).fill(0),requests:[],orderIndex:0,started:false,settings:{sound:false,motion:true,contrast:false},daily:{date:day,served:0,claimed:false},dailyPuzzle:null,practicePuzzle:null,practiceCount:0,stats:{best:0},seenEnding:false};
 s.board[0]={kind:'book',tier:1,section:'fiction'};s.board[1]={kind:'book',tier:1,section:'fiction'};
 s.board[5]={kind:'ingredient',id:'manchego',component:'manchego'};s.board[6]={kind:'ingredient',id:'manchego',component:'membrillo'};
 s.board[10]={kind:'book',tier:2,section:'essays'};s.board[11]={kind:'book',tier:2,section:'poetry'};
 s.catalogued=['fiction:1','essays:2','poetry:2'];
 s.requests=[{visitor:0,tier:2,section:'fiction',recipe:'manchego',serial:0},{visitor:1,tier:2,section:'essays',recipe:null,serial:1},{visitor:2,tier:3,section:'art-music',recipe:'wensleydale',serial:2}];s.orderIndex=3;return s;
}
function rawComponents(i){
 const r=recipe(i?.id);if(!r)return null;
 if(i.kind==='ingredient')return [i.component];
 if(i.kind==='cheese')return [r.components[0].id];
 if(i.kind==='prep'&&!Array.isArray(i.components))return [r.components[Math.min(1,r.components.length-1)].id];
 if(i.kind==='prep')return i.components;
 return null;
}
function orderedComponents(id,parts){const r=recipe(id);return r.components.map(c=>c.id).filter(x=>parts.includes(x));}
function validItem(i){
 if(i===null)return true;
 if(!i||typeof i!=='object')return false;
 if(i.kind==='book')return Number.isInteger(i.tier)&&i.tier>=1&&i.tier<=MAX_TIER&&(!i.section||!!section(i.section));
 const r=recipe(i.id);if(!r)return false;
 if(i.kind==='dish'||i.kind==='cheese')return true;
 if(i.kind==='ingredient')return r.components.some(c=>c.id===i.component);
 if(i.kind==='prep'&&!Array.isArray(i.components))return true;
 if(i.kind==='prep'){
   return i.components.length>=2&&i.components.length<r.components.length&&new Set(i.components).size===i.components.length&&i.components.every(x=>r.components.some(c=>c.id===x));
 }
 return false;
}
function normalItem(i){
 if(i===null)return null;
 if(i.kind==='book')return {kind:'book',tier:i.tier,section:section(i.section)?i.section:'fiction'};
 if(i.kind==='dish')return {kind:'dish',id:i.id};
 const parts=rawComponents(i);
 if(parts.length===1)return {kind:'ingredient',id:i.id,component:parts[0]};
 return {kind:'prep',id:i.id,components:orderedComponents(i.id,parts)};
}
function validatePuzzle(p){if(p===null)return null;if(!p||!Array.isArray(p.targets)||p.targets.length!==2||!p.targets.every(x=>W.answers.includes(x))||p.targets[0]===p.targets[1]||!Array.isArray(p.guesses)||p.guesses.length>9||!p.guesses.every(x=>allowedWords.has(x))||new Set(p.guesses).size!==p.guesses.length||typeof p.rewarded!=='boolean'||typeof p.date!=='string'||!(p.date==='practice'||/^\d{4}-\d{2}-\d{2}$/.test(p.date))||typeof p.input!=='string'||!/^[A-Z]{0,7}$/.test(p.input))throw Error('The word puzzle in this save is not valid.');const status=puzzleStatus(p);if(p.rewarded!==status.done||p.guesses.some((_,i)=>i<p.guesses.length-1&&p.targets.every(t=>p.guesses.slice(0,i+1).includes(t))))throw Error('The puzzle completion record is inconsistent.');return {targets:p.targets.slice(),guesses:p.guesses.slice(),rewarded:p.rewarded,date:p.date,input:p.input};}
function validate(x){
 if(!x||x.version!==VERSION||!Array.isArray(x.board)||x.board.length!==SIZE||!x.board.every(validItem))throw Error('That is not a valid Shelf Life save.');
 const s=fresh();s.board=x.board.map(normalItem);
 for(const k of ['funds','xp','served','merges','dishes','puzzles','orderIndex','practiceCount']){if(!Number.isSafeInteger(x[k])||x[k]<0||x[k]>100000000)throw Error('The save contains invalid progress.');s[k]=x[k];}
 if(!Number.isInteger(x.seed)||x.seed<0||x.seed>4294967295)throw Error('The save seed is invalid.');s.seed=x.seed;
 for(const [key,allowed] of [['upgrades',C.upgrades.map(u=>u.id)],['discovered',C.recipes.map(r=>r.id)],['claimed',C.achievements.map(a=>a.id)]]){if(!Array.isArray(x[key])||x[key].some(v=>!allowed.includes(v))||new Set(x[key]).size!==x[key].length)throw Error('The save has an unknown collection.');s[key]=x[key].slice();}
 const validCatalogue=C.sections.flatMap(a=>Array.from({length:MAX_TIER},(_,i)=>a.id+':'+(i+1)));
 const catalogue=x.catalogued??[...new Set(s.board.filter(i=>i?.kind==='book').map(i=>i.section+':'+i.tier))];
 if(!Array.isArray(catalogue)||catalogue.some(v=>!validCatalogue.includes(v))||new Set(catalogue).size!==catalogue.length)throw Error('The save has an invalid book catalogue.');s.catalogued=[...new Set(catalogue)];
 if(!Array.isArray(x.requests)||x.requests.length!==3||!x.requests.every(r=>r&&Number.isInteger(r.visitor)&&r.visitor>=0&&r.visitor<C.visitors.length&&Number.isInteger(r.tier)&&r.tier>=1&&r.tier<=MAX_TIER&&(!r.section||section(r.section))&&(r.recipe===null||recipe(r.recipe))&&Number.isSafeInteger(r.serial)&&r.serial>=0))throw Error('The visitor requests are invalid.');
 s.requests=x.requests.map(r=>({visitor:r.visitor,tier:r.tier,section:section(r.section)?r.section:(C.visitors[r.visitor].sections[0]||'fiction'),recipe:r.recipe,serial:r.serial}));
 if(!Array.isArray(x.visits)||![8,C.visitors.length].includes(x.visits.length)||!x.visits.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=100000000))throw Error('The visitor record is invalid.');s.visits=Array.from({length:C.visitors.length},(_,i)=>x.visits[i]||0);
 if(!x.daily||!/^\d{4}-\d{2}-\d{2}$/.test(x.daily.date)||!Number.isSafeInteger(x.daily.served)||x.daily.served<0||x.daily.served>100000000)throw Error('The daily record is invalid.');s.daily={date:x.daily.date,served:x.daily.served,claimed:!!x.daily.claimed};
 s.dailyPuzzle=validatePuzzle(x.dailyPuzzle);s.practicePuzzle=validatePuzzle(x.practicePuzzle);
 s.started=!!x.started;s.seenEnding=!!x.seenEnding&&x.upgrades.length===C.upgrades.length;
 const themeMap={sage:'teal',rose:'sea-glass',twilight:'midnight',teal:'teal','sea-glass':'sea-glass',midnight:'midnight'};s.theme=themeMap[x.theme]||'teal';
 s.settings={sound:!!x.settings?.sound,motion:x.settings?.motion!==false,contrast:!!x.settings?.contrast};
 s.stats={best:Number.isInteger(x.stats?.best)&&x.stats.best>=0&&x.stats.best<=9?x.stats.best:0};return s;
}
function rotateDay(s,day){if(s.daily.date!==day){s.daily={date:day,served:0,claimed:false};return true;}return false;}
function unlocked(s){return C.recipes.filter(r=>r.unlock<=s.served);}
function compatible(a,b){
 if(!a||!b)return null;
 if(a.kind==='book'&&b.kind==='book'&&a.tier===b.tier&&(a.section||'fiction')===(b.section||'fiction')&&a.tier<MAX_TIER)return {kind:'book',tier:a.tier+1,section:a.section||'fiction'};
 if(a.id!==b.id||!recipe(a.id)||a.kind==='dish'||b.kind==='dish')return null;
 const left=rawComponents(a),right=rawComponents(b);if(!left||!right||left.some(x=>right.includes(x)))return null;
 const parts=orderedComponents(a.id,[...left,...right]),r=recipe(a.id);
 if(parts.length!==left.length+right.length)return null;
 return parts.length===r.components.length?{kind:'dish',id:a.id}:{kind:'prep',id:a.id,components:parts};
}
function catalogue(s,item){if(item?.kind!=='book')return;const id=(item.section||'fiction')+':'+item.tier;if(!s.catalogued.includes(id))s.catalogued.push(id);}
function move(s,from,to,swap=false){if(!Number.isInteger(from)||!Number.isInteger(to)||from===to||from<0||to<0||from>=SIZE||to>=SIZE||!s.board[from])return {ok:false};const a=s.board[from],b=s.board[to],result=compatible(a,b);if(result){s.board[to]=result;s.board[from]=null;if(result.kind==='book'){s.merges++;s.xp+=2;catalogue(s,result);}else if(result.kind==='dish'){s.dishes++;s.xp+=4;if(!s.discovered.includes(result.id))s.discovered.push(result.id);}else{s.xp+=1;}return {ok:true,type:result.kind==='book'?'merge':result.kind==='dish'?'dish':'prep',item:result};}if(!b||swap){s.board[to]=a;s.board[from]=b;return {ok:true,type:'move'};}return {ok:false,type:'different'};}
function spawnBook(s,sectionId){const i=s.board.indexOf(null);if(i<0)return {ok:false,reason:'full'};const chosen=section(sectionId)?sectionId:C.sections[Math.floor(random(s)*C.sections.length)].id;let roll=random(s),tier=1;for(const [id,chance,level] of [['loft',.08,4],['rare',.15,3],['trolley',.25,2]]){if(!s.upgrades.includes(id))continue;if(roll<chance){tier=level;break;}roll-=chance;}const item={kind:'book',tier,section:chosen};s.board[i]=item;catalogue(s,item);return {ok:true,index:i,tier,section:chosen};}
function stockRecipe(s,id){const r=recipe(id);if(!r||r.unlock>s.served)return {ok:false,reason:'locked'};const empty=s.board.map((x,i)=>x===null?i:-1).filter(i=>i>=0);if(empty.length<r.components.length)return {ok:false,reason:'space',needed:r.components.length};const indices=empty.slice(0,r.components.length);r.components.forEach((c,n)=>{s.board[indices[n]]={kind:'ingredient',id,component:c.id};});return {ok:true,indices};}
function returnItem(s,i){if(!Number.isInteger(i)||i<0||i>=SIZE||!s.board[i])return false;s.board[i]=null;return true;}
function neededIndices(s,q){const a=s.board.findIndex(i=>i?.kind==='book'&&i.tier===q.tier&&(i.section||'fiction')===(q.section||'fiction'));const b=q.recipe?s.board.findIndex(i=>i?.kind==='dish'&&i.id===q.recipe):-1;return {book:a,dish:b,ready:a>=0&&(!q.recipe||b>=0)};}
function reward(s,q){let book=10*Math.pow(2,q.tier-1),food=q.recipe?recipe(q.recipe).value:0;const has=id=>s.upgrades.includes(id);if(has('bindery'))book*=1.1;if(has('dresser'))food*=1.15;let mult=1+(has('nook')?.05:0)+(has('club')?.10:0)+(has('listening')?.05:0)+(has('terrace')?.10:0)+(has('glass')?.10:0)+(has('periodicals')?.05:0)+(has('festival')?.15:0);return Math.round((book+food)*mult)+(has('lamps')?10:0)+(has('catalogue')?12:0)+(has('atlas')&&q.recipe?20:0);}
function newRequest(s,slot){const rs=unlocked(s),serial=s.orderIndex++,visitor=Math.floor(random(s)*C.visitors.length),prefs=C.visitors[visitor].sections;const chosen=prefs[Math.floor(random(s)*prefs.length)];const max=s.served<5?3:s.served<15?4:s.served<35?5:6;const tier=2+Math.floor(random(s)*Math.min(max-1,slot===1?2:max-1));const rid=slot===1?null:rs[Math.floor(random(s)*rs.length)].id;return {visitor,tier,section:chosen,recipe:rid,serial};}
function serve(s,index){const q=s.requests[index];if(!q)return {ok:false};const n=neededIndices(s,q);if(!n.ready)return {ok:false};const coins=reward(s,q),before=unlocked(s).length;s.board[n.book]=null;if(q.recipe)s.board[n.dish]=null;s.funds+=coins;s.xp+=10+q.tier*2;s.served++;s.daily.served++;s.visits[q.visitor]++;s.requests[index]=newRequest(s,index);return {ok:true,coins,newRecipes:unlocked(s).slice(before),visitor:q.visitor};}
function buy(s,id){const u=C.upgrades.find(x=>x.id===id);if(!u||s.upgrades.includes(id)||s.funds<u.price||(u.requires&&s.upgrades.length<u.requires))return false;s.funds-=u.price;s.upgrades.push(id);return true;}
function metric(s,key){if(key==='recipes')return s.discovered.length;if(key==='collections')return s.catalogued.length;if(key==='upgrades')return s.upgrades.length;return s[key]||0;}
function claim(s,id){const a=C.achievements.find(x=>x.id===id);if(!a||s.claimed.includes(id)||metric(s,a.metric)<a.goal)return false;s.claimed.push(id);s.funds+=a.reward;return true;}
function claimDaily(s){if(s.daily.claimed||s.daily.served<3)return false;s.daily.claimed=true;s.funds+=75;return true;}
function feedback(guess,target){if(guess.length!==target.length)throw Error('Word lengths must match.');const out=Array(target.length).fill(0),left={};for(let i=0;i<target.length;i++){if(guess[i]===target[i])out[i]=2;else left[target[i]]=(left[target[i]]||0)+1;}for(let i=0;i<guess.length;i++){if(out[i]!==2&&left[guess[i]]>0){out[i]=1;left[guess[i]]--;}}return out;}
function makePuzzle(seed,answers,date='practice'){if(answers.length<2)throw Error('Need at least two answers.');const rng={seed:seed>>>0};const a=Math.floor(random(rng)*answers.length);let b=Math.floor(random(rng)*(answers.length-1));if(b>=a)b++;return {targets:[answers[a],answers[b]],guesses:[],rewarded:false,date,input:''};}
function puzzleStatus(p){const solved=p.targets.map(t=>p.guesses.includes(t)),won=solved.every(Boolean);return {solved,won,done:won||p.guesses.length>=9};}
function submitGuess(s,p,word,allowed){word=word.toUpperCase();if(puzzleStatus(p).done)return {ok:false,message:'This puzzle is complete.'};if(!/^[A-Z]{7}$/.test(word))return {ok:false,message:'Seven letters, please.'};if(!allowed.has(word))return {ok:false,message:'Not in the offline word list. No guess used.'};if(p.guesses.includes(word))return {ok:false,message:'Already tried. No guess used.'};p.guesses.push(word);p.input='';const status=puzzleStatus(p);let coins=0;if(status.done&&!p.rewarded){p.rewarded=true;coins=status.won?140:status.solved.some(Boolean)?30:0;s.funds+=coins;if(status.won){s.puzzles++;if(!s.stats.best||p.guesses.length<s.stats.best)s.stats.best=p.guesses.length;}}return {ok:true,...status,coins};}
const E={VERSION,SIZE,MAX_TIER,recipe,section,copy,hash,random,dateKey,fresh,validate,rotateDay,unlocked,compatible,move,spawnBook,stockRecipe,returnItem,neededIndices,reward,serve,buy,metric,claim,claimDaily,feedback,makePuzzle,puzzleStatus,submitGuess};
if(typeof module!=='undefined'&&module.exports)module.exports=E;else root.SHELF_ENGINE=E;
})(typeof window!=='undefined'?window:globalThis);
