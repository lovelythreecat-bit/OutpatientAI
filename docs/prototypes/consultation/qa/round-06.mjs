const task=await taskSpace(5);const page=task.page('p1');
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1040,deviceScaleFactor:1,mobile:false});
await page.click('loc=css:#handoff');
console.log(await page.snapshot());
await page.screenshot({path:'F:/Work/hospital/hos/docs/prototypes/consultation/screenshots/03-doctor-picker.png'});
