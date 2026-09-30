import { test, expect } from '@playwright/test'

const record = {
  id: 1, username: 'mobile_test', real_name: '测试患者', user_name: '测试患者', name: '内科',
  doctor_name: '测试医生', doctor_id: 1, user_id: 1, department_id: 1, department_name: '内科',
  title: '移动端测试标题', chief_complaint: '头痛：持续两天，想咨询医生', status: 0,
  phone: '13800000000', age: 30, gender: 1, record_type: '门诊记录',
  diagnosis: '测试诊断', treatment: '请按医嘱复诊', prescription: '测试处方',
  visit_date: '2026-09-20', time_slot: '上午', remark: '测试预约原因',
  create_time: '2026-09-13T10:00:00', content: '测试正文内容', summary: '测试摘要',
  category: '健康', view_count: 0, description: '科室介绍', doctor_count: 2, sort_order: 0,
  file_name: '测试知识.txt', file_type: 'txt', file_size: 1024, vector_status: 1,
  replies: [{ content: '测试医生的完整回复内容' }],
}

async function setup(page, role = '') {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(role => {
    localStorage.clear()
    if (role) {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('role', role)
      localStorage.setItem('userInfo', JSON.stringify({ username: 'mobile_test', real_name: '测试用户', role }))
    }
  }, role)
  // All API calls are intercepted: these tests never write real medical data.
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api/v1', '')
    let data = [record]
    if (route.request().method() !== 'GET') data = { id: 1 }
    if (path.includes('/admin/list') || ['/users/list', '/doctors/list', '/knowledge/list', '/articles/list'].includes(path)) data = { items: [record], total: 120 }
    if (path === '/profile/info') data = record
    if (/^\/(articles|notices)\/\d+$/.test(path)) data = record
    if (path === '/stat/overview' || path === '/stat/user-overview') data = { user_count: 12, doctor_count: 3, consult_count: 5, appointment_count: 6, record_count: 7, chat_count: 8 }
    else if (path.startsWith('/stat/')) data = [{ date: '09-13', name: '内科', count: 2 }]
    if (path === '/graph/full' || path === '/graph/subgraph') data = { nodes: [{ id: '1', name: '感冒', category: 'Disease' }, { id: '2', name: '头痛', category: 'Symptom' }], edges: [{ source: '1', target: '2', relation: 'HAS_SYMPTOM' }] }
    if (path === '/graph/infer') data = [{ name: '感冒', probability: .8, department: '内科' }]
    if (path.startsWith('/graph/disease/')) data = { name: '感冒', department: '内科', symptoms: ['头痛'], description: '测试疾病详情', treatment: '测试建议' }
    if (path.endsWith('/messages')) data = [{ role: 'user', content: '之前的症状' }, { role: 'assistant', content: '历史健康建议' }]
    if (path === '/chat/send') {
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"type":"session","session_id":2}\n\ndata: {"type":"content","content":"测试流式回复"}\n\ndata: [DONE]\n\n' })
    }
    await route.fulfill({ json: { code: 200, data } })
  })
  return errors
}

async function noOverflow(page) {
  // ECharts autoresize runs through ResizeObserver after the viewport changes.
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), {
    message: `page overflow at ${page.url()}`,
  }).toBeLessThanOrEqual(1)
}

test('home primary actions open consultation and booking', async ({ page }) => {
  await setup(page, 'user')
  await page.goto('/portal/home')
  await page.getByRole('link', { name: '开始 AI 问诊', exact: true }).click()
  await expect(page).toHaveURL('/portal/chat')
  await page.goto('/portal/home')
  await page.getByRole('link', { name: '预约医生', exact: true }).click()
  await expect(page).toHaveURL('/portal/appointment')
})

test('suggested question fills editable chat input without sending', async ({ page }) => {
  await setup(page, 'user')
  let sent = false
  page.on('request', r => { if (r.url().endsWith('/chat/send')) sent = true })
  await page.goto('/portal/chat')
  await page.getByRole('button', { name: '最近总是睡不好' }).click()
  const input = page.getByPlaceholder('请描述您的症状或健康问题...')
  await expect(input).toHaveValue('最近总是睡不好，应该如何改善睡眠？')
  await expect(input).toBeFocused()
  expect(sent).toBe(false)
})

const routes = {
  user: ['/portal/home', '/portal/chat', '/portal/symptom', '/portal/consult', '/portal/appointment', '/portal/records', '/portal/articles', '/portal/articles/1', '/portal/notices/1', '/portal/profile'],
  doctor: ['/doctor/dashboard', '/doctor/consults', '/doctor/appointments', '/doctor/patients', '/doctor/profile'],
  admin: ['/admin/dashboard', '/admin/users', '/admin/doctors', '/admin/departments', '/admin/knowledge', '/admin/graph', '/admin/consults', '/admin/appointments', '/admin/articles', '/admin/notices', '/admin/profile'],
}

