import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: false,
    fixturesFolder: false,
    specPattern: "cypress/e2e/**/*.cy.ts",
    video: false,
    defaultCommandTimeout: 12000,
    requestTimeout: 15000,
  },
})
