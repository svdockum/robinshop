<template>
  <div class="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-10" style="padding-top: max(1.25rem, env(safe-area-inset-top))">
    <header class="pb-4">
      <NuxtLink to="/" aria-label="Naar home">
        <RobinLogo class="h-9 w-auto" />
      </NuxtLink>
    </header>
    <main class="flex flex-1 flex-col">
      <slot />
    </main>
  </div>
</template>
