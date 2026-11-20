import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.95.3';
const supabase=createClient('https://lutemrmbswbcxiznfhny.supabase.co','sb_publishable_W9exzQqMEaTaHvhBKyQJKQ_rtA11Pe7');
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const money=c=>(Number(c)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
let session=null,restaurantId=null,restaurants=[],products=[],cart={},favoriteIds=new Set(),onlyFavorites=false;
const show=(id,yes)=>$(id).classList.toggle('hidden',!yes);
function notice(msg,error=false){$('message').className=error?'err':'muted';$('message').textContent=msg;window.scrollTo({top:0,behavior:'smooth'})}
async function call(p){const {data,error}=await p;if(error)throw error;return data}
async function refresh(){const {data:{session:s}}=await supabase.auth.getSession();session=s;show('authSection',!s);show('ownerSection',!!s);show('historySection',!!s);$('session').innerHTML=s?'<span>👤 '+safe(s.user.email)+'</span><button id="logout" class="secondary-action">Sair</button>':'<span class="muted">Entre para administrar ou finalizar pedidos.</span>';if(s){$('logout').onclick=()=>supabase.auth.signOut();await loadMine();await loadHistory()}else{show('manageSection',false);restaurantId=null}await loadShop()}
$('authForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await call(supabase.auth.signInWithPassword({email:f.get('email'),password:f.get('password')}));notice('Login realizado!');await refresh()}catch(err){notice(err.message,true)}};
$('signup').onclick=async()=>{const f=new FormData($('authForm'));try{await call(supabase.auth.signUp({email:f.get('email'),password:f.get('password')}));notice('Cadastro solicitado! Confirme seu e-mail se a confirmação estiver habilitada.');await refresh()}catch(err){notice(err.message,true)}};
supabase.auth.onAuthStateChange(()=>{setTimeout(refresh,0)});
async function loadMine(){try{const memberships=await call(supabase.from('restaurant_members').select('restaurant_id,role'));const ids=memberships.map(m=>m.restaurant_id);const mine=ids.length?await call(supabase.from('restaurants').select('id,name,slug').in('id',ids)):[];$('myRestaurants').innerHTML=mine.length?mine.map(r=>'<button class="secondary-action" data-manage="'+safe(r.id)+'">'+safe(r.name)+'</button>').join(' '):'<p class="muted">Você ainda não possui restaurante.</p>';if(restaurantId&&!ids.includes(restaurantId)){restaurantId=null;show('manageSection',false)}else if(restaurantId)await loadManage()}catch(err){notice(err.message,true)}}
$('restaurantForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{const id=await call(supabase.rpc('create_restaurant',{p_name:f.get('name'),p_slug:f.get('slug')}));restaurantId=id;e.target.reset();notice('Restaurante criado!');await loadMine();await loadShop()}catch(err){notice(err.message,true)}};
$('myRestaurants').onclick=e=>{const b=e.target.closest('[data-manage]');if(b){restaurantId=b.dataset.manage;show('manageSection',true);loadManage()}};
async function loadManage(){if(!restaurantId)return;try{const [r,c,p,o]=await Promise.all([call(supabase.from('restaurants').select('name,slug,welcome_message').eq('id',restaurantId).single()),call(supabase.from('categories').select('id,name').eq('restaurant_id',restaurantId).order('sort_order')),call(supabase.from('products').select('id,name,price_cents,available').eq('restaurant_id',restaurantId).order('created_at',{ascending:false})),call(supabase.from('orders').select('id,customer_name,status,fulfillment,total_cents,created_at').eq('restaurant_id',restaurantId).order('created_at',{ascending:false}).limit(60))]);show('manageSection',true);
const active=o.filter(x=>!['delivered','cancelled'].includes(x.status)).length;
const completed=o.filter(x=>x.status==='delivered');
const revenue=completed.reduce((sum,x)=>sum+Number(x.total_cents||0),0);
const pending=o.filter(x=>x.status==='pending').length;
$('pulseMetrics').innerHTML=[
 ['Pedidos recentes',o.length,'📦'],
 ['Em andamento',active,'⚡'],
 ['Aguardando aceite',pending,'⏳'],
 ['Entregues',completed.length,'✅'],
 ['Valor entregue (últimos 60)',money(revenue),'📈']
].map(([label,value,emoji])=>'<article class="item"><span>'+emoji+' '+label+'</span><h3>'+value+'</h3></article>').join('');
$('manageTitle').textContent='Gerenciar '+r.name;$('welcomeInput').value=r.welcome_message||'';$('productCategory').innerHTML=c.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.name)+'</option>').join('');$('ownProducts').innerHTML=p.length?p.map(x=>'<div class="item"><b>'+safe(x.name)+'</b><p>'+money(x.price_cents)+'</p><span>'+ (x.available?'Disponível':'Indisponível')+'</span></div>').join(''):'<p>Nenhum produto cadastrado.</p>';$('ownOrders').innerHTML=o.length?'<table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th><th>Ação</th></tr></thead><tbody>'+o.map(x=>'<tr><td>'+safe(x.id.slice(0,8))+'</td><td>'+safe(x.customer_name)+'</td><td>'+money(x.total_cents)+'</td><td>'+safe(x.status)+'</td><td><select data-order="'+safe(x.id)+'">'+[x.status,...({pending:['accepted','cancelled'],accepted:['preparing','cancelled'],preparing:['ready','cancelled'],ready:['dispatched'],dispatched:['delivered']}[x.status]||[])].map(s=>'<option '+(x.status===s?'selected':'')+' value="'+s+'">'+s+'</option>').join('')+'</select></td></tr>').join('')+'</tbody></table>':'<p>Nenhum pedido recebido.</p>';
await loadOperations(o,r);
const reviews=await call(supabase.from('order_reviews').select('rating,message,created_at').eq('restaurant_id',restaurantId).order('created_at',{ascending:false}).limit(30));
$('restaurantReviews').innerHTML=reviews.length?reviews.map(v=>'<article class="item"><strong>'+('⭐'.repeat(v.rating))+'</strong><p>'+safe(v.message||'Avaliação sem recado')+'</p><small class="muted">'+new Date(v.created_at).toLocaleDateString('pt-BR')+'</small></article>').join(''):'<p class="muted">As avaliações dos clientes aparecerão aqui.</p>';
}catch(err){notice(err.message,true)}}
$('welcomeForm').onsubmit=async e=>{e.preventDefault();if(!restaurantId)return;try{const value=String(new FormData(e.target).get('welcome')||'').trim();if(!value||value.length>180)throw Error('Escreva um recadinho de até 180 caracteres.');await call(supabase.from('restaurants').update({welcome_message:value}).eq('id',restaurantId));await loadShop();notice('Mensagem atualizada!')}catch(err){notice(err.message,true)}};
const templates={
 received:'Olá! Recebemos seu pedido e já estamos organizando tudo. Obrigado por escolher nosso restaurante!',
 preparing:'Seu pedido está em preparo. Avisaremos quando estiver pronto!',
 ready:'Seu pedido está pronto para retirada. Esperamos você!',
 delivery:'Seu pedido saiu para entrega. Em breve chegará ao endereço informado.'
};
function updateSmart(){ $('smartText').value=templates[$('smartTemplate').value]||'' }
$('smartTemplate').onchange=updateSmart;
$('copySmart').onclick=async()=>{try{await navigator.clipboard.writeText($('smartText').value);notice('Mensagem copiada!')}catch(e){notice('Selecione e copie a mensagem manualmente.',true)}};
$('copyMenuLink').onclick=async()=>{try{await navigator.clipboard.writeText($('menuLink').value);notice('Link copiado!')}catch(e){notice('Selecione e copie o link manualmente.',true)}};
updateSmart();
async function loadOperations(orders,restaurant){
 const [deals,stock,dispatch]=await Promise.all([
  call(supabase.from('promotions').select('id,code,discount_percent,active,expires_at').eq('restaurant_id',restaurantId).order('created_at',{ascending:false}).limit(50)),
  call(supabase.from('inventory_items').select('id,name,unit,quantity,minimum_quantity').eq('restaurant_id',restaurantId).order('created_at',{ascending:false}).limit(100)),
  call(supabase.from('delivery_assignments').select('order_id,courier_name,courier_phone').eq('restaurant_id',restaurantId))
 ]);
 $('dealsList').innerHTML=deals.length?deals.map(d=>'<div class="item"><b>'+safe(d.code)+'</b> · '+d.discount_percent+'% <button class="secondary-action" data-deal="'+safe(d.id)+'" data-active="'+(!d.active)+'">'+(d.active?'Desativar':'Ativar')+'</button></div>').join(''):'<p class="muted">Nenhuma campanha cadastrada.</p>';
 $('stockList').innerHTML=stock.length?stock.map(x=>'<div class="item"><b>'+safe(x.name)+'</b><p>'+safe(x.quantity)+' '+safe(x.unit)+' · mínimo '+safe(x.minimum_quantity)+'</p>'+(Number(x.quantity)<=Number(x.minimum_quantity)?'<strong style="color:#b42318">⚠️ Estoque baixo</strong>':'<span>Estoque OK</span>')+'<label>Atualizar quantidade<input type="number" min="0" step=".001" data-stock-input="'+safe(x.id)+'" value="'+safe(x.quantity)+'"></label><button class="secondary-action" data-save-stock="'+safe(x.id)+'">Salvar</button></div>').join(''):'<p class="muted">Nenhum insumo cadastrado.</p>';
 const assignable=orders.filter(o=>o.fulfillment==='delivery'&&!['cancelled','delivered'].includes(o.status));
 $('dispatchOrder').innerHTML=assignable.length?assignable.map(o=>'<option value="'+safe(o.id)+'">#'+safe(o.id.slice(0,8))+' · '+safe(o.customer_name)+'</option>').join(''):'<option value="">Nenhum pedido de entrega disponível</option>';
 $('dispatchList').innerHTML=dispatch.length?dispatch.map(d=>'<div class="item"><b>Pedido #'+safe(d.order_id.slice(0,8))+'</b><p>'+safe(d.courier_name)+'</p></div>').join(''):'<p class="muted">Nenhum entregador vinculado.</p>';
 const url=new URL('./painel.html',location.href);
 url.searchParams.set('loja',restaurant.slug||'');
 $('menuLink').value=url.href;
}
$('dealForm').onsubmit=async e=>{e.preventDefault();if(!restaurantId)return;const f=new FormData(e.target);try{await call(supabase.from('promotions').insert({restaurant_id:restaurantId,code:String(f.get('code')).toUpperCase(),discount_percent:Number(f.get('percent'))}));e.target.reset();await loadManage();notice('Campanha criada!')}catch(err){notice(err.message,true)}};
$('dealsList').onclick=async e=>{const b=e.target.closest('[data-deal]');if(!b)return;try{await call(supabase.from('promotions').update({active:b.dataset.active==='true'}).eq('id',b.dataset.deal).eq('restaurant_id',restaurantId));await loadManage();notice('Campanha atualizada!')}catch(err){notice(err.message,true)}};
$('stockForm').onsubmit=async e=>{e.preventDefault();if(!restaurantId)return;const f=new FormData(e.target);try{await call(supabase.from('inventory_items').insert({restaurant_id:restaurantId,name:f.get('name'),quantity:Number(f.get('quantity')),minimum_quantity:Number(f.get('minimum')),unit:f.get('unit')}));e.target.reset();await loadManage();notice('Insumo cadastrado!')}catch(err){notice(err.message,true)}};
$('stockList').onclick=async e=>{const b=e.target.closest('[data-save-stock]');if(!b)return;const id=b.dataset.saveStock;const input=Array.from(document.querySelectorAll('[data-stock-input]')).find(el=>el.dataset.stockInput===id);if(!input)return;try{await call(supabase.from('inventory_items').update({quantity:Number(input.value)}).eq('id',id).eq('restaurant_id',restaurantId));await loadManage();notice('Estoque atualizado!')}catch(err){notice(err.message,true)}};
$('dispatchForm').onsubmit=async e=>{e.preventDefault();if(!restaurantId)return;const f=new FormData(e.target);try{await call(supabase.from('delivery_assignments').upsert({restaurant_id:restaurantId,order_id:f.get('order'),courier_name:f.get('courier'),courier_phone:f.get('phone')},{onConflict:'order_id'}));e.target.reset();await loadManage();notice('Entregador vinculado!')}catch(err){notice(err.message,true)}};
$('categoryForm').onsubmit=async e=>{e.preventDefault();try{await call(supabase.from('categories').insert({restaurant_id:restaurantId,name:new FormData(e.target).get('name')}));e.target.reset();await loadManage();notice('Categoria criada!')}catch(err){notice(err.message,true)}};
$('productForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);try{await call(supabase.from('products').insert({restaurant_id:restaurantId,category_id:f.get('category'),name:f.get('name'),description:f.get('description'),price_cents:Math.round(Number(f.get('price'))*100)}));e.target.reset();await loadManage();await loadShop();notice('Produto publicado!')}catch(err){notice(err.message,true)}};
$('ownOrders').onchange=async e=>{const id=e.target.dataset.order;if(!id)return;try{await call(supabase.rpc('advance_order',{p_order:id,p_status:e.target.value}));await loadManage();await loadHistory();notice('Pedido atualizado!')}catch(err){notice(err.message,true)}};
async function loadShop(){try{restaurants=await call(supabase.from('restaurants').select('id,name,slug,welcome_message').eq('active',true).order('name'));const requested=new URLSearchParams(location.search).get('loja');const current=$('shopRestaurant').value;$('shopRestaurant').innerHTML='<option value="">Selecione um restaurante</option>'+restaurants.map(r=>'<option value="'+safe(r.id)+'">'+safe(r.name)+'</option>').join('');if(restaurants.some(r=>r.id===current))$('shopRestaurant').value=current;else if(requested){const match=restaurants.find(r=>r.slug===requested);if(match)$('shopRestaurant').value=match.id}await loadProducts()}catch(err){notice(err.message,true)}}
$('shopRestaurant').onchange=()=>{cart={};onlyFavorites=false;loadProducts()};
$('showAllProducts').onclick=()=>{onlyFavorites=false;renderShopProducts()};
$('showFavorites').onclick=()=>{if(!session){notice('Entre na sua conta para salvar seus favoritos.',true);return}onlyFavorites=true;renderShopProducts()};
async function loadFavorites(){
 favoriteIds=new Set();
 if(!session||!products.length)return;
 const ids=products.map(p=>p.id);
 const rows=await call(supabase.from('product_favorites').select('product_id').in('product_id',ids));
 favoriteIds=new Set(rows.map(x=>x.product_id));
}
function renderShopProducts(){
 const selected=restaurants.find(r=>r.id===$('shopRestaurant').value);
 $('shopWelcome').textContent=selected?'💌 '+(selected.welcome_message||'Feito com carinho, especialmente para você! 💛'):'';
 show('shopWelcome',!!selected);
 const list=onlyFavorites?products.filter(p=>favoriteIds.has(p.id)):products;
 $('shopProducts').innerHTML=list.length?list.map(p=>'<article class="item"><h3>🍔 '+safe(p.name)+'</h3><p>'+safe(p.description)+'</p><b>'+money(p.price_cents)+'</b><div class="row" style="margin-top:12px"><button class="action" data-add="'+safe(p.id)+'">Adicionar +</button><button class="heart '+(favoriteIds.has(p.id)?'saved':'')+'" data-favorite="'+safe(p.id)+'" aria-label="'+(favoriteIds.has(p.id)?'Remover dos favoritos':'Salvar nos favoritos')+'">'+(favoriteIds.has(p.id)?'★ Salvo':'☆ Favoritar')+'</button></div></article>').join(''):'<p class="muted">'+(onlyFavorites?'Seus produtos favoritos vão aparecer aqui.':'Selecione um restaurante com produtos disponíveis.')+'</p>';
 drawCart();
}
async function loadProducts(){
 const id=$('shopRestaurant').value;
 try{
  products=id?await call(supabase.from('products').select('id,name,description,price_cents').eq('restaurant_id',id).eq('available',true).order('name')):[];
  await loadFavorites();
  renderShopProducts();
 }catch(err){notice(err.message,true)}
}
$('shopProducts').onclick=e=>{const b=e.target.closest('[data-add]');if(b){const id=b.dataset.add;cart[id]=(cart[id]||0)+1;drawCart();return}const heart=e.target.closest('[data-favorite]');if(heart)toggleFavorite(heart.dataset.favorite)};
async function toggleFavorite(id){
 if(!session){notice('Faça login para guardar seus favoritos.',true);return}
 if(!products.some(p=>p.id===id))return;
 try{
  if(favoriteIds.has(id)){
   await call(supabase.from('product_favorites').delete().eq('user_id',session.user.id).eq('product_id',id));
   favoriteIds.delete(id);
  }else{
   await call(supabase.from('product_favorites').insert({user_id:session.user.id,product_id:id}));
   favoriteIds.add(id);
  }
  renderShopProducts();
 }catch(err){notice(err.message,true)}
}
function drawCart(){const entries=Object.entries(cart).filter(([id,q])=>q>0&&products.some(p=>p.id===id));const total=entries.reduce((n,[id,q])=>n+products.find(p=>p.id===id).price_cents*q,0);$('cartBox').innerHTML=entries.length?'<h3>🛒 Carrinho</h3>'+entries.map(([id,q])=>'<p>'+safe(products.find(p=>p.id===id).name)+' × '+q+' <button class="secondary-action" data-remove="'+safe(id)+'">−</button></p>').join('')+'<strong>Total: '+money(total)+'</strong>':'<p class="muted">Carrinho vazio.</p>';show('orderForm',entries.length>0)}
$('cartBox').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){cart[b.dataset.remove]--;drawCart()}};
$('fulfillment').onchange=()=>{$('deliveryAddress').required=$('fulfillment').value==='delivery'};
$('deliveryAddress').required=true;
$('orderForm').onsubmit=async e=>{e.preventDefault();if(!session){notice('Faça login antes de confirmar seu pedido.',true);return}const f=new FormData(e.target);const items=Object.entries(cart).filter(([,q])=>q>0).map(([id,quantity])=>({id,quantity}));if(!items.length)return;try{const orderId=await call(supabase.rpc('place_order',{p_restaurant:$('shopRestaurant').value,p_customer_name:f.get('name'),p_customer_phone:f.get('phone'),p_fulfillment:f.get('fulfillment'),p_address:f.get('address'),p_items:items}));cart={};e.target.reset();drawCart();await loadHistory();notice('Pedido confirmado! Código: '+orderId.slice(0,8)+'. Acompanhe com o restaurante.')}catch(err){notice(err.message,true)}};
async function loadHistory(){
 if(!session)return;
 try{
  const orders=await call(supabase.from('orders').select('id,restaurant_id,status,total_cents,created_at,restaurants(name)').eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(30));
  const points=await call(supabase.rpc('my_heart_points'));
  $('heartPoints').textContent=Number(points||0).toLocaleString('pt-BR');
  const delivered=orders.filter(o=>o.status==='delivered').map(o=>o.id);
  const previous=delivered.length?await call(supabase.from('order_reviews').select('order_id').in('order_id',delivered)):[];
  const reviewed=new Set(previous.map(x=>x.order_id));
  const labels={pending:'Recebido',accepted:'Aceito',preparing:'Em preparo',ready:'Pronto',dispatched:'Saiu para entrega',delivered:'Entregue',cancelled:'Cancelado'};
  $('orderHistory').innerHTML=orders.length?orders.map(o=>'<article class="item"><b>Pedido #'+safe(o.id.slice(0,8))+'</b><p>'+safe(o.restaurants?.name||'Restaurante')+'</p><p>'+safe(labels[o.status]||o.status)+'</p><strong>'+money(o.total_cents)+'</strong><p class="muted">'+new Date(o.created_at).toLocaleString('pt-BR')+'</p>'+(o.status==='delivered'&&!reviewed.has(o.id)?'<button class="secondary-action" data-review="'+safe(o.id)+'">💌 Avaliar pedido</button>':o.status==='delivered'?'<small>💖 Avaliado</small>':'')+'</article>').join(''):'<p class="muted">Você ainda não fez pedidos.</p>';
 }catch(err){notice(err.message,true)}
}
$('orderHistory').onclick=async e=>{
 const button=e.target.closest('[data-review]');if(!button||!session)return;
 const orderId=button.dataset.review;
 try{
  const order=await call(supabase.from('orders').select('restaurant_id,status').eq('id',orderId).eq('customer_id',session.user.id).single());
  if(order.status!=='delivered')throw Error('Só é possível avaliar pedidos entregues.');
  const input=prompt('De 1 a 5, quantas estrelinhas merece? ⭐');
  if(input===null)return;
  const rating=Number(input);
  if(!Number.isInteger(rating)||rating<1||rating>5)throw Error('Escolha uma nota de 1 a 5.');
  const message=prompt('Deixe seu comentário (opcional, até 500 caracteres):');
  if(message===null)return;
  if(message.length>500)throw Error('O recadinho deve ter até 500 caracteres.');
  await call(supabase.from('order_reviews').insert({order_id:orderId,restaurant_id:order.restaurant_id,customer_id:session.user.id,rating,message:message.trim()}));
  await loadHistory();
  notice('Avaliação enviada com sucesso!');
 }catch(err){notice(err.message,true)}
};
$('refreshHistory').onclick=loadHistory;
refresh();
