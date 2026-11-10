import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
export function database(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);sqlite.exec(readFileSync(new URL('../drizzle/0000_contacts.sql',import.meta.url),'utf8').replace('CREATE TABLE contacts','CREATE TABLE IF NOT EXISTS contacts').replace('CREATE INDEX contacts_name_idx','CREATE INDEX IF NOT EXISTS contacts_name_idx'));
 return {sqlite,prepare(sql){let args=[];const stmt=sqlite.prepare(sql);return {bind(...v){args=v;return this;},async first(){return stmt.get(...args)||null;},async all(){return {results:stmt.all(...args)};},async run(){const r=stmt.run(...args);return {meta:{changes:Number(r.changes)}};}};}};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const db=database(process.env.DB_PATH||'agenda.sqlite');
 const server=http.createServer(async(req,res)=>{try{const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>12000){res.writeHead(413);res.end();return;}chunks.push(c);}const r=await worker.fetch(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),{DB:db});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch{res.writeHead(500);res.end('Erro interno');}});
 server.listen(Number(process.env.PORT||5173),'127.0.0.1',()=>console.log('Agenda: http://127.0.0.1:'+(process.env.PORT||5173)));
}
