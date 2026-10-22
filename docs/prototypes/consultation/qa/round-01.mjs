const task=await taskSpace('在线咨询原型评审-20261022');
const page=task.page('p1');
await page.goto('http://127.0.0.1:4176/index.html#patient');
await page.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1040,deviceScaleFactor:1,mobile:false});
console.log({spaceId:task.spaceId,page:page.label});
console.log(await page.snapshot());
