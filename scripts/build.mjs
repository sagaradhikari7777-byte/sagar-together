import {cp,mkdir,rm} from 'node:fs/promises';
import {copyOCR} from './ocr-assets.mjs';
await rm('dist',{recursive:true,force:true});await mkdir('dist');await cp('public','dist',{recursive:true});await copyOCR('dist/ocr');console.log('Together built successfully');
