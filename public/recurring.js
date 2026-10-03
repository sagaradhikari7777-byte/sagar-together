export const frequencies={weekly:'Weekly',fortnightly:'Every 2 weeks',monthly:'Monthly',yearly:'Yearly'};
const check=(ok,message,status=400)=>{if(!ok)throw Object.assign(new Error(message),{status});};
export function validDate(value){const d=new Date(value+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;}
const iso=d=>d.toISOString().slice(0,10);
export function nextOccurrence(bill){
 check(validDate(bill.nextDue)&&Object.hasOwn(frequencies,bill.frequency),'Choose a valid recurrence.');
 const d=new Date(bill.nextDue+'T12:00:00Z');
 if(bill.frequency==='weekly'||bill.frequency==='fortnightly'){d.setUTCDate(d.getUTCDate()+(bill.frequency==='weekly'?7:14));return iso(d);}
 const year=d.getUTCFullYear()+(bill.frequency==='yearly'?1:0),month=bill.frequency==='monthly'?d.getUTCMonth()+1:(bill.anchorMonth??d.getUTCMonth());
 const target=new Date(Date.UTC(year,month,1,12)),last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0,12)).getUTCDate();
 target.setUTCDate(Math.min(bill.anchorDay||d.getUTCDate(),last));return iso(target);
}
export function changeRecurring(h,seat,b,{id,record}){
 const bills=h.recurring||[],old=bills.find(x=>x.id===(b.bill?.id||b.id));
 if(b.action==='recurring'){
  const x=b.bill;check(x&&(!x.id||old),'Bill no longer exists.',404);check(!old||old.creator===seat,'Only the person who added this bill can change it.',403);
  const text=(v,max)=>{check(typeof v==='string'&&v.trim()&&v.length<=max,'Check the bill details.');return v.trim();};
  check(Number.isInteger(x.cents)&&x.cents>0&&x.cents<=999999999,'Enter a valid amount.');
  check(Number.isInteger(x.payer)&&x.payer>=0&&x.payer<4,'Choose a payer.');check(['half','a','b'].includes(x.split),'Choose a valid split.');
  check(validDate(x.nextDue)&&Object.hasOwn(frequencies,x.frequency),'Choose a valid due date and frequency.');
  check(!x.sheet||h.sheets.some(s=>s.id===x.sheet),'Choose an existing sheet.');
  const reset=!old||old.nextDue!==x.nextDue||old.frequency!==x.frequency;
  const item={id:old?.id||id(),creator:old?.creator??seat,created:old?.created||new Date().toISOString(),merchant:text(x.merchant,80),category:text(x.category,40),cents:x.cents,payer:x.payer,split:x.split,nextDue:x.nextDue,frequency:x.frequency,notes:typeof x.notes==='string'?x.notes.slice(0,500):'',sheet:x.sheet||'',active:x.active!==false,reminder:x.reminder!==false,anchorDay:reset?Number(x.nextDue.slice(8)):old.anchorDay,anchorMonth:reset?Number(x.nextDue.slice(5,7))-1:old.anchorMonth};
  h.recurring=old?bills.map(bill=>bill.id===old.id?item:bill):[item,...bills];return;
 }
 check(old,'Bill no longer exists.',404);check(old.active,'This bill is paused.');check(b.due===old.nextDue,'This occurrence has already changed. Refresh the bill list.',409);
 check(!h.expenses.some(e=>e.recurring?.bill===old.id&&e.recurring.due===b.due),'This bill occurrence is already recorded.',409);
 check(h.sheets.some(s=>s.id===b.sheet&&!s.archived),'Choose an open sheet.');
 // Validate the next date before recording so failures never leave partial expenses.
 const next=nextOccurrence(old);check(validDate(next),'The next due date is outside the supported range.');
 record({merchant:old.merchant,category:old.category,cents:old.cents,payer:old.payer,split:old.split,date:old.nextDue,notes:old.notes,sheet:b.sheet,receipt:''},{bill:old.id,due:old.nextDue});
 old.nextDue=next;
}
export function upcomingBills(bills,today){const cutoff=new Date(today+'T12:00:00Z');cutoff.setUTCDate(cutoff.getUTCDate()+7);return (bills||[]).filter(b=>b.active&&b.reminder&&b.nextDue<=iso(cutoff)).sort((a,b)=>a.nextDue.localeCompare(b.nextDue));}
