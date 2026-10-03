export function frequentMerchants(expenses,catalog,seat){
 const counts=new Map();expenses.filter(e=>e.creator===seat&&catalog.includes(e.merchant)).forEach(e=>{const n=counts.get(e.merchant)||{name:e.merchant,count:0,date:''};n.count++;n.date=n.date>e.date?n.date:e.date;counts.set(e.merchant,n);});
 return [...counts.values()].sort((a,b)=>b.count-a.count||b.date.localeCompare(a.date)||a.name.localeCompare(b.name)).slice(0,4).map(e=>e.name);
}
