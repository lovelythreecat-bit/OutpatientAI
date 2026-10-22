const task=await taskSpace(5);const page=task.page('p1');
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1040,deviceScaleFactor:1,mobile:false});
console.log(await page.evaluate(()=>({width:innerWidth,height:innerHeight})));
await page.evaluate(()=>{const messages=document.querySelector('.messages');messages.scrollTop=messages.scrollHeight});
await page.screenshot({path:'F:/Work/hospital/hos/docs/prototypes/consultation/screenshots/02-ai-handoff.png'});
console.log(await page.snapshot());
