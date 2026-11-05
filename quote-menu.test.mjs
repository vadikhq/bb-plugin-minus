import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountQuoteMenu,copyQuoteText} from './quote-menu.ts';
import {createQuoteControls,QUOTE_HTML} from './quote-controls.ts';
import {createFavoritesClient} from './favorites-client.ts';

const quote={id:'q',text:'Exact text.\nSecond line.',author:'Author',section:'Section',sourceTitle:'Private source',locator:'/private/file',dictionaryId:'test',dictionaryTitle:'Dictionary'};
test('copy payload keeps exact text and visible attribution, excluding private metadata and counts',()=>{
 assert.equal(copyQuoteText(quote),'Exact text.\nSecond line.\n\n— Author → Section');
 assert.equal(copyQuoteText({...quote,section:''}),'Exact text.\nSecond line.\n\n— Author');
});

// JSDOM tests lifecycle and async policy. Native popover positioning and
// pointer light-dismiss are verified separately in real headless Chromium.
function fixture(write) {
 const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'http://127.0.0.1/',pretendToBeVisual:true});
 const {window}=dom, previous=new Map();
 for(const [key,value] of Object.entries({document:window.document,Element:window.Element})){
  previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value});
 }
 const client=createFavoritesClient(async()=>({revision:0,items:[]}),async()=>{});client.accept({revision:0,items:[]});
 const controls=createQuoteControls(client),row=window.document.createElement('div');row.setAttribute('data-bb-minus-group','one');row.innerHTML=QUOTE_HTML;row.querySelector('[data-row]').style.columnGap='8px';window.document.body.append(row);controls.render(row,quote);
 const menu=mountQuoteMenu(controls,write),popup=window.document.querySelector('[data-minus-quote-menu]');
 let open=false;const matches=popup.matches.bind(popup);
 popup.matches=s=>s===':popover-open'?open:matches(s);popup.showPopover=()=>{open=true};popup.hidePopover=()=>{open=false};
 menu.prepare(row);
 const trigger=row.querySelector('[data-quote-actions]'),copy=popup.querySelector('[data-menu-copy]');
 const tick=()=>new Promise(r=>setImmediate(r));
 return {dom,controls,row,menu,popup,trigger,copy,tick,isOpen:()=>open,
  close(){try{menu.dispose();assert.equal(window.document.querySelector('[data-minus-quote-menu]'),null)}finally{for(const [key,d] of previous){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key]}window.close()}}
 };
}
test('copy duplicate guard, error retry, keyboard and focus preserve the same quote and disclosure',async()=>{
 let release,calls=0;const texts=[];
 const f=fixture(text=>{calls++;texts.push(text);return new Promise(r=>release=r)});
 try{
  f.trigger.click();assert(f.isOpen());assert.equal(f.dom.window.document.activeElement,f.copy);
  assert.equal(f.popup.querySelector('[data-menu-settings]').getAttribute('href'),'/settings/plugins/minus#minus-favorites');
  f.copy.click();f.copy.click();assert.equal(calls,1);assert.equal(f.copy.getAttribute('aria-busy'),'true');
  release(false);await f.tick();assert.equal(f.copy.dataset.state,'error');assert.equal(f.copy.getAttribute('aria-disabled'),'false');
  f.copy.click();release(true);await f.tick();assert.equal(f.copy.dataset.state,'copied');assert.equal(calls,2);assert.equal(texts[0],copyQuoteText(quote));
  assert.equal(f.row.querySelector('[data-metrics]').getAttribute('aria-expanded'),'false');
  f.copy.dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(f.dom.window.document.activeElement,f.popup.querySelector('[data-menu-settings]'));
  f.popup.querySelector('a').dispatchEvent(new f.dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(!f.isOpen());assert.equal(f.dom.window.document.activeElement,f.trigger);
 }finally{f.close()}
});
test('removed or replaced quote and disposal invalidate a late clipboard response',async()=>{
 let release;const f=fixture(()=>new Promise(r=>release=r));
 try{
  f.trigger.click();f.copy.click();f.controls.render(f.row,{...quote,text:'Replacement'});f.menu.refresh();assert(!f.isOpen());
  f.trigger.click();assert.equal(f.copy.dataset.state,'idle');release(true);await f.tick();assert.equal(f.copy.dataset.state,'idle','old result cannot mark new quote as copied');
  f.row.remove();f.menu.refresh();assert(!f.isOpen());
  f.dom.window.document.body.append(f.row);f.trigger.click();f.copy.click();f.menu.dispose();release(true);await f.tick();assert.equal(f.dom.window.document.querySelector('[data-minus-quote-menu]'),null);
 }finally{f.close()}
});
test('streaming layout movement closes the popup even when there is no scroll event',()=>{
 const f=fixture(async()=>true);
 try{
  f.trigger.click();assert(f.isOpen());
  const before=f.trigger.getBoundingClientRect();
  f.trigger.getBoundingClientRect=()=>({...before,x:before.x,y:before.y+before.height+1});
  f.menu.refresh();assert(!f.isOpen());assert.equal(f.trigger.getAttribute('aria-expanded'),'false');
 }finally{f.close()}
});
