'use strict';
const CACHE='shelf-life-v1.1.0-1';
const ASSETS=['./','./index.html','./styles.css','./src/content.js','./data/words.js','./data/WORDLIST-LICENCE.txt','./src/engine.js','./src/storage.js','./src/art.js','./src/app.js','./manifest.webmanifest','./assets/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('shelf-life-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}}));});
