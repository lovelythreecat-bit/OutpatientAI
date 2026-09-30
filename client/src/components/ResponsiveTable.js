import { defineComponent, h, Fragment } from 'vue'
import { ElTable } from 'element-plus'
import { useMobile } from '../composables/useMobile.js'

function getColumns(nodes) {
  return nodes.flatMap(node => {
    if (node.type === Fragment) return getColumns(node.children || [])
    return node.type?.name === 'ElTableColumn' ? [node] : []
  })
}

/** One column definition for desktop tables and touch-friendly mobile cards.
 * Column slots stay in their original scope, so all business actions are shared.
 */
export default defineComponent({
  name: 'ResponsiveTable',
  inheritAttrs: false,
  props: { data: { type: Array, default: () => [] } },
  setup(props, { slots, attrs }) {
    const isMobile = useMobile()
    return () => {
      if (!isMobile.value) return h(ElTable, { ...attrs, data: props.data }, slots)
      const columns = getColumns(slots.default?.() || [])
      return h('div', { class: ['mobile-records', attrs.class], style: attrs.style },
        props.data.length ? props.data.map((row, index) => h('article', {
          class: 'mobile-record', key: row.id ?? index,
        }, [h('dl', columns.map((column, columnIndex) => {
          const field = column.props || {}
          const scope = { row, $index: index, column: field }
          const value = field.prop?.split('.').reduce((current, part) => current?.[part], row)
          const content = column.children?.default
            ? column.children.default(scope)
            : String(value ?? '—')
          return h('div', {
            class: ['mobile-record-field', { 'mobile-record-actions': field.label === '操作' }],
            key: `${field.prop || field.label}-${columnIndex}`,
          }, [h('dt', field.label || ''), h('dd', content)])
        }))])) : h('div', { class: 'mobile-record-empty', role: 'status' }, slots.empty?.() || '暂无数据'),
      )
    }
  },
})
