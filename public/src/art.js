/* Original pixel-cluster artwork. All coordinates sit on an integer logical grid. */
(function(root){'use strict';
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const poly=(p,c)=>`<polygon points="${p}" fill="${c}"/>`;
const svg=(w,h,body,cls='pixel-art')=>`<svg class="${cls}" preserveAspectRatio="xMidYMid slice" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
const P={ink:'#26292a',hair:'#45352f',h2:'#65483a',h3:'#886044',h4:'#a57b53',skin:'#d69b79',s2:'#edb995',s3:'#f6cfa9',shadow:'#ae7460',blush:'#cf8c78',coat:'#34443e',c2:'#4e6050',c3:'#72806a',gold:'#c9a950',cream:'#f0dfba',red:'#965443',navy:'#38474c',brown:'#574039'};
function figure(mood='idle',variant=0){
 const p={...P};if(variant){const skins=['#d69b79','#a97856','#e6bea0','#a46c4f','#edd0b0','#c49473','#d7a87e','#c09377'];const coats=['#34443e','#47596b','#776071','#93614c','#587353','#40566b','#7e5947','#5b5470'];p.skin=skins[variant%8];p.coat=coats[variant%8];p.hair=['#59443b','#38332f','#c0b3a0','#332f2a','#978a71','#45352f','#b58255','#797b76'][variant%8];p.h2=p.hair;p.h3=variant%2?'#70665a':'#b7a28b';}
 let b='';const r=(x,y,w,h,c)=>b+=rect(x,y,w,h,c),q=(s,c)=>b+=poly(s,c);
 // Softly stepped outline, loose bun and swept hair; 64 × 80, 25 colours.
 if(!variant) q('31,3 34,1 42,1 46,4 48,9 46,14 40,17 30,14 27,9',p.hair);
 if(!variant){q('32,4 35,3 41,3 44,5 45,9 42,12 33,12 30,9',p.h2);r(35,4,6,2,p.h3);r(41,6,3,3,p.h3);r(32,9,3,2,p.h4);}
 q('19,12 25,8 36,8 43,11 47,17 48,29 46,41 43,47 20,46 15,37 14,23 16,16',p.hair);
 q('18,19 22,13 32,11 40,13 43,17 39,19 26,17 21,21 18,31',p.h2);
 q('20,17 25,13 34,12 38,14 27,15 23,18',p.h3);r(25,13,7,1,p.h4);
 q('22,20 29,17 36,18 41,21 44,27 43,37 40,43 34,47 27,45 22,41 19,34 19,25',p.skin);
 q('23,22 29,19 36,20 40,23 41,31 38,37 33,42 28,41 23,37 21,29',p.s2);
 q('25,22 29,20 34,20 36,22 34,25 27,25',p.s3);r(23,32,3,4,p.s3);r(37,32,3,3,p.s3);
 q('19,28 17,28 17,33 20,35',p.skin);r(18,30,1,3,p.shadow);q('43,28 46,28 46,33 43,35',p.skin);
 r(23,35,4,2,p.blush);r(37,35,4,2,p.blush);r(31,29,2,5,p.skin);r(32,33,2,1,p.shadow);
 // Tortoiseshell frames have two-pixel rims with amber flecks and pale lens glints.
 q('19,25 21,24 29,24 31,26 33,26 35,24 43,24 45,26 44,32 41,34 35,34 32,29 30,29 28,34 22,34 19,31',p.hair);
 r(21,26,8,5,p.s2);r(22,31,6,1,p.skin);r(35,26,8,5,p.s2);r(36,31,6,1,p.skin);
 r(20,25,3,1,p.h4);r(27,25,2,1,p.h3);r(35,24,3,1,p.h4);r(41,32,2,1,p.h4);r(20,30,1,2,p.h3);
 r(21,26,3,1,'#d9d9c7');r(35,26,3,1,'#d9d9c7');
 if(mood==='unimpressed'){r(23,28,5,1,p.hair);r(36,28,5,1,p.hair);r(25,29,2,1,p.ink);r(38,29,2,1,p.ink);r(28,39,8,1,p.shadow);r(23,22,6,1,p.hair);r(36,22,6,1,p.hair);}
 else if(mood==='celebratory'){q('23,29 24,27 27,27 29,29 27,29 26,28 25,29',p.hair);q('36,29 37,27 40,27 42,29 40,29 39,28 38,29',p.hair);q('26,37 38,37 37,41 34,43 30,42 27,40',p.shadow);r(28,37,8,2,p.cream);r(31,41,4,1,p.blush);}
 else {r(24,28,4,2,p.cream);r(37,28,4,2,p.cream);r(25,28,2,3,p.ink);r(38,28,2,3,p.ink);r(25,28,1,1,p.s3);r(38,28,1,1,p.s3);if(mood==='pleased'){q('27,37 37,37 36,40 33,42 29,40',p.shadow);r(28,37,8,2,p.cream);}else{r(29,38,7,1,p.shadow);r(30,39,5,1,p.blush);}}
 q('15,29 17,35 21,40 20,47 17,44 15,36',p.h2);r(17,36,1,7,p.h3);q('44,19 46,22 46,39 43,45 41,43 43,35',p.h2);r(45,23,1,12,p.h3);
 r(27,44,10,7,p.shadow);r(28,44,8,6,p.skin);
 // Striped top, checked overshirt, trousers and shoes.
 q('20,47 26,46 31,49 37,46 43,48 48,55 48,65 44,68 42,65 41,71 23,71 21,65 17,68 13,64 15,54',p.ink);
 q('22,49 27,48 31,51 37,48 41,51 40,69 23,69',p.coat);r(27,51,10,17,p.navy);
 for(const y of [52,58,64]){r(27,y,10,2,p.gold);r(27,y+2,10,1,p.red);}
 q('20,49 25,48 27,51 26,68 21,68 20,59 18,65 14,64 16,55',p.coat);
 q('38,49 43,50 46,55 47,63 43,65 41,58 42,69 37,69',p.coat);
 r(21,51,2,16,p.c2);r(39,52,2,15,p.c2);r(17,55,5,2,p.c2);r(16,61,5,1,p.c2);r(41,55,4,2,p.c2);r(42,61,4,1,p.c2);r(23,53,2,4,p.c3);r(39,59,1,1,p.gold);r(25,62,1,1,p.gold);
 r(14,64,5,4,p.skin);r(15,64,3,2,p.s2);r(43,64,5,4,p.skin);r(44,64,3,2,p.s2);
 r(24,69,16,3,p.brown);r(24,72,7,5,p.navy);r(33,72,7,5,p.navy);r(25,72,2,4,'#586168');r(34,72,2,4,'#586168');r(22,77,9,2,p.ink);r(33,77,10,2,p.ink);r(22,77,7,1,p.brown);r(34,77,8,1,p.brown);
 return b;
}
function lou(mood='idle'){return `<span class="lou-character" data-expression="${mood}">${['idle','pleased','unimpressed','celebratory'].map(m=>svg(64,80,figure(m),'pixel-art lou-frame expression-'+m)).join('')}</span>`;}
function visitor(index){return svg(64,64,rect(0,0,64,64,'#283c36')+`<g transform="translate(0,-2)">${figure(index%3===0?'unimpressed':'pleased',index+1)}</g>`,'pixel-art visitor-art');}
function book(tier=1){let b='';const colours=['#ad6552','#467f86','#817398','#5c8769','#ba924e','#718995'];for(let i=0;i<Math.min(tier,4);i++){const y=40-i*8,x=9+(i%2)*5,c=colours[(tier-1)%6];b+=rect(x-2,y+2,39,8,'#172627')+rect(x,y,37,8,c)+rect(x+4,y+2,30,4,'#d8cbb0')+rect(x+5,y+3,28,1,'#b8ac95')+rect(x+1,y,2,8,'#d2af61')+rect(x+3,y,33,1,c);}if(tier>=5)b+=rect(28,12,4,28,'#c9a950');if(tier===6)b+=poly('28,8 31,5 34,8 31,11','#edcd77');return svg(56,56,b,'pixel-art item-art');}
function food(id,kind){const ids=['manchego','wensleydale','raclette','rarebit','aligot','halloumi','khachapuri','pao','saganaki','fondue'];const n=Math.max(0,ids.indexOf(id));let b='';const r=(x,y,w,h,c)=>b+=rect(x,y,w,h,c),q=(s,c)=>b+=poly(s,c);const plate=()=>{q('7,37 12,31 44,31 50,37 48,44 42,47 14,47 7,42','#809082');q('8,36 14,32 43,32 49,37 45,42 13,42','#e0d6b7');r(16,43,26,2,'#aaa58b');};
 if(kind==='cheese'){q('12,38 16,18 37,14 45,23 45,41 13,43','#ba8e42');q('15,36 18,19 38,17 41,22 41,38','#e6c66f');q('18,19 38,17 41,22 19,24','#f5d990');r(24,27,3,3,'#cda951');r(35,32,3,4,'#cda951');r(17,39,25,2,'#947548');if([1,5,6].includes(n)){q('15,36 18,19 38,17 41,22 41,38','#ece1b7');r(25,27,2,2,'#d4c89e');}if(n===9)b+=rect(7,31,12,11,'#d7b665');}
 else if(kind==='prep'){if(n===0){q('9,26 27,23 31,27 31,40 9,42','#8d3e35');r(11,27,17,11,'#b45140');r(12,27,15,2,'#d07854');}
 else if(n===1){q('8,27 31,22 43,29 41,42 9,43','#614332');r(11,28,28,12,'#8f6544');for(let i=0;i<8;i++)r(13+i*3,29+(i%3)*4,2,2,i%2?'#b19362':'#3f342c');}
 else if(n===5){q('8,22 46,22 41,35 27,44 14,35','#60815a');q('11,22 43,22 38,33 27,40 16,33','#e4cf9b');q('13,22 41,22 36,31 27,37 18,31','#ce6655');for(let i=0;i<5;i++)r(19+i*4,26+(i%2)*4,1,2,'#533e36');}
 else {q('10,35 15,27 29,26 34,32 31,40 14,43','#a78858');q('13,33 18,28 27,29 30,33 27,38 15,39','#d9ba79');if(n===2){r(35,31,5,10,'#58734e');r(39,28,5,10,'#799059');}else if(n===8){q('33,26 42,27 47,34 37,38','#dfb84d');q('35,28 40,29 44,33 38,35','#f6df87');}else{r(34,28,9,13,'#d6c5a4');r(36,29,5,2,'#f1dfb9');r(35,38,8,2,'#af9470');}}}
 else {plate();if(n===0){q('14,36 23,19 30,35','#f1cf79');q('27,37 36,23 42,37','#e1bc61');r(19,29,8,3,'#a94b3b');r(33,32,7,3,'#a94b3b');}
 if(n===1){r(13,25,21,14,'#755039');r(15,26,17,2,'#a98054');r(17,30,3,3,'#392b26');q('28,38 33,23 43,26 42,39','#e8ddad');}
 if(n===2){for(let i=0;i<3;i++)q(`${13+i*8},35 ${14+i*8},29 ${19+i*8},27 ${23+i*8},33 ${21+i*8},39 ${15+i*8},40`,'#c49a62');q('15,29 36,28 40,32 36,36 18,34','#f1d481');r(39,34,4,6,'#6c8557');}
 if(n===3){r(12,25,31,15,'#96663f');r(14,26,27,12,'#d7a35b');r(15,28,25,9,'#ddbd62');for(let i=0;i<6;i++)r(17+i*4,29+i%3*2,2,2,'#a77a3c');r(16,38,24,1,'#4c6550');}
 if(n===4){q('13,36 16,30 23,29 27,23 34,29 39,30 42,37 36,41 18,40','#eed49b');r(19,33,17,2,'#d5b87b');r(26,25,4,7,'#f6e6bd');}
 if(n===5){q('12,24 31,24 28,36 21,41 14,34','#76965b');q('14,24 29,24 26,34 21,38 16,33','#d96b58');r(19,28,1,2,'#49362b');r(24,30,1,2,'#49362b');r(32,29,11,9,'#efe1bb');r(33,28,9,2,'#fff0cc');}
 if(n===6){q('9,32 14,23 25,19 38,22 45,30 44,38 34,43 19,42 10,38','#b88145');q('12,32 17,25 26,22 37,25 42,31 40,37 32,40 20,39 13,36','#e7b870');r(19,28,4,2,'#bc894b');r(32,33,5,2,'#bc894b');r(26,25,3,2,'#f6d591');}
 if(n===7){for(let i=0;i<4;i++){let x=12+i%2*18,y=24+Math.floor(i/2)*10;q(`${x},${y+3} ${x+4},${y} ${x+11},${y} ${x+15},${y+5} ${x+12},${y+11} ${x+3},${y+10} ${x},${y+7}`,'#c4924c');r(x+4,y+2,7,5,'#e8c789');r(x+5,y+2,4,2,'#f0d6a0');}}
 if(n===8){r(13,24,26,16,'#ba7a38');r(15,25,22,12,'#e4b45b');for(let i=0;i<7;i++)r(17+i%4*5,27+Math.floor(i/4)*5,2,2,'#b47d3d');q('39,31 46,34 43,41 37,39','#efd174');}
 if(n===9){q('10,27 46,27 43,41 38,44 18,44 13,40','#924c3b');r(12,26,32,4,'#b96d49');r(16,28,24,5,'#ecd087');r(20,30,16,2,'#f4dda0');r(12,34,2,6,'#c07c50');}}
 return svg(56,56,b,'pixel-art item-art');}
function item(i){return !i?'':i.kind==='book'?book(i.tier):food(i.id,i.kind);}
const paths={book:'M4 4h7l1 2 1-2h7v16h-7l-1 1-1-1H4z M12 6v15',library:'M3 8l9-6 9 6H3z M5 10v9m5-9v9m4-9v9m5-9v9M3 21h18',key:'M14 9a5 5 0 1 1-10 0 5 5 0 0 1 10 0z M13 12l8 8m-4-4 2-2m0 4 2-2',journal:'M5 3h14v18H5z M8 7h8m-8 4h8m-8 4h5',left:'M14 5l-7 7 7 7',right:'M9 5l7 7-7 7',close:'M6 6l12 12M18 6 6 18',check:'M4 12l5 5L20 5',plus:'M12 4v16M4 12h16',coin:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M15 7h-5l-2 4h7l-2 5H8m4-11v2m0 9v3',help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M9 8c0-4 8-3 6 1l-3 3v2m0 2v2',info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 10v8m0-12v2',back:'M9 5 3 11l6 6M3 11h11c8 0 8 10 0 10',swap:'M3 7h17l-4-4M21 17H4l4 4',download:'M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5',upload:'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',lock:'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4',heart:'M12 21 3 12C-2 3 9 0 12 7c3-7 14-4 9 5z',leaf:'M4 20C0 5 13 4 21 3c0 13-6 18-17 17z M4 20l11-11',cheese:'M3 11l10-7 8 7v10H3z M7 15h2m5 2h3',star:'M12 2l3 6 7 2-5 5 1 7-6-4-6 4 1-7-5-5 7-2z',spark:'M12 2 9 9 2 12l7 3 3 7 3-7 7-3-7-3z',settings:'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',keyboard:'M9 5h12v14H9l-7-7z M12 9l6 6m0-6-6 6',volume:'M3 9h4l6-5v16l-6-5H3z M17 7q6 5 0 10',people:'M9 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M3 20v-5q3-5 6 0v5m6-13a3 3 0 1 1 6 0 3 3 0 0 1-6 0z M15 20v-5q3-5 6 0v5'};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]||paths.book}"/></svg>`;}
function room(state){const has=id=>state.upgrades.includes(id);const theme={sage:['#263c35','#40594a'],rose:['#40363c','#665052'],twilight:['#293443','#46516b']}[state.theme]||['#263c35','#40594a'];let b='';const r=(x,y,w,h,c)=>b+=rect(x,y,w,h,c),q=(s,c)=>b+=poly(s,c);
 r(0,0,360,180,theme[0]);r(8,6,344,110,theme[1]);r(12,9,336,103,theme[0]);r(0,115,360,65,'#594235');r(0,115,360,3,'#b09359');
 for(let y=126;y<180;y+=17){r(0,y,360,1,'#6a5140');for(let x=(y%2)*30;x<360;x+=60)r(x,y,1,17,'#47392e');}
 // The base room is already a working library; purchases enrich it.
 function shelf(x,y,w,h){r(x,y,w,h,'#302d28');r(x+3,y+3,w-6,h-6,'#443c31');for(let sy=y+21;sy<y+h;sy+=22){for(let j=0;j<Math.floor((w-8)/7);j++){let k=(j+sy)%6;r(x+5+j*7,sy-14-(j%3),5,14+(j%3),['#8b6350','#697c6a','#ad985e','#647b80','#857088','#b08861'][k]);r(x+6+j*7,sy-12,3,1,'#ccbd8e');}r(x,sy,w,3,'#876b48');}}
 shelf(18,24,72,86);shelf(268,24,72,86);r(122,14,116,78,'#292e29');r(127,18,106,69,'#8baba2');r(130,21,48,62,'#aec1af');r(184,21,45,62,'#93aea4');q('130,51 153,28 177,50 177,82 130,82','#739485');r(177,18,5,69,'#c3b482');r(127,49,106,4,'#c3b482');
 if(has('glass')){for(let i=0;i<6;i++)q(`${132+i*16},22 ${139+i*16},30 ${132+i*16},47 ${125+i*16},30`,i%2?'#ad854d':'#647e7e');}
 if(has('loft')){shelf(13,1,100,22);shelf(247,1,100,22);for(let y=20;y<120;y+=10)r(97,y,14,2,'#c3a06a');r(96,16,2,104,'#98784c');r(110,16,2,104,'#98784c');}
 if(has('terrace')){r(244,29,20,92,'#262f2c');r(247,32,14,85,'#6f8870');r(249,77,12,2,'#adab79');r(250,95,10,4,'#b1a16d');}
 if(has('rare')){shelf(17,27,73,83);r(19,28,2,80,'#c5b17c');r(87,28,2,80,'#c5b17c');r(53,28,2,80,'#c5b17c');q('22,29 38,29 22,46','#777f6c');}
 if(has('atlas')){r(272,26,64,37,'#bfaa70');r(275,29,58,31,'#d3c391');q('280,35 291,33 299,39 292,45 296,53 287,54 282,45','#778b70');q('310,32 322,36 329,44 320,55 308,50 313,44','#8b906f');}
 if(has('plants')){for(let x of [104,253]){r(x,99,12,17,'#896846');r(x+5,69,2,32,'#66805b');for(let j=0;j<4;j++){q(`${x+6},${75+j*6} ${x-3},${68+j*6} ${x-5},${72+j*6} ${x+6},${80+j*6}`,'#879562');q(`${x+6},${77+j*6} ${x+17},${70+j*6} ${x+18},${74+j*6} ${x+6},${82+j*6}`,'#5e825d');}}}
 if(has('nook')){r(20,119,41,25,'#254637');r(24,116,33,22,'#54715a');r(18,129,8,24,'#355b46');r(54,129,8,24,'#355b46');r(27,139,26,11,'#648367');r(23,153,3,9,'#382e28');r(54,153,3,9,'#382e28');}
 if(has('dresser')){r(285,119,54,32,'#8b6a49');r(282,117,60,5,'#c0b58c');for(let x=288;x<339;x+=12){r(x,122,10,9,'#dbd1ab');r(x+4,139,2,2,'#cbb671');}}
 if(has('trolley')){r(76,128,39,3,'#a88b4b');r(76,145,39,3,'#a88b4b');r(78,125,2,30,'#a88b4b');r(111,125,2,30,'#a88b4b');r(80,155,5,4,'#252c29');r(106,155,5,4,'#252c29');r(84,123,24,4,'#6b8a81');r(86,119,20,4,'#c0a562');}
 if(has('club')){r(233,146,63,5,'#937346');r(239,151,4,20,'#3d3027');r(286,151,4,20,'#3d3027');r(252,142,21,4,'#8d6560');r(236,166,13,7,'#47644f');r(278,166,13,7,'#47644f');}
 if(has('lamps')){for(let x of [114,239]){r(x,106,3,31,'#c6a35d');r(x-5,136,14,3,'#9e7c48');q(`${x-9},108 ${x-4},98 ${x+7},98 ${x+12},108`,'#d4b96d');r(x-8,109,19,2,'#efd998');}}
 if(has('festival')){for(let i=0;i<10;i++)q(`${100+i*16},3 ${113+i*16},3 ${107+i*16},13`,i%2?'#b9a15d':'#899f83');r(210,135,5,25,'#8e6844');q('200,130 219,130 224,138 203,138','#be9863');}
 // Desk leaves the full character visible in front, with useful objects only.
 r(127,126,91,5,'#8c6747');r(133,131,5,28,'#382b23');r(207,131,5,28,'#382b23');r(137,122,21,4,'#597e7d');r(139,119,19,3,'#bb9b65');q('192,125 197,117 201,125','#e7c877');
 return `<div class="room-art" data-upgrades="${state.upgrades.join(' ')}">${svg(360,180,b,'pixel-art room-background')}<div class="room-lou">${lou()}</div></div>`;}
root.SHELF_ART={lou,visitor,book,item,icon,room};
})(typeof window!=='undefined'?window:globalThis);
