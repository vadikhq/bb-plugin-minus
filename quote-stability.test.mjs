import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
import {createFavoritesClient} from './favorites-client.ts';
import {createQuoteControls} from './quote-controls.ts';
import {favoriteKey} from './favorites-model.ts';
const {mountToolGrouping}=await import(process.env.MINUS_GROUP_SOURCE ?? './group-tools.ts');

async function fixture(run) {
 const dom=new JSDOM('<!doctype html><html><head></head><body><aside>sidebar</aside><main></main></body></html>',{pretendToBeVisual:true,url:'http://127.0.0.1/'});
 const {window}=dom,{document}=window,previous=new Map(),frames=new Map(),timers=new Map(),panes=[],snapshots=[];
 let sequence=0,picks=0,fetches=0,notify,dispose,delayed,resolveReply,rejectReply;
 const copied=[];
 const api=new Map(),clock={now:()=>0,setTimeout:(fn,delay)=>{timers.set(++sequence,{fn,delay});return sequence;},clearTimeout:id=>timers.delete(id)};
 for(const [key,value] of Object.entries({document,Element:window.Element,HTMLElement:window.HTMLElement,MutationObserver:window.MutationObserver,requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id)})){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 async function drain(){await tick();
  // Same independent finite budget as responsiveness.test.mjs: ten two-frame
  // transitions, not a new runtime timeout or performance threshold.
  for(let i=0;i<20&&frames.size;i++){const work=[...frames.values()];frames.clear();for(const fn of work)fn(0);await tick();}
  assert.equal(frames.size,0,'finite updates settle');
 }
 function row(p,id,kind='tool'){const el=document.createElement('div');el.dataset.timelineRowId=p.id+':'+kind+':'+id;el.textContent='native work';return el;}
 function pane(id,ids){const shell=document.createElement('section'),items=document.createElement('div');shell.dataset.timelineRowList='top-level';items.dataset.timelineItems='';shell.append(items);document.querySelector('main').append(shell);const p={id,shell,items};p.rows=ids.map(id=>row(p,id));items.append(...p.rows);panes.push(p);return p;}
 const marker=p=>p.items.querySelector('[data-bb-minus-group]');
 const text=p=>marker(p)?.querySelector('[data-quote]').textContent;
 const entry=el=>({id:el.dataset.timelineRowId,kind:el.dataset.timelineRowId.includes(':assistant:')?'conversation':'work',status:'completed'});
 const alpha=pane('thr_alpha',['first']),beta=pane('thr_beta',['only']);api.set(alpha.id,alpha.rows.map(entry));api.set(beta.id,beta.rows.map(entry));
 let state={revision:0,items:[]};const client=createFavoritesClient(async()=>state,async(snapshot,liked)=>{
  const key=favoriteKey(snapshot);state={revision:state.revision+1,items:liked?[{...snapshot,key,likedAt:1}]:[]};return state;
 });client.accept(state);const controls=createQuoteControls(client);
 function mount(dictionaryId='fixture'){
  dispose=mountToolGrouping(id=>{fetches++;if(id===alpha.id&&delayed)return delayed;return Promise.resolve(api.get(id)??[]);},()=>({id:'q'+(++picks),text:'Fixture quote '+picks,author:'Author',section:'Section',sourceTitle:'Fixture',locator:'in-memory',dictionaryId,dictionaryTitle:dictionaryId}),clock,fn=>{notify=fn;return()=>{};},controls,async text=>{copied.push(text);return true;});
  const popup=document.querySelector('[data-minus-quote-menu]');let open=false;const matches=popup.matches.bind(popup);popup.matches=s=>s===':popover-open'?open:matches(s);popup.showPopover=()=>{open=true;};popup.hidePopover=()=>{open=false;};
 }
 function delay(){delayed=new Promise((resolve,reject)=>{resolveReply=resolve;rejectReply=reject;});}
 async function answer(rows){api.set(alpha.id,rows);const resolve=resolveReply;delayed=undefined;resolve(rows);await drain();}
 try{
  mount();await drain();
  await run({window,document,alpha,beta,pane,row,marker,text,entry,api,controls,client,copied,drain,delay,answer,
   reject:async()=>{delayed=undefined;rejectReply(Error('read failed'));await drain();},notify:()=>notify(alpha.id,true),
   stats:()=>({picks,fetches}),remount:async id=>{dispose();mount(id);await drain();}});
 }finally{
  try{dispose?.();assert.equal(frames.size,0);assert.equal(timers.size,0);assert.equal(document.querySelectorAll('[data-bb-minus-group],[data-bb-minus-hidden],[data-minus-quote-menu]').length,0);}
  finally{for(const [key,d] of previous){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}window.close();}
 }
}