for (const role of Object.keys(routes)) {
  test(`${role}: every page fits narrow, regular mobile and desktop viewports`, async ({ page }) => {
    test.setTimeout(90000)
    const errors = await setup(page, role)
    for (const path of routes[role]) {
      await page.goto(path)
      await expect(page.locator('.mobile-header')).toBeVisible()
      await expect(page.locator('.mobile-heading strong')).not.toBeEmpty()
      await expect(page.locator('.el-loading-mask')).toHaveCount(0)
      for (const width of [320, 390, 430, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 844 })
        if (width < 768) await expect(page.locator('.mobile-bottom-nav')).toBeVisible()
        else await expect(page.locator('.mobile-bottom-nav')).toHaveCount(0)
        await noOverflow(page)
        if (width === 1440 && /home|dashboard|chat|\/users$/.test(path)) {
          await page.waitForTimeout(600) // Allow chart and resize animations to settle for visual review.
          await page.screenshot({ path: `test-results/desktop-${role}-${path.split('/').pop()}.png`, fullPage: true, animations: 'disabled' })
        }
      }
      await page.setViewportSize({ width: 390, height: 844 })
    }
    expect(errors).toEqual([])
  })

  test(`${role}: menu exposes every feature and navigation closes the drawer`, async ({ page }) => {
    await setup(page, role)
    await page.goto(routes[role][0])
    await expect(page.locator('.mobile-header')).toBeVisible()
    await expect(page.locator('.el-skeleton')).toHaveCount(0)
    await page.screenshot({ path: `test-results/${role}-mobile.png`, animations: 'disabled' })
    await page.getByRole('button', { name: '打开全部功能' }).click()
    const menu = page.getByRole('navigation', { name: '全部功能' })
    await page.screenshot({ path: `test-results/${role}-menu.png`, animations: 'disabled' })
    for (const path of routes[role].filter(p => !/\/\d+$/.test(p))) await expect(menu.locator(`a[href="${path}"]`)).toBeVisible()
    await menu.getByRole('link', { name: '个人中心' }).click()
    await expect(menu).toBeHidden()
    await expect(page).toHaveURL(/\/profile$/)
  })
}

