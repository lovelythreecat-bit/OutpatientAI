const task=await taskSpace('医生端原型对齐-20261022');const page=task.page('p1');
await page.goto('file:///F:/Work/hospital/hos/docs/prototypes/consultation/index.html#doctor');
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1040,deviceScaleFactor:1,mobile:false});
console.log({spaceId:task.spaceId});
await page.screenshot({path:'F:/Work/hospital/hos/docs/prototypes/consultation/screenshots/10-doctor-chat.png'});
console.log(await page.snapshot());
