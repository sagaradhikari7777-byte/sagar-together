import {validDate} from './recurring.js';
export function parseReceipt(text,merchants=[],today=new Date().toISOString().slice(0,10)){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const amounts=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(!/\b(total|amount\s+due|balance\s+due)\b/i.test(line)||/sub\s*total|tax|gst|change|cash|saving|discount/i.test(line))continue;
  const values=(line.match(/(?<![\d.,])(?:\$\s*)?(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?!\d)/g)||[]);
  if(!values.length&&lines[i+1]&&/^\$?\s*\d+(?:,\d{3})*\.\d{2}$/.test(lines[i+1]))values.push(lines[i+1]);
  if(values.length===1){const cents=Math.round(Number(values[0].replace(/[$,\s]/g,''))*100);if(cents>0&&cents<=999999999)amounts.push(cents);}
 }
 const unique=[...new Set(amounts)];
 const candidate=lines.slice(0,5).find(line=>/[a-z]{3}/i.test(line)&&!/(receipt|invoice|tax|abn|www\.|https?:|tel|phone|thank)/i.test(line)&&!/[\d]{4}/.test(line))||'';
 const known=merchants.find(m=>lines.slice(0,8).some(line=>line.toLowerCase().replace(/[^a-z0-9]/g,'')===m.toLowerCase().replace(/[^a-z0-9]/g,'')));
 const dates=[];
 for(const line of lines){
  for(const match of line.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g))dates.push(`${match[1]}-${match[2]}-${match[3]}`);
  for(const match of line.matchAll(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})\b/g))dates.push(`${match[3].length===2?'20'+match[3]:match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`);
  const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  for(const match of line.matchAll(/\b(\d{1,2})\s+(Jan\w*|Feb\w*|Mar\w*|Apr\w*|May|Jun\w*|Jul\w*|Aug\w*|Sep\w*|Oct\w*|Nov\w*|Dec\w*)\s+(\d{4})\b/gi))dates.push(`${match[3]}-${String(months.indexOf(match[2].slice(0,3).toLowerCase())+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`);
 }
 const valid=[...new Set(dates.filter(d=>validDate(d)&&d<=today))];
 return {merchant:(known||candidate).slice(0,80),cents:unique.length===1?unique[0]:null,date:valid.length===1?valid[0]:'',ambiguousAmount:unique.length>1};
}
let library;
function loadLibrary(){
 if(globalThis.Tesseract)return Promise.resolve(globalThis.Tesseract);
 if(!library)library=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/ocr/tesseract.min.js';script.onload=()=>resolve(globalThis.Tesseract);script.onerror=()=>{script.remove();library=null;reject(new Error('Receipt scanning could not load. Check your connection and try again.'));};document.head.append(script);});
 return library;
}
export function scanReceipt(image,onProgress=()=>{}){
 let worker,cancelled=false,timer,rejectCancellation;
 const stopped=new Promise((_,reject)=>{rejectCancellation=reject;});
 const cancel=()=>{cancelled=true;if(worker)void worker.terminate();};
 const result=(async()=>{
  try{
   timer=setTimeout(()=>{cancel();rejectCancellation(new Error('Scanning took too long. Try a clearer, cropped receipt.'));},120000);
   const Tesseract=await loadLibrary();if(cancelled)throw new Error('Scan cancelled.');
   worker=await Tesseract.createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/lang',workerBlobURL:false,logger:m=>{if(!cancelled)onProgress(m.status==='recognizing text'?`Reading receipt · ${Math.round((m.progress||0)*100)}%`:'Preparing scanner…');}});
   if(cancelled)throw new Error('Scan cancelled.');
   const {data}=await worker.recognize(image);return data.text;
  }finally{clearTimeout(timer);if(worker)await worker.terminate();}
 })();
 // Cancellation also rejects immediately while the worker is still initializing.
 return {result:Promise.race([result,stopped]),cancel:()=>{clearTimeout(timer);cancel();rejectCancellation(new Error('Scan cancelled.'));}};
}
