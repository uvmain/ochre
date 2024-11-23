export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-11-23',
  devtools: { enabled: true },
  modules: [
    "@unocss/nuxt",
    '@nuxt/eslint',
    "@nuxtjs/google-fonts",
    "nuxt-auth-utils",
    "@nuxt/icon"
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