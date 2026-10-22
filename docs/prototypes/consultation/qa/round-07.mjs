const task=await taskSpace(5);const page=task.page('p1');const dir='F:/Work/hospital/hos/docs/prototypes/consultation/screenshots';
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1040,deviceScaleFactor:1,mobile:false});
await page.selectOption('loc=css:#doctor-select','0');
await page.waitForSelector('loc=css:.summary-card',{state:'visible'});
console.log('handoff summary count',await page.evaluate(()=>document.querySelectorAll('.summary-card').length));
await page.screenshot({path:dir+'/04-summary-delivered.png'});
await page.click('loc=css:#prototype-nav a[href="#doctor"]');
await page.click('loc=css:#toggle-selection');
console.log(await page.snapshot());
