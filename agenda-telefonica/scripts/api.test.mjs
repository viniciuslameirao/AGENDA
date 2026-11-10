import test from 'node:test';import assert from 'node:assert/strict';import {database} from './local.mjs';import worker from '../worker/index.js';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const body={name:'Ana Silva',phone:'(11) 99999-1234',email:'ana@example.com',category:'Família',company:'',notes:'Teste',favorite:false};
test('CRUD, validação, busca, favorito, origem e persistência SQLite',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'agenda-'));let DB=database(join(dir,'test.sqlite'));
 const call=(path='',method='GET',data,headers={})=>worker.fetch(new Request('http://localhost/api/contacts'+path,{method,headers:{'Content-Type':'application/json',...headers},...(data!==undefined?{body:typeof data==='string'?data:JSON.stringify(data)}:{})}),{DB});
 try{
 assert.equal((await call('','POST',{...body,phone:'abc'})).status,400);
 assert.equal((await call('','POST','{')).status,400);
 assert.equal((await call('','POST',body,{Origin:'https://other.test'})).status,403);
 const res=await call('','POST',body);assert.equal(res.status,201);const c=await res.json();assert.ok(c.id);
 assert.equal((await(await call('?q=ana')).json()).length,1);
 assert.equal((await(await call('?q=zzzz')).json()).length,0);
 assert.equal((await call('/'+c.id,'PUT',{...body,favorite:true,name:'Ana atualizada'})).status,200);
 DB.sqlite.close();DB=database(join(dir,'test.sqlite'));
 const saved=await(await call('/'+c.id)).json();assert.equal(saved.favorite,1);assert.equal(saved.name,'Ana atualizada');
 assert.equal((await call('/'+c.id,'DELETE')).status,204);assert.equal((await call('/'+c.id)).status,404);assert.equal((await call('/missing','PUT',body)).status,404);
 }finally{DB.sqlite.close();rmSync(dir,{recursive:true});}
});
