/* Original inline SVG artwork. Smooth cel-shaded vectors keep Lou recognisable without using her photograph. */
(function(root){'use strict';
const C=root.SHELF_CONTENT;
const esc=value=>String(value).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[x]);
const svg=(view,body,klass='')=>`<svg class="${klass}" viewBox="0 0 ${view}" aria-hidden="true" focusable="false">${body}</svg>`;
const section=id=>C.sections.find(s=>s.id===id)||C.sections[0];
const recipe=id=>C.recipes.find(r=>r.id===id);
const component=(id,cid)=>recipe(id)?.components.find(c=>c.id===cid);
const hash=s=>[...s].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
let artSequence=0;
function scopePaints(body,names){
 const prefix='s'+(++artSequence);
 for(const name of names)body=body.replaceAll(`id="${name}"`,`id="${prefix}-${name}"`).replaceAll(`url(#${name})`,`url(#${prefix}-${name})`);
 return body;
}

function louFigure(mood){
 const eyes=mood==='unimpressed'
   ? '<path d="M57 70q7-3 14 0M89 70q7-3 14 0" stroke="#332a29" stroke-width="2.2" stroke-linecap="round"/>'
   : mood==='celebratory'
   ? '<path d="M58 70q6 6 12 0M90 70q6 6 12 0" fill="none" stroke="#332a29" stroke-width="2.2" stroke-linecap="round"/>'
   : '<ellipse cx="64" cy="71" rx="2.5" ry="3.2" fill="#29383a"/><ellipse cx="96" cy="71" rx="2.5" ry="3.2" fill="#29383a"/><circle cx="65" cy="70" r=".8" fill="#effcf8"/><circle cx="97" cy="70" r=".8" fill="#effcf8"/>';
 const mouth=mood==='unimpressed'
   ? '<path d="M72 93q8-3 16 0" fill="none" stroke="#9d5b55" stroke-width="2.4" stroke-linecap="round"/>'
   : mood==='idle'
   ? '<path d="M73 91q7 5 14 0" fill="none" stroke="#a34f52" stroke-width="2.5" stroke-linecap="round"/>'
   : '<path d="M69 89q11 14 22 0c-2 14-20 14-22 0z" fill="#783c43"/><path d="M72 91q8 4 16 0" stroke="#fff5df" stroke-width="3.5" stroke-linecap="round"/>';
 const arms=mood==='celebratory'
   ? '<path d="M49 128Q24 108 19 78" fill="none" stroke="#324d4b" stroke-width="18" stroke-linecap="round"/><path d="M111 128q25-20 30-50" fill="none" stroke="#324d4b" stroke-width="18" stroke-linecap="round"/><path d="M19 80l-6-13m7 13 8-12" stroke="#e1ad8e" stroke-width="6" stroke-linecap="round"/><path d="M141 80l6-13m-7 13-8-12" stroke="#e1ad8e" stroke-width="6" stroke-linecap="round"/>'
   : '<path d="M48 130q-13 20-12 47" fill="none" stroke="#324d4b" stroke-width="20" stroke-linecap="round"/><path d="M112 130q13 20 12 47" fill="none" stroke="#324d4b" stroke-width="20" stroke-linecap="round"/><path d="M35 174q4 7 11 1M125 174q-4 7-11 1" fill="none" stroke="#e1ad8e" stroke-width="7" stroke-linecap="round"/>';
 return `<defs>
   <linearGradient id="jacket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#496662"/><stop offset=".55" stop-color="#2d4947"/><stop offset="1" stop-color="#1c3433"/></linearGradient>
   <linearGradient id="hair" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="#79503d"/><stop offset=".5" stop-color="#4d3029"/><stop offset="1" stop-color="#2d201f"/></linearGradient>
   <linearGradient id="skin" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#f2c5aa"/><stop offset=".6" stop-color="#dda283"/><stop offset="1" stop-color="#bd7868"/></linearGradient>
   <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#071714" flood-opacity=".6"/></filter>
 </defs>
 <ellipse cx="80" cy="190" rx="43" ry="7" fill="#071714" opacity=".45"/>
 <g filter="url(#shadow)">
   <path d="M55 169h20v22H48q-4-7 7-10zM86 169h20l7 12q10 3 5 10H86z" fill="#172927"/>
   <path d="M53 124q27-15 54 0l7 54H45z" fill="url(#jacket)"/>
   ${arms}
   <path d="M63 119h34l6 59H57z" fill="#173c3b"/>
   <path d="M61 130h38v8H61zm-2 20h42v8H59z" fill="#d6a93d"/>
   <path d="M61 138h38v12H61zm-2 20h42v13H59z" fill="#14302f"/>
   <path d="M50 125l21-9 9 62H50zM110 125l-21-9-9 62h30z" fill="url(#jacket)"/>
   <path d="M52 134l20 5m-18 17 21 5m33-27-20 5m18 17-21 5" stroke="#77928a" stroke-width="2" opacity=".7"/>
   <path d="M68 109v14q12 9 24 0v-14" fill="url(#skin)"/>
   <path d="M49 54q-6 45 13 60 18 15 37 0 17-15 12-60z" fill="url(#hair)"/>
   <circle cx="104" cy="63" r="10" fill="#4a2f29"/>
   <circle cx="111" cy="31" r="20" fill="url(#hair)"/>
   <path d="M96 19q17-8 29 6M102 14q10 4 20 16" fill="none" stroke="#92624a" stroke-width="4" stroke-linecap="round"/>
   <path d="M49 63q1-34 31-35 34 1 32 38l-7 28q-5 25-25 27-22-1-28-27z" fill="url(#skin)"/>
   <path d="M50 65q4-35 31-36 28 2 31 35-10-3-20-18-18 17-42 19z" fill="url(#hair)"/>
   <path d="M52 65q10-4 20-14M101 47q8 9 12 19" fill="none" stroke="#98664d" stroke-width="3" stroke-linecap="round"/>
   <path d="M50 62q-6 18-1 35M110 62q7 17 1 38" fill="none" stroke="#3b2824" stroke-width="5" stroke-linecap="round"/>
   <path d="M49 88q-6-5-6-13 1-7 8-5M111 88q6-5 6-13-1-7-8-5" fill="url(#skin)" stroke="#b97366" stroke-width="1.5"/>
   <g fill="#f5e7d7" fill-opacity=".18" stroke="#56372d" stroke-width="4">
     <rect x="52" y="61" width="22" height="20" rx="8"/><rect x="86" y="61" width="22" height="20" rx="8"/>
   </g>
   <path d="M74 69q6-4 12 0" fill="none" stroke="#56372d" stroke-width="3"/>
   <path d="M55 65l5-3m8 17 4-3m18-12 5-2m7 17 4-3" stroke="#bf7a3e" stroke-width="2.2" stroke-linecap="round"/>
   ${eyes}
   <path d="M80 73l-3 11q3 3 7 0" fill="none" stroke="#bd7667" stroke-width="1.8" stroke-linecap="round"/>
   ${mouth}
   <path d="M55 100q4 14 16 18M105 99q-3 14-14 19" fill="none" stroke="#efc0a5" stroke-width="2" opacity=".7"/>
   <path d="M48 55q-8 20-4 43M109 51q10 24 5 50M57 38q-15 11-12 27" fill="none" stroke="#392623" stroke-width="4" stroke-linecap="round"/>
   <path d="M47 61q-8 15-6 31M112 58q9 16 5 31" fill="none" stroke="#93604a" stroke-width="1.8" stroke-linecap="round"/>
 </g>`;
}
function lou(mood='idle'){return `<span class="lou-character" data-expression="${mood}">${['idle','pleased','unimpressed','celebratory'].map(m=>svg('160 200',scopePaints(louFigure(m),['jacket','hair','skin','shadow']),'lou-frame expression-'+m)).join('')}</span>`;}

function visitor(index){
 const palettes=[['#d79a76','#45302b','#3e7772'],['#8d5f47','#171d20','#805963'],['#e3b28f','#7a4b35','#56708e'],['#aa765c','#33231f','#66755d'],['#d2a480','#b5a084','#3e6e61'],['#714937','#1d1718','#854e4e']];
 const p=palettes[index%palettes.length],glasses=index%3===0?'<g fill="#edf5ed" fill-opacity=".12" stroke="#3d2b28" stroke-width="2.4"><rect x="21" y="34" width="19" height="14" rx="5"/><rect x="56" y="34" width="19" height="14" rx="5"/></g><path d="M40 39h16" stroke="#3d2b28" stroke-width="2.4"/>':'';
 const hair=index%4===0?'<path d="M21 38q0-25 27-25 29 2 28 28-15-4-24-18-13 14-31 15z" fill="'+p[1]+'"/>':'<path d="M20 42q-1-29 28-29 29 1 29 30-12-13-27-19-13 13-30 18z" fill="'+p[1]+'"/>';
 const body=`<defs><linearGradient id="v${index}" x2="1" y2="1"><stop stop-color="${p[2]}"/><stop offset="1" stop-color="#1d3634"/></linearGradient></defs><rect x="2" y="2" width="92" height="92" rx="28" fill="#102c2a"/><path d="M14 92q4-31 34-31t34 31" fill="url(#v${index})"/><path d="M39 57v12q9 8 18 0V57" fill="${p[0]}"/><path d="M22 36q0-23 26-23 27 1 27 27l-5 17q-7 15-22 15T26 57z" fill="${p[0]}"/>${hair}${glasses}<circle cx="34" cy="41" r="2" fill="#24302f"/><circle cx="62" cy="41" r="2" fill="#24302f"/><path d="M41 56q7 5 14 0" fill="none" stroke="#854a4a" stroke-width="2.2" stroke-linecap="round"/>`;
 return svg('96 96',scopePaints(body,[`v${index}`]),'visitor-art');
}

function book(tier=1,sectionId='fiction'){
 const s=section(sectionId),count=Math.min(4,Math.max(1,tier));
 const volumes=Array.from({length:count},(_,i)=>{const x=10+i*9,y=14-i*3,h=37+i*3;return `<g transform="rotate(${i%2?2:-2} ${x} 50)"><rect x="${x}" y="${y}" width="15" height="${h}" rx="2.5" fill="${i%2?s.colour:s.accent}"/><rect x="${x+3}" y="${y+4}" width="9" height="2" rx="1" fill="#fff" opacity=".5"/><rect x="${x+4}" y="${y+10}" width="7" height="1.5" rx=".7" fill="#102a28" opacity=".45"/></g>`;}).join('');
 const body=`<defs><filter id="bs"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity=".45"/></filter></defs><g filter="url(#bs)">${volumes}<path d="M7 54h50" stroke="#d7bc72" stroke-width="3" stroke-linecap="round"/><circle cx="52" cy="14" r="9" fill="#102b29" stroke="${s.accent}" stroke-width="2"/><text x="52" y="18" fill="${s.accent}" font-size="11" font-weight="800" text-anchor="middle" font-family="Arial">${s.mark}</text></g>`;
 return svg('64 64',scopePaints(body,['bs']),'item-art book-art');
}

function ingredientArt(item){
 const c=component(item.id,item.component)||{id:item.component||'unknown',kind:'seasoning'},seed=hash(c.id),hue=seed%360;
 const colour=`hsl(${hue} 38% 58%)`,light=`hsl(${hue} 55% 76%)`;
 const shapes={
   cheese:`<path d="M10 43l11-24 30 9v23H10z" fill="#e6bd63"/><path d="M21 19l30 9-22 8-19 7z" fill="#f5d781"/><circle cx="35" cy="40" r="3" fill="#b98a3f"/><circle cx="45" cy="33" r="2" fill="#c49649"/>`,
   fruit:`<path d="M12 42q17-29 39 0-5 13-19 13T12 42z" fill="#cb5b62"/><path d="M18 40q14-18 27 0" fill="none" stroke="#ffd5a4" stroke-width="8"/><path d="M31 21q1-8 8-10" stroke="#5d8c65" stroke-width="4"/>`,
   potato:`<ellipse cx="32" cy="37" rx="21" ry="15" fill="#b8895d"/><circle cx="22" cy="34" r="2" fill="#775337"/><circle cx="39" cy="41" r="2" fill="#775337"/>`,
   pickle:`<path d="M16 22q16-8 31 1v27q-15 8-31 0z" fill="#62885d"/><path d="M20 25q12-5 23 0" stroke="#afd184" stroke-width="3"/><circle cx="25" cy="37" r="2" fill="#d4d98a"/><circle cx="39" cy="43" r="2" fill="#d4d98a"/>`,
   bread:`<path d="M13 48V29q1-15 18-10 15-7 20 8v21z" fill="#c99152"/><path d="M18 44V30q1-9 13-6 11-4 15 5v15z" fill="#f0c77b"/>`,
   seaweed:`<path d="M16 50q-5-17 8-29 5 11 8 28m0 0q-4-23 11-34 8 18 4 35z" fill="#315b4c"/><path d="M24 26q8 8 18 15" stroke="#7da579" stroke-width="3"/>`,
   butter:`<rect x="13" y="26" width="38" height="25" rx="5" fill="#e9c864"/><path d="M17 30h30v5H17z" fill="#fff0a5" opacity=".7"/>`,
   mustard:`<path d="M20 20h24l4 34H16z" fill="#bd8f28"/><rect x="22" y="29" width="20" height="15" rx="3" fill="#f0ca58"/><path d="M24 18h16" stroke="#eee0ae" stroke-width="5"/>`,
   sauce:`<path d="M24 15h16l5 39H19z" fill="#8c3d34"/><rect x="23" y="29" width="18" height="15" rx="3" fill="#d6b568"/>`,
   ale:`<path d="M17 21h29l-3 33H20z" fill="#a36b32"/><path d="M20 25h23l-1 7H21z" fill="#f1d79b"/>`,
   cream:`<path d="M14 30h36l-5 24H19z" fill="#e2ded0"/><ellipse cx="32" cy="30" rx="18" ry="6" fill="#fff8e8"/>`,
   garlic:`<path d="M32 17q4 8 1 13 15-4 15 12 0 14-16 14T16 42q0-16 15-12-4-5 1-13z" fill="#e7dbbd"/><path d="M32 17q-3-6 2-10" stroke="#74905f" stroke-width="3"/>`,
   dough:`<path d="M10 44q5-24 22-24t22 24q-3 12-22 12T10 44z" fill="#d7a96a"/><path d="M18 37q14-12 29 1" fill="none" stroke="#f0d19d" stroke-width="4"/>`,
   starter:`<path d="M17 24h30v30H17z" fill="#b58f68"/><path d="M20 27h24v18H20z" fill="#dfc39a"/><circle cx="26" cy="34" r="2" fill="#fff1c6"/><circle cx="37" cy="39" r="2" fill="#fff1c6"/>`,
   starch:`<path d="M15 21h34l-4 34H19z" fill="#d8c9ac"/><path d="M19 28h26" stroke="#f8f0df" stroke-width="6"/>`,
   egg:`<path d="M13 43q2-20 19-24 17 5 19 24-4 13-19 13T13 43z" fill="#f7eee0"/><circle cx="32" cy="40" r="10" fill="#df9f2f"/>`,
   milk:`<path d="M20 20h24l4 34H16z" fill="#d9ede8"/><path d="M20 20l6-8h12l6 8" fill="#effaf5"/><path d="M20 34h27" stroke="#62a99c" stroke-width="8"/>`,
   seasoning:`<path d="M22 17h20l4 38H18z" fill="#c8cabd"/><path d="M23 25h18" stroke="#f8f6e7" stroke-width="5"/><circle cx="28" cy="18" r="1.5" fill="#46524e"/><circle cx="36" cy="18" r="1.5" fill="#46524e"/>`,
   water:`<path d="M32 10q18 21 18 31a18 18 0 1 1-36 0q0-10 18-31z" fill="#65b8bd"/><path d="M22 43q5 7 13 7" fill="none" stroke="#b8f1ec" stroke-width="3"/>`,
   flour:`<path d="M16 18h32l-4 38H20z" fill="#d7c6a8"/><rect x="20" y="29" width="24" height="16" rx="3" fill="#f4ead6"/>`,
   oil:`<path d="M25 12h14v9l8 10-3 25H20l-3-25 8-10z" fill="#7f9d46"/><path d="M22 32h20l-2 19H24z" fill="#c2ad45"/>`,
   wine:`<path d="M22 14h20l-2 21q-2 9-8 9t-8-9zM32 44v11m-9 0h18" fill="#7e374e" stroke="#dcbad0" stroke-width="2"/>`
 };
 const body=shapes[c.kind]||`<circle cx="32" cy="34" r="21" fill="${colour}"/><circle cx="26" cy="28" r="9" fill="${light}" opacity=".6"/>`;
 return svg('64 64',scopePaints(`<defs><filter id="is"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity=".5"/></filter></defs><g filter="url(#is)">${body}</g>`,['is']),'item-art ingredient-art');
}
function prepArt(item){
 const r=recipe(item.id),count=item.components.length,total=r.components.length,colours=item.components.map(x=>`hsl(${hash(x)%360} 42% 60%)`);
 const pieces=colours.map((c,i)=>`<circle cx="${22+(i%4)*7}" cy="${34+Math.floor(i/4)*8}" r="5" fill="${c}"/>`).join('');
 const dots=Array.from({length:total},(_,i)=>`<circle cx="${32-(total-1)*3.2+i*6.4}" cy="57" r="2.2" fill="${i<count?'#55cbb7':'#405b58'}"/>`).join('');
 return svg('64 64',scopePaints(`<defs><linearGradient id="pb" x2="0" y2="1"><stop stop-color="#d2b773"/><stop offset="1" stop-color="#72553e"/></linearGradient><filter id="ps"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity=".5"/></filter></defs><g filter="url(#ps)"><path d="M10 26h44q-2 26-22 26T10 26z" fill="url(#pb)"/><ellipse cx="32" cy="27" rx="22" ry="7" fill="#183b38" stroke="#d8bd78" stroke-width="2"/>${pieces}${dots}</g>`,['pb','ps']),'item-art prep-art');
}
function dishArt(id){
 const n=C.recipes.findIndex(r=>r.id===id),a=`hsl(${(n*41+34)%360} 48% 59%)`,b=`hsl(${(n*41+67)%360} 55% 72%)`;
 const food=[`<path d="M15 40l14-22 19 23z" fill="${a}"/><path d="M29 18l19 23-13-7-20 6z" fill="${b}"/>`,`<rect x="17" y="23" width="29" height="20" rx="5" fill="${a}"/><circle cx="25" cy="30" r="2" fill="#5b4135"/><circle cx="38" cy="36" r="2" fill="#5b4135"/>`,`<path d="M14 39q17-17 36 0" fill="none" stroke="${a}" stroke-width="11"/><circle cx="25" cy="34" r="4" fill="${b}"/>`][n%3];
 return svg('64 64',scopePaints(`<defs><filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity=".45"/></filter></defs><g filter="url(#ds)"><ellipse cx="32" cy="45" rx="27" ry="11" fill="#d7e3dc"/><ellipse cx="32" cy="43" rx="21" ry="7" fill="#203f3b"/>${food}<path d="M12 47q20 10 40 0" fill="none" stroke="#aa9059" stroke-width="2"/></g>`,['ds']),'item-art dish-art');
}
function item(i){if(!i)return '';if(i.kind==='book')return book(i.tier,i.section);if(i.kind==='ingredient')return ingredientArt(i);if(i.kind==='prep')return prepArt(i);if(i.kind==='cheese')return ingredientArt({kind:'ingredient',id:i.id,component:recipe(i.id).components[0].id});return dishArt(i.id);}

const paths={book:'M4 4h7l1 2 1-2h7v16h-7l-1 1-1-1H4z M12 6v15',library:'M3 8l9-6 9 6H3z M5 10v9m5-9v9m4-9v9m5-9v9M3 21h18',key:'M14 9a5 5 0 1 1-10 0 5 5 0 0 1 10 0z M13 12l8 8m-4-4 2-2m0 4 2-2',journal:'M5 3h14v18H5z M8 7h8m-8 4h8m-8 4h5',left:'M14 5l-7 7 7 7',right:'M9 5l7 7-7 7',close:'M6 6l12 12M18 6 6 18',check:'M4 12l5 5L20 5',plus:'M12 4v16M4 12h16',coin:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M15 7h-5l-2 4h7l-2 5H8m4-11v2m0 9v3',help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M9 8c0-4 8-3 6 1l-3 3v2m0 2v2',info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z M12 10v8m0-12v2',back:'M9 5 3 11l6 6M3 11h11c8 0 8 10 0 10',swap:'M3 7h17l-4-4M21 17H4l4 4',download:'M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5',upload:'M12 16V3m-5 5 5-5M4 16v5h16v-5',lock:'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4',heart:'M12 21 3 12C-2 3 9 0 12 7c3-7 14-4 9 5z',leaf:'M4 20C0 5 13 4 21 3c0 13-6 18-17 17z M4 20l11-11',cheese:'M3 11l10-7 8 7v10H3z M7 15h2m5 2h3',star:'M12 2l3 6 7 2-5 5 1 7-6-4-6 4 1-7-5-5 7-2z',spark:'M12 2 9 9 2 12l7 3 3 7 7-3-7-3z',settings:'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',keyboard:'M9 5h12v14H9l-7-7z M12 9l6 6m0-6-6 6',volume:'M3 9h4l6-5v16l-6-5H3z M17 7q6 5 0 10',people:'M9 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M3 20v-5q3-5 6 0v5m6-13a3 3 0 1 1 6 0 3 3 0 0 1-6 0z M15 20v-5q3-5 6 0v5'};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]||paths.book}"/></svg>`;}

function room(state){
 const has=id=>state.upgrades.includes(id),themes={teal:['#0d3534','#17605a','#53aa9a'],'sea-glass':['#173b39','#39776f','#94c6b9'],midnight:['#151d2c','#253d4c','#4e8d8a']},t=themes[state.theme]||themes.teal;
 let extras='';
 if(has('glass'))extras+='<path d="M286 36h148v158H286z" fill="#163a3d"/><path d="M290 40l45 72-45 78zm140 0-45 72 45 78z" fill="#3fa99b"/><path d="M335 40h50l-25 72z" fill="#c39b55"/><path d="M335 190h50l-25-78z" fill="#66886e"/>';
 if(has('loft'))extras+='<path d="M20 20h210v42H20zm470 0h210v42H490z" fill="#142927" stroke="#a7864b" stroke-width="4"/><path d="M210 44v205m22-205v205M206 80h30m-30 32h30m-30 32h30m-30 32h30" stroke="#c4a15c" stroke-width="5"/>';
 if(has('terrace'))extras+='<path d="M520 66h56v177h-56z" fill="#102a29" stroke="#a98c55" stroke-width="4"/><path d="M530 76h36v156h-36z" fill="#5e8f78"/><path d="M532 170q18-35 32 0" fill="#7fb17c"/>';
 if(has('rare'))extras+='<path d="M32 66h116v160H32z" fill="#18302e" stroke="#c3a66b" stroke-width="5"/><path d="M90 68v156" stroke="#c3a66b" stroke-width="3"/><path d="M36 106h108m-108 54h108" stroke="#8d7248" stroke-width="4"/>';
 if(has('atlas'))extras+='<rect x="585" y="65" width="105" height="74" rx="5" fill="#d4c797"/><path d="M598 79q22-17 33 8t-9 36q-24-5-24-44zm45 4q26-14 35 16-7 26-31 23 9-17-4-39z" fill="#5f9585"/>';
 if(has('plants'))extras+='<g fill="#66a177"><path d="M196 235q-20-60 2-93 26 41 5 94z"/><path d="M197 216q-48-30-47-69 44 12 53 65z"/><path d="M201 207q42-38 62-24-18 38-61 45z"/></g><path d="M174 229h55l-8 46h-39z" fill="#9c6d48"/>';
 if(has('nook'))extras+='<path d="M37 247q0-45 45-45t45 45v72H37z" fill="#17665f" stroke="#79b9ab" stroke-width="5"/><path d="M48 246h68v46H48z" fill="#267a71"/><path d="M43 313h12m54 0h12" stroke="#b28b54" stroke-width="6"/>';
 if(has('dresser'))extras+='<path d="M585 240h110v72H585z" fill="#76543d" stroke="#c0a36b" stroke-width="4"/><path d="M595 250h26v22h-26zm33 0h26v22h-26zm33 0h26v22h-26z" fill="#d8ccb0"/>';
 if(has('trolley'))extras+='<path d="M144 258h76v45h-76z" fill="none" stroke="#c5a259" stroke-width="6"/><circle cx="154" cy="313" r="9" fill="#182827"/><circle cx="210" cy="313" r="9" fill="#182827"/><path d="M151 251h61" stroke="#53a79d" stroke-width="13"/>';
 if(has('club'))extras+='<ellipse cx="510" cy="290" rx="76" ry="17" fill="#8a6041"/><path d="M470 294v38m80-38v38" stroke="#4d3429" stroke-width="11"/>';
 if(has('lamps'))extras+='<g stroke="#d1ad5d" stroke-width="5" fill="#e5ca7a"><path d="M245 280v-90m230 90v-90"/><path d="M220 196h50l-10-27h-30zm230 0h50l-10-27h-30z"/></g>';
 if(has('listening'))extras+='<path d="M448 218h80v54h-80z" fill="#633f35" stroke="#b08d5b" stroke-width="4"/><circle cx="476" cy="244" r="20" fill="#111b1c" stroke="#56aa9f" stroke-width="3"/><circle cx="476" cy="244" r="5" fill="#c2a45d"/><path d="M508 230v25" stroke="#d2bd8a" stroke-width="4"/>';
 if(has('catalogue'))extras+='<path d="M260 238h85v74h-85z" fill="#73513c"/>'+Array.from({length:12},(_,i)=>`<rect x="${268+(i%4)*18}" y="${247+Math.floor(i/4)*19}" width="14" height="14" rx="2" fill="#a87b51"/>`).join('');
 if(has('bindery'))extras+='<path d="M350 283h76v23h-76z" fill="#79523a"/><path d="M364 253h48v30h-48z" fill="#1d4945" stroke="#bf9b59" stroke-width="4"/><path d="M358 248h60" stroke="#d4b464" stroke-width="6"/>';
 if(has('periodicals'))extras+='<path d="M573 145h112v76H573z" fill="#24443f" stroke="#9d7e4d" stroke-width="4"/><path d="M586 155l20 54m7-54 20 54m7-54 20 54" stroke="#bb9b61" stroke-width="5"/>';
 if(has('festival'))extras+='<path d="M225 15q135 50 270 0" fill="none" stroke="#c1a35f" stroke-width="4"/>'+Array.from({length:11},(_,i)=>`<path d="M${230+i*26} ${18+i%2*5}l12 18 12-18z" fill="${i%2?'#49a293':'#b98f55'}"/>`).join('');
 const shelf=(x)=>`<path d="M${x} 68h140v171H${x}z" fill="#162b29" stroke="#7e5a3d" stroke-width="8"/><path d="M${x+4} 112h132m-132 54h132m-132 54h132" stroke="#a47a4e" stroke-width="6"/>${Array.from({length:44},(_,i)=>{const row=Math.floor(i/11),xx=x+10+(i%11)*11,yy=80+row*54;return `<rect x="${xx}" y="${yy+(i%3)*2}" width="8" height="${27-(i%3)*2}" rx="1" fill="${C.sections[i%6].colour}"/>`;}).join('')}`;
 const body=`<defs><linearGradient id="wall" y2="1"><stop stop-color="${t[1]}"/><stop offset="1" stop-color="${t[0]}"/></linearGradient><linearGradient id="floor" y2="1"><stop stop-color="#604333"/><stop offset="1" stop-color="#2e2522"/></linearGradient><radialGradient id="glow"><stop stop-color="${t[2]}" stop-opacity=".35"/><stop offset="1" stop-color="${t[0]}" stop-opacity="0"/></radialGradient></defs><rect width="720" height="360" fill="url(#wall)"/><circle cx="360" cy="95" r="230" fill="url(#glow)"/><path d="M0 232h720v128H0z" fill="url(#floor)"/><path d="M0 232h720" stroke="#c0a15d" stroke-width="5"/><path d="M0 280h720M0 326h720M120 232v128m130-128v128m130-128v128m130-128v128m130-128v128" stroke="#8d6748" stroke-width="2" opacity=".55"/>${shelf(20)}${shelf(560)}<path d="M278 45h164v150H278z" fill="#0e292a" stroke="#b09258" stroke-width="7"/><path d="M285 52h150v136H285z" fill="#7db6aa"/><path d="M285 142l50-53 38 38 28-25 34 40v46H285z" fill="#397368"/><path d="M360 52v136M285 120h150" stroke="#d2bb7c" stroke-width="5"/>${extras}<path d="M276 272h168v15H276z" fill="#8b5d3e"/><path d="M291 286v51m138-51v51" stroke="#412e27" stroke-width="13"/><path d="M300 262h46v9" fill="none" stroke="#56a99e" stroke-width="11"/><path d="M376 269l12-18 13 18" fill="#ddbd69"/>`;
 return `<div class="room-art" data-upgrades="${state.upgrades.join(' ')}">${svg('720 360',scopePaints(body,['wall','floor','glow']),'room-background')}<div class="room-lou">${lou()}</div></div>`;
}
root.SHELF_ART={lou,visitor,book,item,icon,room};
})(typeof window!=='undefined'?window:globalThis);
