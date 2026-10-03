import {cp,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
export async function copyOCR(target){
 await mkdir(path.join(target,'core'),{recursive:true});await mkdir(path.join(target,'lang'),{recursive:true});
 for(const file of ['tesseract.min.js','worker.min.js','tesseract.min.js.LICENSE.txt','worker.min.js.LICENSE.txt'])await cp('node_modules/tesseract.js/dist/'+file,path.join(target,file));
 for(const file of await readdir('node_modules/tesseract.js-core'))if(/\.wasm(?:\.js)?$/.test(file)||file==='LICENSE')await cp('node_modules/tesseract.js-core/'+file,path.join(target,'core',file));
 await cp('node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz',path.join(target,'lang','eng.traineddata.gz'));
}
