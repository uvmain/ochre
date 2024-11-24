export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-11-23',
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    "@nuxtjs/google-fonts",
    "nuxt-auth-utils",
    "@nuxt/ui"
  ],
  devServer: {
    port: 3000,
  },
  googleFonts: {
    families: {
      Montserrat: true,
    }
  }
})