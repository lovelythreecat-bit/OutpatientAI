const task=await taskSpace('在线咨询原型评审-20261022');
const page=task.page('p1');
console.log({spaceId:task.spaceId,page:page.label,url:await page.url()});
console.log(await page.snapshot());