test('login and registration fit 320px, keep all roles and login form in view', async ({ page }) => {
  await setup(page)
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/login')
  await expect(page.getByRole('button', { name: '立即登录' })).toBeVisible()
  await page.screenshot({ path: 'test-results/desktop-login.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/login')
  for (const name of ['用户', '医生', '管理员']) await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
  expect((await page.getByRole('button', { name: '立即登录' }).boundingBox()).y).toBeLessThan(650)
  await noOverflow(page)
  await page.screenshot({ path: 'test-results/mobile-login.png', fullPage: true, animations: 'disabled' })
  await page.getByRole('link', { name: /免费注册/ }).click()
  await expect(page.getByPlaceholder('确认密码')).toBeVisible()
  await noOverflow(page)
})

test('patient consultation and appointment forms submit existing API payloads on mobile', async ({ page }) => {
  await setup(page, 'user')
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/portal/consult')
  await expect(page.locator('.mobile-record')).toContainText('测试医生的完整回复内容')
  await page.getByRole('button', { name: '发起咨询' }).click()
  await page.getByRole('dialog').locator('.el-select').click()
  await page.getByRole('option').first().click()
  await page.getByPlaceholder('咨询标题').fill('手机咨询')
  await page.getByPlaceholder('请描述您的问题').fill('持续头痛')
  await noOverflow(page)
  const consultation = page.waitForRequest(r => r.url().endsWith('/consult/create'))
  await page.getByRole('button', { name: '提交', exact: true }).click()
  expect((await consultation).postDataJSON()).toEqual({ doctor_id: 1, chief_complaint: '手机咨询：持续头痛' })
  await page.goto('/portal/appointment')
  await page.getByRole('button', { name: '新建预约' }).click()
  const dialog = page.getByRole('dialog')
  const selects = dialog.locator('.el-select')
  await selects.nth(0).click(); await page.getByRole('option', { name: '内科', exact: true }).click()
  await selects.nth(1).click(); await page.getByRole('option', { name: '测试患者', exact: true }).click()
  await dialog.locator('.el-date-editor input').fill('2026-09-20')
  await dialog.locator('.el-date-editor input').press('Enter')
  await selects.nth(2).click(); await page.getByRole('option', { name: '上午', exact: true }).click()
  const appointment = page.waitForRequest(r => r.url().endsWith('/appointments/create'))
  await dialog.getByRole('button', { name: '提交', exact: true }).click()
  expect((await appointment).postDataJSON()).toMatchObject({ department_id: 1, doctor_id: 1, visit_date: '2026-09-20', time_slot: '上午' })
})

test('doctor can reply and confirm appointments from mobile cards', async ({ page }) => {
  await setup(page, 'doctor')
  await page.goto('/doctor/consults')
  await page.locator('.mobile-record').getByRole('button', { name: '回复', exact: true }).click()
  await page.getByPlaceholder('请输入回复内容').fill('请到院进一步检查')
  const reply = page.waitForRequest(r => r.url().endsWith('/consult/reply'))
  await page.getByRole('button', { name: '提交回复' }).click()
  expect((await reply).postDataJSON()).toEqual({ consult_id: 1, content: '请到院进一步检查' })
  await page.goto('/doctor/appointments')
  await page.locator('.mobile-record').getByRole('button', { name: '确认', exact: true }).click()
  const change = page.waitForRequest(r => r.url().includes('/appointments/1/status'))
  await page.getByRole('button', { name: '确定', exact: true }).click()
  expect((await change).url()).toContain('status=1')
})

test('admin editing, search and pagination remain usable at 320px', async ({ page }) => {
  await setup(page, 'admin')
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/admin/users')
  await page.locator('.mobile-record').getByRole('button', { name: '编辑', exact: true }).click()
  await page.getByPlaceholder('请输入用户昵称').fill('手机编辑用户')
  await noOverflow(page)
  const edit = page.waitForRequest(r => r.method() === 'PUT' && r.url().endsWith('/users/1'))
  await page.getByRole('dialog').getByRole('button', { name: '确定', exact: true }).click()
  expect((await edit).postDataJSON().real_name).toBe('手机编辑用户')
  await page.getByPlaceholder('搜索用户名 / 昵称 / 手机号').fill('测试')
  const search = page.waitForRequest(r => r.url().includes('/users/list') && r.url().includes('keyword='))
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  expect(new URL((await search).url()).searchParams.get('keyword')).toBe('测试')
  const next = page.waitForRequest(r => r.url().includes('/users/list') && new URL(r.url()).searchParams.get('page') === '2')
  await page.locator('.btn-next').click()
  await next
})

test('AI history, mobile newline and streamed reply work without layout overflow', async ({ page }) => {
  await setup(page, 'user')
  await page.goto('/portal/chat')
  await page.getByRole('button', { name: '对话历史', exact: true }).click()
  await page.locator('.session-item').first().click()
  await expect(page.locator('.chat-messages')).toContainText('历史健康建议')
  await expect(page.locator('.chat-sidebar')).toBeHidden()
  const input = page.getByPlaceholder('请描述您的症状或健康问题...')
  await input.fill('头痛')
  await input.press('Enter')
  await expect(input).toHaveValue('头痛\n')
  await page.getByRole('button', { name: '发送', exact: true }).click()
  await expect(page.locator('.chat-messages')).toContainText('测试流式回复')
  await noOverflow(page)
  for (const height of [560, 844]) {
    await page.setViewportSize({ width: 390, height })
    await expect(async () => {
      const box = await page.locator('.send-btn').boundingBox()
      expect(box.y + box.height).toBeLessThan(height - 63)
    }).toPass()
  }
  await page.screenshot({ path: 'test-results/mobile-chat.png', fullPage: true })
})

test('symptom reasoning retains details drawer on narrow screens', async ({ page }) => {
  await setup(page, 'user')
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/portal/symptom')
  await page.getByPlaceholder(/输入症状后按回车添加/).fill('右侧太阳穴持续疼痛并伴有恶心和视物模糊')
  await page.getByRole('button', { name: '添加', exact: true }).click()
  await noOverflow(page)
  await page.getByRole('button', { name: '开始推理' }).click()
  await expect(page.locator('.mobile-record')).toContainText('感冒')
  await page.getByRole('button', { name: '详情', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('测试疾病详情')
  await noOverflow(page)
})

test('switching history cannot send into a session whose messages are still loading', async ({ page }) => {
  await setup(page, 'user')
  let release
  const pending = new Promise(resolve => { release = resolve })
  await page.route('**/chat/sessions/1/messages', async route => {
    await pending
    await route.fulfill({ json: { code: 200, data: [{ role: 'assistant', content: '加载后的历史回复' }] } })
  })
  await page.goto('/portal/chat')
  await page.getByPlaceholder('请描述您的症状或健康问题...').fill('准备发送')
  await page.getByRole('button', { name: '对话历史', exact: true }).click()
  await page.locator('.session-item').first().click()
  try {
    await expect(page.getByRole('button', { name: '发送', exact: true })).toBeDisabled()
  } finally { release() }
  await expect(page.locator('.chat-messages')).toContainText('加载后的历史回复')
  await expect(page.getByRole('button', { name: '发送', exact: true })).toBeEnabled()
})

test('mobile navigation starts the destination at the top', async ({ page }) => {
  await setup(page, 'admin')
  await page.setViewportSize({ width: 320, height: 600 })
  await page.goto('/admin/users')
  await expect(page.locator('.mobile-record')).toBeVisible()
  await page.locator('.pagination-wrap').scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
  await page.getByRole('button', { name: '全部', exact: true }).click()
  await page.getByRole('navigation', { name: '全部功能' }).getByRole('link', { name: '医生管理' }).click()
  await expect(page).toHaveURL('/admin/doctors')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