for(const rejects of [false,true])test('delayed canonical reply preserves a visible provisional quote'+(rejects?' after failure/retry':''),async()=>{
 await fixture(async f=>{
  const first=f.alpha.rows[0],second=f.row(f.alpha,'second'),initial=f.text(f.alpha);f.delay();first.replaceWith(second);await f.drain();const visible=f.text(f.alpha);assert.notEqual(visible,initial);
  f.marker(f.alpha).querySelector('[data-metrics]').focus();f.marker(f.alpha).querySelector('[data-metrics]').click();await f.drain();
  f.notify();await f.drain();
  if(rejects){await f.reject();assert.equal(f.text(f.alpha),visible);f.delay();f.notify();await f.drain();}
  const before=f.stats();await f.answer([f.entry(first),f.entry(second)]);
  assert.equal(f.text(f.alpha),visible,'server identity must not replace the quote already visible');assert.equal(f.stats().picks,before.picks);
  const current=f.marker(f.alpha);assert.equal(current.querySelector('[data-count]').textContent,'2 tools');assert.equal(current.querySelector('[data-metrics]').getAttribute('aria-expanded'),'true');assert.equal(f.document.activeElement,current.querySelector('[data-metrics]'));
  for(const title of ['reading','checking','done']){second.firstChild.data=title;await f.drain();assert.equal(f.text(f.alpha),visible);}
 });
});

test('two panels of one thread keep their visible quotes through opposite scoped updates and virtualization',async()=>{
 await fixture(async f=>{
  const first=f.alpha.rows[0],second=f.row(f.alpha,'second');f.delay();first.replaceWith(second);await f.drain();const visible=f.text(f.alpha);
  const peer=f.pane(f.alpha.id,['first']);await f.drain();const peerText=f.text(peer);f.notify();await f.drain();await f.answer([f.entry(first),f.entry(second)]);
  assert.equal(f.text(f.alpha),visible);assert.equal(f.text(peer),peerText);
  peer.items.append(f.row(peer,'second'));await f.drain();assert.equal(f.text(peer),peerText);
  for(const p of [peer,f.alpha,peer,f.alpha]){p.items.querySelector('[data-timeline-row-id]').firstChild.data+=' update';await f.drain();assert.equal(f.text(f.alpha),visible);assert.equal(f.text(peer),peerText);}
  const saved=f.alpha.shell; saved.remove();await f.drain();f.document.querySelector('main').append(saved);await f.drain();assert.equal(f.text(f.alpha),visible);
 });
});

test('remounting an earlier member cannot replace the quote in a still-visible group',async()=>{
 await fixture(async f=>{
  const first=f.alpha.rows[0],second=f.row(f.alpha,'second');f.delay();first.replaceWith(second);await f.drain();const visible=f.text(f.alpha);f.notify();await f.drain();await f.answer([f.entry(first),f.entry(second)]);assert.equal(f.text(f.alpha),visible);
  f.alpha.items.prepend(first);await f.drain();assert.equal(f.text(f.alpha),visible,'historic earlier member cannot override the current marker');
  second.remove();await f.drain();assert.equal(f.text(f.alpha),visible);f.alpha.items.append(second);await f.drain();assert.equal(f.text(f.alpha),visible);
 });
});

