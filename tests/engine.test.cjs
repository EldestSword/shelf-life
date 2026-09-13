'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../public/src/engine.js'),C=require('../public/src/content.js'),W=require('../public/data/words.js');
const fresh=()=>E.fresh(17,'2026-09-13'),allowed=new Set(W.allowed.split(' '));
test('exact-tier book merges preserve every tier and stop at six',()=>{for(let tier=1;tier<6;tier++){const s=fresh();s.board[0]={kind:'book',tier};s.board[1]={kind:'book',tier};assert.equal(E.move(s,0,1).type,'merge');assert.deepEqual(s.board[1],{kind:'book',tier:tier+1});assert.equal(s.board[0],null);assert.equal(s.merges,1);assert.equal(s.xp,2);}assert.equal(E.compatible({kind:'book',tier:6},{kind:'book',tier:6}),null);});
test('mismatched tiers and invalid moves do not mutate state',()=>{const s=fresh(),before=E.copy(s);assert.equal(E.move(s,0,11).ok,false);for(const indices of [[0,0],[-1,1],[0,20],[null,1],[0,NaN],[2,3]])assert.equal(E.move(s,...indices).ok,false);assert.deepEqual(s,before);});
test('all ten authentic recipes combine in either order, only their own components',()=>{for(const r of C.recipes){for(const reverse of [false,true]){const s=fresh();s.board[0]={kind:reverse?'prep':'cheese',id:r.id};s.board[1]={kind:reverse?'cheese':'prep',id:r.id};assert.equal(E.move(s,0,1).type,'dish');assert.deepEqual(s.board[1],{kind:'dish',id:r.id});assert.deepEqual(s.discovered,[r.id]);assert.equal(s.dishes,1);assert.equal(s.xp,4);}for(const other of C.recipes.filter(x=>x!==r))assert.equal(E.compatible({kind:'cheese',id:r.id},{kind:'prep',id:other.id}),null);assert.equal(E.compatible({kind:'cheese',id:r.id},{kind:'cheese',id:r.id}),null);assert.equal(E.compatible({kind:'dish',id:r.id},{kind:'prep',id:r.id}),null);}});
test('pantry locks, two-slot capacity and non-punitive return',()=>{const s=fresh();assert.equal(E.stockRecipe(s,'fondue').reason,'locked');s.board=Array.from({length:20},()=>({kind:'book',tier:1}));assert.equal(E.spawnBook(s).reason,'full');assert.equal(E.stockRecipe(s,'manchego').reason,'space');E.returnItem(s,0);E.returnItem(s,1);assert.equal(E.stockRecipe(s,'manchego').ok,true);assert.equal(s.funds,60);assert.equal(E.returnItem(s,100),false);});
test('fulfilment consumes exact required items and awards the specified funds',()=>{const s=fresh();assert.equal(E.serve(s,0).ok,false);E.move(s,5,6);const q=E.copy(s.requests[0]),n=E.neededIndices(s,q),funds=E.reward(s,q);assert.equal(funds,68);const result=E.serve(s,0);assert.equal(result.coins,funds);assert.equal(s.funds,128);assert.equal(s.board[n.book],null);assert.equal(s.board[n.dish],null);assert.equal(s.served,1);assert.equal(s.daily.served,1);assert.equal(s.visits[0],1);assert.equal(s.requests.length,3);assert.equal(s.orderIndex,4);});
test('larger books and wrong finished dishes cannot fulfil exact requests',()=>{const s=fresh();s.board=Array(20).fill(null);s.board[0]={kind:'book',tier:3};s.board[1]={kind:'dish',id:'manchego'};assert.equal(E.serve(s,0).ok,false);s.board[0].tier=2;s.board[1].id='wensleydale';assert.equal(E.serve(s,0).ok,false);});
test('reward calculation applies food percentage before room bonuses and flat amounts',()=>{const s=fresh();s.upgrades=['dresser','nook','club','terrace','glass','festival','lamps','atlas'];assert.equal(E.reward(s,s.requests[0]),Math.round((20+48*1.15)*1.5)+30);assert.equal(E.reward(s,s.requests[1]),40);});
test('purchases require funds, unique ownership and finale prerequisites',()=>{const s=fresh();assert.equal(E.buy(s,'trolley'),false);s.funds=10000;assert.equal(E.buy(s,'festival'),false);assert.equal(E.buy(s,'missing'),false);assert.equal(E.buy(s,'trolley'),true);assert.equal(s.funds,9820);assert.equal(E.buy(s,'trolley'),false);for(const u of C.upgrades.filter(x=>!['trolley','festival'].includes(x.id)))assert.equal(E.buy(s,u.id),true);s.funds=2000;assert.equal(E.buy(s,'festival'),true);assert.equal(s.upgrades.length,12);});
test('delivery upgrades create higher tiers with repeatable seeded randomness',()=>{const a=fresh(),b=fresh();a.upgrades=b.upgrades=['trolley','rare','loft'];const seen=new Set();for(let i=0;i<1000;i++){a.board=Array(20).fill(null);b.board=Array(20).fill(null);const x=E.spawnBook(a),y=E.spawnBook(b);assert.deepEqual(x,y);seen.add(x.tier);}assert.deepEqual([...seen].sort(),[1,2,3,4]);});
test('daily jobs pay once and a skipped date never removes funds or progress',()=>{const s=fresh();assert.equal(E.claimDaily(s),false);s.daily.served=3;assert.equal(E.claimDaily(s),true);assert.equal(E.claimDaily(s),false);assert.equal(s.funds,135);assert.equal(E.rotateDay(s,'2026-10-01'),true);assert.equal(s.funds,135);assert.deepEqual(s.daily,{date:'2026-10-01',served:0,claimed:false});assert.equal(E.rotateDay(s,'2026-10-01'),false);});
test('milestones pay exactly once and only when earned',()=>{const s=fresh();assert.equal(E.claim(s,'first'),false);s.served=1;assert.equal(E.claim(s,'first'),true);assert.equal(s.funds,100);assert.equal(E.claim(s,'first'),false);assert.equal(E.claim(s,'unknown'),false);});
test('save validation preserves the changed board, not the starter board',()=>{const s=fresh();E.move(s,0,1);E.move(s,5,6);E.spawnBook(s);const v=E.validate(s);assert.deepEqual(v,s);v.board[1].tier=6;assert.equal(s.board[1].tier,2);});
test('malformed saves are rejected across progress, board, collections and requests',()=>{for(const mutate of [s=>s.version=900,s=>s.board.pop(),s=>s.board[0]={kind:'book',tier:7},s=>s.board[1]={kind:'dish',id:'fiction'},s=>s.funds=-1,s=>s.seed=NaN,s=>s.upgrades=['trolley','trolley'],s=>s.discovered=['fake'],s=>s.requests[0].visitor=80,s=>s.requests[0].tier=0,s=>s.visits=[],s=>s.daily.served=-1,s=>s.dailyPuzzle={targets:['INVALID','UNKNOWN'],guesses:[],rewarded:false}]){const s=fresh();mutate(s);assert.throws(()=>E.validate(s));}});
test('duplicate-letter scoring reserves greens then consumes remaining letters',()=>{assert.deepEqual(E.feedback('BALLOON','COLONEL'),[0,0,2,1,1,1,1]);assert.deepEqual(E.feedback('TESSERA','TESSERA'),[2,2,2,2,2,2,2]);assert.deepEqual(E.feedback('AAAAAAA','FARRAGO'),[0,2,0,0,2,0,0]);assert.deepEqual(E.feedback('BANANAS','ANODYNE'),[0,1,1,0,1,0,0]);assert.throws(()=>E.feedback('SHORT','TOOLONG'));});
test('feedback multiplicity never exceeds target counts over 2401 generated cases',()=>{const words=[];for(let i=0;i<49;i++)words.push(Array.from({length:7},(_,j)=>'ABC'[Math.floor(i/3**j)%3]).join(''));for(const target of words)for(const guess of words){const f=E.feedback(guess,target);for(const ch of 'ABC')assert.ok(f.filter((x,i)=>x>0&&guess[i]===ch).length<=target.split(ch).length-1);for(let i=0;i<7;i++)assert.equal(f[i]===2,guess[i]===target[i]);}});
test('dual puzzle partial solve stays open, full win rewards once and updates best',()=>{const s=fresh(),p=E.makePuzzle(19,W.answers);assert.equal(E.submitGuess(s,p,p.targets[0],allowed).done,false);assert.deepEqual(E.puzzleStatus(p).solved,[true,false]);assert.equal(s.funds,60);const r=E.submitGuess(s,p,p.targets[1],allowed);assert.equal(r.won,true);assert.equal(r.coins,140);assert.equal(s.puzzles,1);assert.equal(s.stats.best,2);assert.equal(E.submitGuess(s,p,'ACERBIC',allowed).ok,false);assert.equal(s.funds,200);s.dailyPuzzle=p;assert.doesNotThrow(()=>E.validate(s));});
test('nine shared guesses produce a loss or a partial reward, never a penalty',()=>{for(const partial of [false,true]){const s=fresh(),p=E.makePuzzle(19,W.answers);const misses=W.answers.filter(x=>!p.targets.includes(x)).slice(0,9);if(partial)misses[0]=p.targets[0];let result;for(const w of misses)result=E.submitGuess(s,p,w,allowed);assert.equal(result.done,true);assert.equal(result.won,false);assert.equal(result.coins,partial?30:0);assert.equal(s.funds,partial?90:60);assert.equal(s.puzzles,0);}});
test('invalid and repeated guesses cost nothing; input is normalised',()=>{const s=fresh(),p=E.makePuzzle(19,W.answers);assert.equal(E.submitGuess(s,p,'XX',allowed).ok,false);assert.equal(E.submitGuess(s,p,'ZZZZZZZ',allowed).ok,false);assert.equal(p.guesses.length,0);assert.equal(E.submitGuess(s,p,'acerbic',allowed).ok,true);assert.equal(E.submitGuess(s,p,'ACERBIC',allowed).ok,false);assert.equal(p.guesses.length,1);});
test('daily puzzle selection is deterministic by local date and has distinct targets',()=>{const day=E.dateKey(new Date(2026,8,13,23,59));assert.equal(day,'2026-09-13');const get=d=>E.makePuzzle(E.hash('ShelfLife.daily.v1.'+d),W.answers,d);assert.deepEqual(get(day),get(day));assert.notDeepEqual(get(day).targets,get('2026-09-14').targets);for(let i=0;i<1000;i++){const p=E.makePuzzle(i,W.answers);assert.notEqual(...p.targets);}assert.throws(()=>E.makePuzzle(0,['ACERBIC']));});
test('impossible puzzle saves cannot acquire rewards or missing definitions',()=>{const s=fresh();s.dailyPuzzle=E.makePuzzle(4,W.answers);s.dailyPuzzle.rewarded=true;assert.throws(()=>E.validate(s));s.dailyPuzzle.rewarded=false;s.dailyPuzzle.targets[0]='ZZZZZZZ';assert.throws(()=>E.validate(s));});
test('a complete campaign reaches all upgrades and recipes using only legal actions',()=>{
 const s=E.fresh(17,'2026-09-13');let actions=0;
 const move=(a,b)=>{assert.equal(E.move(s,a,b).ok,true);actions++;};
 for(let served=0;served<250&&s.upgrades.length<12;served++){
  const slot=served%3,q=s.requests[slot];
  while(!s.board.some(i=>i?.kind==='book'&&i.tier===q.tier)){
   let merged=false;
   for(let tier=1;tier<q.tier;tier++){
    const pair=s.board.map((x,i)=>x?.kind==='book'&&x.tier===tier?i:-1).filter(i=>i>=0);
    if(pair.length>1){move(pair[0],pair[1]);merged=true;break;}
   }
   if(!merged){
    if(!s.board.includes(null)){const i=s.board.findIndex(x=>x?.kind!=='book'||x.tier>q.tier);assert.ok(i>=0,'Board deadlock');E.returnItem(s,i);actions++;}
    assert.equal(E.spawnBook(s).ok,true);actions++;
   }
   assert.ok(actions<20000,'Campaign did not progress');
  }
  if(q.recipe&&!s.board.some(i=>i?.kind==='dish'&&i.id===q.recipe)){
   while(s.board.filter(x=>x===null).length<2){const i=s.board.findIndex(x=>x&&(x.kind!=='book'||x.tier!==q.tier));assert.ok(i>=0);E.returnItem(s,i);actions++;}
   assert.equal(E.stockRecipe(s,q.recipe).ok,true);actions++;
   move(s.board.findIndex(x=>x?.kind==='cheese'&&x.id===q.recipe),s.board.findIndex(x=>x?.kind==='prep'&&x.id===q.recipe));
  }
  assert.equal(E.serve(s,slot).ok,true);actions++;
  for(const u of C.upgrades)if(E.buy(s,u.id))actions++;
  for(const a of C.achievements)E.claim(s,a.id);
  E.claimDaily(s);
 }
 assert.equal(s.upgrades.length,12);assert.equal(s.discovered.length,10);assert.equal(s.served,52);assert.doesNotThrow(()=>E.validate(s));
});
