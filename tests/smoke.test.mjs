import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../painel.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../supabase-app.js',import.meta.url),'utf8');
const moduleBody=js.replace(/^import\s+.*?;\s*/,'');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const refs=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);

test('browser JavaScript parses successfully',()=>assert.doesNotThrow(()=>new vm.Script(moduleBody)));
test('all static HTML IDs are unique',()=>assert.equal(new Set(ids).size,ids.length));
test('all DOM references exist (logout is dynamically rendered)',()=>{
 const idSet=new Set(ids);
 assert.deepEqual([...new Set(refs.filter(id=>!idSet.has(id)&&id!=='logout'))],[]);
});
test('critical modules are wired to Supabase',()=>{
 for(const fragment of ["rpc('place_order'","rpc('advance_order'","from('inventory_items')","from('promotions')","from('delivery_assignments')","from('order_reviews')","rpc('my_heart_points')"]){
  assert.ok(js.includes(fragment),'Missing integration: '+fragment);
 }
});
test('UI clearly labels incomplete external integrations',()=>{
 assert.match(html,/sem integra[cç][aã]o com WhatsApp/i);
 assert.match(html,/checkout ainda n[aã]o dispon[ií]vel/i);
});

test('pickup orders can complete without dispatch while delivery orders require dispatch',()=>{
 assert.ok(js.includes("ready:x.fulfillment==='pickup'?['delivered']:['dispatched']"));
});
test('checkout still uses validated server RPC, not direct order inserts',()=>{
 assert.ok(js.includes("supabase.rpc('place_order'"));
 assert.ok(!js.includes("supabase.from('orders').insert("));
});

test('mobile viewport and responsive breakpoints are configured',()=>{
 assert.match(html,/name="viewport"/);
 assert.match(html,/@media\(max-width:768px\)/);
 assert.match(html,/@media\(max-width:480px\)/);
 assert.match(html,/overflow-x:auto/);
 assert.match(html,/min-height:44px/);
});
