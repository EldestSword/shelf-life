(function(root){'use strict';
const E=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.SHELF_ENGINE;
const KEY='shelf-life.save.v1',BACKUP_KEY=KEY+'.previous',MAX_BYTES=250000;
function encode(state,revision=0){return JSON.stringify({format:'shelf-life',revision,state:E.validate(state)});}
function decode(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('That save is too large or unreadable.');let x;try{x=JSON.parse(raw);}catch(_){throw Error('That file is not valid JSON.');}if(x?.format!=='shelf-life'||!Number.isSafeInteger(x.revision)||x.revision<0)throw Error('That is not a Shelf Life backup.');return {state:E.validate(x.state),revision:x.revision};}
function create(backend){let known=null,blocked=false,volatile=false;
 return {get volatile(){return volatile;},raw(){try{return backend.getItem(KEY);}catch(_){return known;}},
 load(){try{known=backend.getItem(KEY);if(!known)return {state:null};return decode(known);}catch(error){blocked=!!known;volatile=!known;let previous=null;try{previous=decode(backend.getItem(BACKUP_KEY));}catch(_){}return {state:previous?.state||null,error:error.message,recovered:!!previous};}},
 save(state,force=false){if(blocked&&!force)return {ok:false,blocked:true};try{const current=backend.getItem(KEY);if(!force&&current!==known){if(current){const incoming=decode(current);known=current;return {ok:false,conflict:incoming.state};}return {ok:false,blocked:true};}let revision=0;if(current){try{revision=decode(current).revision;backend.setItem(BACKUP_KEY,current);}catch(error){if(!force)throw error;}}const next=encode(state,revision+1);backend.setItem(KEY,next);known=next;blocked=false;volatile=false;return {ok:true};}catch(error){volatile=true;return {ok:false,error:error.message};}},
 accept(raw){if(raw===known)return null;const incoming=decode(raw);known=raw;blocked=false;return incoming.state;}
 };}
const S={KEY,BACKUP_KEY,MAX_BYTES,encode,decode,create};if(typeof module!=='undefined'&&module.exports)module.exports=S;else root.SHELF_STORAGE=S;
})(typeof window!=='undefined'?window:globalThis);
