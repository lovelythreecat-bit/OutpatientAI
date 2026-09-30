import test from 'node:test'
import assert from 'node:assert/strict'
import { createRenderer, h, Fragment, nextTick } from 'vue'
import ResponsiveTable from '../src/components/ResponsiveTable.js'

// A tiny host renderer runs the real component and slot handlers without a browser.
function mountTable(data, columns) {
  globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) }
  const node = (type, text = '') => ({ type, text, children: [], props: {}, parent: null })
  const renderer = createRenderer({
    createElement: (type) => node(type), createText: (text) => node('#text', text),
    createComment: (text) => node('#comment', text),
    setText: (el, text) => { el.text = text },
    setElementText: (el, text) => { el.text = text; el.children = [] },
    patchProp: (el, key, prev, value) => { el.props[key] = value },
    insert(el, parent, anchor = null) { el.parent = parent; const i = parent.children.indexOf(anchor); parent.children.splice(i < 0 ? parent.children.length : i, 0, el) },
    remove(el) { const list = el.parent?.children; if (list) list.splice(list.indexOf(el), 1) },
    parentNode: (el) => el.parent, nextSibling: () => null,
  })
  const root = node('root')
  const app = renderer.createApp({ render: () => h(ResponsiveTable, { data }, { default: () => columns }) })
  app.mount(root)
  return { root, unmount: () => { app.unmount(); delete globalThis.window } }
}
function flatten(node) { return [node, ...node.children.flatMap(flatten)] }
const Column = { name: 'ElTableColumn' }

test('mobile cards retain complete field values including zero and escape plain text', () => {
  const view = mountTable([{ id: 4, name: '<script>long patient content</script>', count: 0 }], [
    h(Column, { label: '患者', prop: 'name' }), h(Column, { label: '次数', prop: 'count' }),
  ])
  const nodes = flatten(view.root)
  assert.equal(nodes.filter(n => n.type === 'article').length, 1)
  assert.ok(nodes.some(n => n.text === '<script>long patient content</script>'))
  assert.ok(nodes.some(n => n.text === '0'))
  assert.ok(nodes.some(n => n.text === '患者'))
  assert.ok(nodes.every(n => n.type !== 'script'))
  view.unmount()
})

test('mobile action slots receive the correct row and index, including fragmented columns', async () => {
  let selected
  const view = mountTable([{ id: 7 }, { id: 9 }], [h(Fragment, null, [
    h(Column, { label: '操作' }, { default: ({ row, $index }) => h('button', { onClick: () => { selected = [row.id, $index] } }, '编辑') }),
  ])])
  const buttons = flatten(view.root).filter(n => n.type === 'button')
  assert.equal(buttons.length, 2)
  buttons[1].props.onClick()
  await nextTick()
  assert.deepEqual(selected, [9, 1])
  view.unmount()
})

test('empty mobile list exposes an empty state and no stale cards', () => {
  const view = mountTable([], [h(Column, { label: '患者', prop: 'name' })])
  const nodes = flatten(view.root)
  assert.equal(nodes.filter(n => n.type === 'article').length, 0)
  assert.ok(nodes.some(n => n.props.role === 'status'))
  view.unmount()
})
