import { ref, onMounted, onUnmounted } from 'vue'

/** Keep component rendering and the CSS breakpoint in sync, including rotation. */
export function useMobile() {
  const media = typeof window === 'undefined' ? null : window.matchMedia('(max-width: 767px)')
  const isMobile = ref(media?.matches ?? false)
  const update = () => { isMobile.value = media.matches }
  onMounted(() => media?.addEventListener('change', update))
  onUnmounted(() => media?.removeEventListener('change', update))
  return isMobile
}
