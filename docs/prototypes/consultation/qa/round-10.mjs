const task=await taskSpace(5);const page=task.page('p1');
console.log(await page.evaluate(()=>({hash:location.hash,selecting:document.querySelector('.chat')?.className,button:document.querySelector('#toggle-selection')?.textContent,checkbox:document.querySelector('[data-select="1"]')?.getBoundingClientRect().toJSON()})));
console.log(await page.snapshot());