test('earlier-member remount also preserves the visible quote while a failed API read changes fallback identity',async()=>{
 await fixture(async f=>{
  const first=f.alpha.rows[0],second=f.row(f.alpha,'second');f.delay();first.replaceWith(second);await f.drain();const visible=f.text(f.alpha);f.notify();await f.drain();await f.answer([f.entry(first),f.entry(second)]);
  f.delay();f.notify();await f.drain();await f.reject();assert.equal(f.text(f.alpha),visible);f.alpha.items.prepend(first);await f.drain();assert.equal(f.text(f.alpha),visible,'continuing mounted member wins even when neither marker key matches');
  f.delay();f.notify();await f.drain();await f.answer([f.entry(first),f.entry(second)]);assert.equal(f.text(f.alpha),visible);
 });
});

test('new API boundaries split tools without replacing either shown quote on the next pass',async()=>{
 await fixture(async f=>{
  const first=f.alpha.rows[0],second=f.row(f.alpha,'second'),boundary=f.row(f.alpha,'message','assistant');
  f.delay();f.alpha.items.append(second);await f.drain();const visible=f.text(f.alpha);f.notify();await f.drain();await f.answer([f.entry(first),f.entry(boundary),f.entry(second)]);
  const markers=[...f.alpha.items.querySelectorAll('[data-bb-minus-group]')];assert.equal(markers.length,2);assert(markers.every(m=>m.querySelector('[data-quote]').textContent===visible));assert(markers.every(m=>m.querySelector('[data-count]').textContent==='1 tool'));
  second.firstChild.data='updated';await f.drain();assert.deepEqual([...f.alpha.items.querySelectorAll('[data-quote]')].map(e=>e.textContent),[visible,visible]);
 });
});

test('a proven merge of two visible parts keeps the leading quote and migrated disclosure focus stable',async()=>{
 await fixture(async f=>{
  const first=f.alpha.rows[0],boundary=f.row(f.alpha,'message','assistant'),second=f.row(f.alpha,'second');
  f.api.set(f.alpha.id,[f.entry(first),f.entry(boundary),f.entry(second)]);f.alpha.items.append(boundary,second);f.notify();await f.drain();
  const parts=[...f.alpha.items.querySelectorAll('[data-bb-minus-group]')];assert.equal(parts.length,2);const leading=parts[0].querySelector('[data-quote]').textContent;assert.notEqual(parts[1].querySelector('[data-quote]').textContent,leading);parts[1].querySelector('[data-metrics]').focus();
  f.delay();boundary.remove();await f.drain();f.notify();await f.drain();await f.answer([f.entry(first),f.entry(second)]);
  assert.equal(f.alpha.items.querySelectorAll('[data-bb-minus-group]').length,1);assert.equal(f.text(f.alpha),leading);assert.equal(f.marker(f.alpha).querySelector('[data-count]').textContent,'2 tools');assert.equal(f.document.activeElement,f.marker(f.alpha).querySelector('[data-metrics]'));
  first.remove();await f.drain();assert.equal(f.text(f.alpha),leading);f.alpha.items.prepend(first);await f.drain();assert.equal(f.text(f.alpha),leading);
 });
});

test('explicit dictionary lifecycle change clears presentation choices and heart/copy snapshots use the displayed quote',async()=>{
 await fixture(async f=>{
  const first=f.alpha.rows[0],second=f.row(f.alpha,'second');f.delay();first.replaceWith(second);await f.drain();const visible=f.text(f.alpha);f.notify();await f.drain();await f.answer([f.entry(first),f.entry(second)]);assert.equal(f.text(f.alpha),visible);
  const snapshot=f.controls.quote(f.marker(f.alpha));assert.equal(snapshot.text,visible);assert.equal(snapshot.dictionaryId,'fixture');
  f.marker(f.alpha).querySelector('[data-like]').click();await f.drain();assert.equal(f.marker(f.alpha).querySelector('[data-like]').getAttribute('aria-pressed'),'true');assert.equal(f.client.getSnapshot().data.items[0].citation.text,visible);
  f.marker(f.alpha).querySelector('[data-quote-actions]').click();f.document.querySelector('[data-menu-copy]').click();await f.drain();assert.deepEqual(f.copied,[visible+'\n\n— Author → Section']);
  const before=f.stats();await f.remount('replacement');assert.notEqual(f.text(f.alpha),visible);assert(f.stats().picks>before.picks);assert.equal(f.controls.quote(f.marker(f.alpha)).dictionaryId,'replacement');
 });
});
