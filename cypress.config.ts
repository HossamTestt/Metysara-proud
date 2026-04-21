import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 430, // mobile width similar to the app's max-width
    viewportHeight: 932,
    video: true,
  },
})
