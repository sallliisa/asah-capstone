<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import { useColorPreference } from '@/stores/colorpreference'

Chart.register(...registerables)
const props = defineProps<{ configuration: ChartConfiguration<'bar' | 'line' | 'doughnut'>; label: string }>()
const canvas = ref<HTMLCanvasElement>()
const preference = useColorPreference()
let chart: Chart<'bar' | 'line' | 'doughnut'> | undefined
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
function render() {
  chart?.destroy()
  if (!canvas.value) return
  const style = getComputedStyle(document.documentElement)
  const text = `rgb(${style.getPropertyValue('--md-sys-color-on-surface')})`
  const scales = props.configuration.options?.scales
  const themedScales = scales
    ? Object.fromEntries(
        Object.entries(scales).map(([key, scale]) => [
          key,
          {
            ...scale,
            ticks: { ...scale?.ticks, color: text },
            grid: { ...scale?.grid, color: `rgb(${style.getPropertyValue('--md-sys-color-outline-variant')} / 0.5)` },
          },
        ])
      )
    : undefined
  chart = new Chart<'bar' | 'line' | 'doughnut'>(canvas.value, {
    ...props.configuration,
    options: {
      ...props.configuration.options,
      ...(themedScales ? { scales: themedScales } : {}),
      responsive: true,
      maintainAspectRatio: false,
      color: text,
      animation: motion.matches ? false : { duration: 200 },
      plugins: { ...props.configuration.options?.plugins, legend: { labels: { color: text } } },
    },
  })
}
onMounted(() => {
  render()
  motion.addEventListener('change', render)
})
watch([() => props.configuration, () => preference.value], render, { flush: 'post' })
onBeforeUnmount(() => {
  motion.removeEventListener('change', render)
  chart?.destroy()
})
</script>

<template>
  <div class="relative min-h-0 min-w-0 flex-1">
    <canvas ref="canvas" role="img" :aria-label="label">{{ label }}. See chart data below.</canvas>
  </div>
</template>
