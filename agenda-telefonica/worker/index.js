import { html } from './ui.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function validate(b){
 if(!b||typeof b!=='object'||Array.isArray(b))return 'Envie um objeto JSON.';
 for(const [key,max] of Object.entries({name:100,phone:30,email:150,company:100,notes:1000,category:20}))if(typeof b[key]!=='string'||b[key].length>max)return 'Campo inválido: '+key;
 if(b.name.trim().length<2)return 'Informe um nome com pelo menos 2 caracteres.';
 if(!/^[+\d\s().-]+$/.test(b.phone)||b.phone.replace(/\D/g,'').length<8||b.phone.replace(/\D/g,'').length>15)return 'Informe um telefone com 8 a 15 dígitos.';
 if(b.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))return 'E-mail inválido.';
 if(!['Pessoal','Família','Trabalho','Serviços'].includes(b.category))return 'Grupo inválido.';
 if(typeof b.favorite!=='boolean')return 'Favorito deve ser verdadeiro ou falso.';
}
export default {async fetch(request,env){
 const u=new URL(request.url),path=u.pathname;
 if(path==='/'&&request.method==='GET')return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'self' https://*.chatgpt.com https://chatgpt.com",'X-Content-Type-Options':'nosniff'}});
 if(path==='/api/health'&&request.method==='GET'){
 try{await env.DB.prepare('SELECT 1 AS ok').first();return json({status:'ok',database:'SQLite / D1'});}catch{return json({error:'Banco indisponível.'},503);}}
 const match=path.match(/^\/api\/contacts(?:\/([a-zA-Z0-9-]+))?$/);if(!match)return json({error:'Recurso não encontrado.'},404);
 const id=match[1];
 if(!['GET','POST','PUT','DELETE'].includes(request.method))return json({error:'Método não permitido.'},405);
 if(request.method!=='GET'){
 const origin=request.headers.get('Origin');if(origin&&origin!==u.origin)return json({error:'Origem não permitida.'},403);
 }
 try{
 const db=env.DB;
 if(request.method==='GET'){
 if(id){const c=await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first();return c?json(c):json({error:'Contato não encontrado.'},404);}
 const q=(u.searchParams.get('q')||'').trim().toLowerCase();
 const {results}=await db.prepare('SELECT * FROM contacts ORDER BY name COLLATE NOCASE').all();
 return json(results.filter(c=>!q||[c.name,c.phone,c.email,c.company].some(v=>v.toLowerCase().includes(q))));
 }
 if(request.method==='DELETE'){
 if(!id)return json({error:'Informe o ID.'},400);
 const r=await db.prepare('DELETE FROM contacts WHERE id = ?').bind(id).run();return r.meta.changes?new Response(null,{status:204}):json({error:'Contato não encontrado.'},404);
 }
 if((request.method==='POST'&&id)||(request.method==='PUT'&&!id))return json({error:'Rota inválida para este método.'},405);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Use Content-Type: application/json.'},415);
 if(Number(request.headers.get('content-length')||0)>10000)return json({error:'Corpo muito grande.'},413);
 const raw=await request.text();if(raw.length>10000)return json({error:'Corpo muito grande.'},413);
 let b;try{b=JSON.parse(raw);}catch{return json({error:'JSON inválido.'},400);}
 const err=validate(b);if(err)return json({error:err},400);
 const values=[b.name.trim(),b.phone.trim(),b.email.trim(),b.category,b.company.trim(),b.notes.trim(),b.favorite?1:0];
 if(request.method==='POST'){
 const newId=crypto.randomUUID(),date=new Date().toISOString();
 await db.prepare('INSERT INTO contacts (name,phone,email,category,company,notes,favorite,id,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(...values,newId,date).run();
 return json(await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(newId).first(),201);
 }
 const r=await db.prepare('UPDATE contacts SET name=?,phone=?,email=?,category=?,company=?,notes=?,favorite=? WHERE id=?').bind(...values,id).run();
 return r.meta.changes?json(await db.prepare('SELECT * FROM contacts WHERE id=?').bind(id).first()):json({error:'Contato não encontrado.'},404);
 }catch(e){console.error('Falha na API',e);return json({error:'Não foi possível acessar os contatos. Tente novamente.'},500);}
}};
