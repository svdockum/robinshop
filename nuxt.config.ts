import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase'],
  css: ['~/assets/css/main.css', '~/assets/css/motion.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'nl' },
      title: 'Robin',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#faf5df' },
        { name: 'description', content: 'Robin — de super fijne markt. Scan je boodschappen met eetpunten.' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preload', href: '/fonts/Lektorat-NarrowBold.ttf', as: 'font', type: 'font/ttf', crossorigin: '' },
        { rel: 'preload', href: '/fonts/WorkSans-Variable.ttf', as: 'font', type: 'font/ttf', crossorigin: '' },
      ],
    },
  },
  runtimeConfig: {
    // Geheim voor de wisselende QR-codes bij ingang en kassa (env: NUXT_QR_SECRET)
    qrSecret: '',
    // Leeg = /robinadmin staat open. Ingevuld = wachtwoord nodig (env: NUXT_ADMIN_PASSWORD)
    adminPassword: '',
    public: {
      // Publieke URL voor geprinte QR-codes, bijv. https://robinshop.vercel.app (env: NUXT_PUBLIC_SITE_URL)
      siteUrl: '',
    },
  },
  routeRules: {
    // Beheer: alleen in de browser renderen en niet laten indexeren.
    '/robinadmin/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/robinadmin': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/display/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
  supabase: {
    types: '~/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/pas/*', '/display/*', '/robinadmin*'],
      saveRedirectToCookie: true,
    },
    // Leden blijven op hun telefoon ingelogd (60 dagen)
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 60,
      sameSite: 'lax',
      secure: true,
    },
  },
})
