<script setup lang="ts">
const props = defineProps<{
  categories: { id: string, name: string, color: string, spent_month: number }[]
  /** Schaal: punten die een volle balk voorstellen. */
  scale: number
}>()

const rows = computed(() => {
  const max = Math.max(props.scale, ...props.categories.map(c => c.spent_month), 1)
  return props.categories.map(c => ({ ...c, width: Math.max(c.spent_month > 0 ? 4 : 0, Math.round((c.spent_month / max) * 100)) }))
})
</script>

<template>
  <ul class="space-y-3">
    <li v-for="(c, i) in rows" :key="c.id" class="grid grid-cols-[10rem_1fr_3rem] items-center gap-3">
      <span class="truncate text-base">{{ c.name }}</span>
      <span class="h-3 overflow-hidden rounded-full bg-zand-donker/60" role="presentation">
        <span class="anim-grow-x block h-full rounded-full" :style="{ width: `${c.width}%`, backgroundColor: c.color, animationDelay: `${250 + i * 80}ms` }" />
      </span>
      <span class="text-right font-display text-2xl"><AnimatedNumber :value="c.spent_month" :from="0" :delay="250 + i * 80" /></span>
    </li>
  </ul>
</template>
