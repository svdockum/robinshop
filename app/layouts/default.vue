<template>
  <div class="mx-auto min-h-dvh max-w-lg pb-28">
    <header class="flex items-center justify-between px-5 pt-5 pb-2" style="padding-top: max(1.25rem, env(safe-area-inset-top))">
      <NuxtLink to="/" aria-label="Naar home">
        <RobinLogo class="h-9 w-auto" />
      </NuxtLink>
      <slot name="header-right" />
    </header>
    <main class="px-5">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>
