const task=await taskSpace(5);const page=task.page('p1');
const dir='F:/Work/hospital/hos/docs/prototypes/consultation/screenshots';
await (await import('node:fs/promises')).mkdir(dir,{recursive:true});
await page.screenshot({path:dir+'/01-patient.png'});
await page.click('loc=css:#prototype-nav a[href="#ai"]');
await page.screenshot({path:dir+'/02-ai-handoff.png'});
console.log(await page.snapshot());
