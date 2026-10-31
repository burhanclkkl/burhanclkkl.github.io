/* Pinned js-tiktoken 1.0.21; ordinary text only. All resources are local. */
import { Tiktoken } from '../../assets/vendor/js-tiktoken/lite.js';
import ranks from '../../assets/vendor/js-tiktoken/cl100k_base.js';
let encoder;
const utf8=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});
try{
 encoder=new Tiktoken(ranks);
 // This pinned port stores the original bytes in textMap. Keep access isolated:
 // decoding individual tokens as strings would corrupt split UTF-8 characters.
 if(!(encoder.textMap instanceof Map)||encoder.textMap.size!==100256)throw Error('Vocabulary contract mismatch');
 postMessage({type:'ready',encoding:'cl100k_base',version:'1.0.21'});
}catch{postMessage({type:'init-error'});}
onmessage=event=>{
 const {id,text}=event.data||{};if(!encoder||!Number.isInteger(id)||typeof text!=='string')return;
 try{
  if(text.length>6000)throw Error('Input limit');
  const ids=encoder.encode(text,[],[]),original=utf8.encode(text);let offset=0;
  const tokens=ids.map(id=>{
   const bytes=encoder.textMap.get(id);if(!bytes)throw Error('Unknown token');
   for(let i=0;i<bytes.length;i++)if(original[offset+i]!==bytes[i])throw Error('Byte reconstruction mismatch');
   let decoded=null;try{decoded=decoder.decode(bytes);}catch{}
   const token={id,bytes:Array.from(bytes),start:offset,end:offset+bytes.length,text:decoded};offset+=bytes.length;return token;
  });
  if(offset!==original.length)throw Error('Byte length mismatch');
  postMessage({type:'result',id,tokens,byteLength:offset});
 }catch{postMessage({type:'error',id});}
};
