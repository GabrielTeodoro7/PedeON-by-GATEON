// PedeON / GATEON — webhook WhatsApp Cloud API + respostas com IA.
// Secrets obrigatórios no Supabase: META_VERIFY_TOKEN, META_APP_SECRET,
// META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID, OPENAI_API_KEY.
// Sem essas credenciais, o serviço NÃO envia mensagens nem inventa pedidos.
const cors={"content-type":"application/json"};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const enc=new TextEncoder();
async function validSignature(body:string,signature:string,secret:string){
 if(!signature.startsWith("sha256="))return false;
 const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const hash=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(body)));
 const expected="sha256="+Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
 if(signature.length!==expected.length)return false;
 let diff=0;for(let i=0;i<expected.length;i++)diff|=signature.charCodeAt(i)^expected.charCodeAt(i);
 return diff===0;
}
Deno.serve(async(req)=>{
 const url=new URL(req.url);
 if(req.method==="GET"){
  const token=Deno.env.get("META_VERIFY_TOKEN");
  if(!token)return json({error:"not_configured"},503);
  if(url.searchParams.get("hub.mode")==="subscribe"&&url.searchParams.get("hub.verify_token")===token)
   return new Response(url.searchParams.get("hub.challenge")??"",{status:200});
  return json({error:"verification_failed"},403);
 }
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 const secret=Deno.env.get("META_APP_SECRET");
 const waToken=Deno.env.get("META_WHATSAPP_TOKEN");
 const phoneId=Deno.env.get("META_PHONE_NUMBER_ID");
 const aiKey=Deno.env.get("OPENAI_API_KEY");
 if(!secret||!waToken||!phoneId||!aiKey)return json({error:"not_configured"},503);
 const body=await req.text();
 if(body.length>200000)return json({error:"payload_too_large"},413);
 if(!await validSignature(body,req.headers.get("x-hub-signature-256")??"",secret))
  return json({error:"invalid_signature"},401);
 let payload:any;try{payload=JSON.parse(body)}catch{return json({error:"invalid_json"},400)}
 const messages=(payload.entry??[]).flatMap((e:any)=>(e.changes??[]).flatMap((c:any)=>c.value?.messages??[]));
 for(const msg of messages.slice(0,10)){
  if(msg.type!=="text"||typeof msg.text?.body!=="string"||!/^[0-9]{8,20}$/.test(msg.from??""))continue;
  const question=msg.text.body.slice(0,1500);
  try{
   const ai=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",headers:{"authorization":"Bearer "+aiKey,"content-type":"application/json"},
    body:JSON.stringify({model:Deno.env.get("OPENAI_MODEL")||"gpt-4.1-mini",max_output_tokens:250,
     instructions:"Você é o assistente PedeON de atendimento inicial. Responda em português do Brasil, de forma breve. Não invente cardápio, preços, disponibilidade, status de pedidos ou pagamentos. Para informações não conectadas, encaminhe ao restaurante. Não solicite dados de cartão. Não confirme pedidos ou pagamentos.",
     input:question})
   });
   if(!ai.ok)throw Error("ai_unavailable");
   const result=await ai.json();
   const answer=(result.output??[]).flatMap((x:any)=>x.content??[]).filter((x:any)=>x.type==="output_text").map((x:any)=>x.text).join("\n").slice(0,1600)||"Vou encaminhar sua dúvida para o restaurante.";
   const sent=await fetch("https://graph.facebook.com/v22.0/"+encodeURIComponent(phoneId)+"/messages",{
    method:"POST",headers:{"authorization":"Bearer "+waToken,"content-type":"application/json"},
    body:JSON.stringify({messaging_product:"whatsapp",to:msg.from,type:"text",text:{body:answer}})
   });
   if(!sent.ok)throw Error("whatsapp_send_failed");
  }catch(err){console.error("Message processing failed",String(err))}
 }
 return json({received:true});
});
