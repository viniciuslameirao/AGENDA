import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
const ui=readFileSync('worker/ui.js','utf8').replace('export const html','const html');
const worker=readFileSync('worker/index.js','utf8').replace("import { html } from './ui.js';",'');
writeFileSync('dist/server/index.js',ui+'\n'+worker);
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
console.log('Worker ESM construído.');
