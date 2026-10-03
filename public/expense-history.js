const fields=['merchant','cents','category','date','payer','split','sheet','notes','receipt'];
// Receipt history stores presence only; image bytes and private blob references stay out.
export function expenseHistory(previous,next,seat,names,now=new Date().toISOString()){
 const history=Array.isArray(previous?.history)?[...previous.history]:[];
 if(!history.length)history.push({action:'created',date:previous?.created||now,by:previous?.creator??seat,name:names[previous?.creator??seat]||'Unknown member',changes:[]});
 if(previous){
  const changes=fields.filter(field=>(previous[field]??'')!==(next[field]??'')).map(field=>({field,before:field==='receipt'?!!previous[field]:previous[field]??'',after:field==='receipt'?!!next[field]:next[field]??''}));
  if(changes.length)history.push({action:'edited',date:now,by:seat,name:names[seat],names:[...names],changes});
 }
 return history;
}
