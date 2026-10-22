const task=await taskSpace(5);const page=task.page('p1');
await page.goto('file:///F:/Work/hospital/hos/docs/prototypes/consultation/index.html#review');
await task.finish({keep:['p1']});
console.log('Interactive prototype kept open for review.');
