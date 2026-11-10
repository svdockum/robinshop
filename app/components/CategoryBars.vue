<script setup lang="ts">
import { categoryIcons } from '~/utils/categoryIcon'
import { pointsLabel } from '~/utils/format'

const props = defineProps<{
  categories: { id: string, name: string, color: string, spent_month: number }[]
  /** Schaal: punten die een volle balk voorstellen. */
  scale: number
}>()

const rows = computed(() => {
  const max = Math.max(props.scale, ...props.categories.map(c => c.spent_month), 1)
  return props.categories.map(c => ({
    ...c,
    icons: categoryIcons(c.name),
    width: Math.max(c.spent_month > 0 ? 4 : 0, Math.round((c.spent_month / max) * 100)),
  }))
})
</script>

<template>
  <ul class="space-y-3">
    <li v-for="(c, i) in rows" :key="c.id" class="grid grid-cols-[4.75rem_1fr_3rem] items-center gap-3">
      <!-- Beeld in plaats van de naam; tik voor de naam -->
      <InfoTip
        :text="`${c.name}: ${pointsLabel(c.spent_month)} deze maand`"
        class="h-12 w-full gap-1 rounded-2xl text-beige"
        :style="{ backgroundColor: c.color }"
      >
        <RIcon v-for="icon in c.icons" :key="icon" :name="icon" class="h-7 w-7" />
      </InfoTip>
      <span class="h-3 overflow-hidden rounded-full bg-zand-donker/60" role="presentation">
        <span class="anim-grow-x block h-full rounded-full" :style="{ width: `${c.width}%`, backgroundColor: c.color, animationDelay: `${250 + i * 80}ms` }" />
      </span>
      <span class="text-right font-display text-2xl" aria-hidden="true"><AnimatedNumber :value="c.spent_month" :from="0" :delay="250 + i * 80" /></span>
    </li>
  </ul>
</template>
