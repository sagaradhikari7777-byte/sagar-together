import {validDate} from './recurring.js';
const day=86400000,stamp=d=>Date.parse(d+'T12:00:00Z'),iso=n=>new Date(n).toISOString().slice(0,10);
export function periodInsight(sheets,expenses,current,today){
 if(!current||!validDate(current.start)||!validDate(today)||current.start>today)return null;
 const end=current.end&&current.end<today?current.end:today;
 const previous=sheets.filter(s=>s.id!==current.id&&validDate(s.start)&&s.start<current.start).sort((a,b)=>b.start.localeCompare(a.start))[0];
 const last=previous?(previous.end||iso(stamp(current.start)-day)):null;
 if(previous&&(!validDate(last)||last<previous.start||last>=current.start))return null;
 // Both samples cover exactly the same number of days, including month-end periods.
 const days=previous?Math.min(Math.floor((stamp(end)-stamp(current.start))/day)+1,Math.floor((stamp(last)-stamp(previous.start))/day)+1):Math.floor((stamp(end)-stamp(current.start))/day)+1;
 const currentEnd=iso(stamp(current.start)+(days-1)*day),previousEnd=previous?iso(stamp(previous.start)+(days-1)*day):null;
 const rows=(sheet,from,to)=>expenses.filter(e=>e.sheet===sheet.id&&e.date>=from&&e.date<=to);
 const now=rows(current,current.start,currentEnd),before=previous?rows(previous,previous.start,previousEnd):[];
 const sum=items=>items.reduce((n,e)=>n+e.cents,0),total=sum(now),previousTotal=sum(before);
 const categories=new Map();now.forEach(e=>categories.set(e.category,(categories.get(e.category)||0)+e.cents));
 const top=[...categories.entries()].sort((a,b)=>b[1]-a[1])[0];
 const changed=[...new Set([...now,...before].map(e=>e.category))].map(category=>({category,delta:sum(now.filter(e=>e.category===category))-sum(before.filter(e=>e.category===category))})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))[0];
 return {total,previousTotal,delta:previousTotal?Math.round((total-previousTotal)/previousTotal*100):null,previous,currentEnd,previousEnd,days,top,changed,count:now.length};
}
