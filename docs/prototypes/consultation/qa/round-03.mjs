const task=await taskSpace(5);
const page=task.page('p1');
await page.goto('file:///F:/Work/hospital/hos/docs/prototypes/consultation/index.html#patient');
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1040,deviceScaleFactor:1,mobile:false});
console.log(await page.snapshot());
