import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration.
 *
 * Tests run against a live dev server (Vite) + a running Spring Boot backend.
 * Start both before running:
 *   cd backend && mvn spring-boot:run &
 *   cd frontend && npm run dev &
 *   npx playwright test
 *
 * Or use `webServer` blocks below to let Playwright manage the frontend
 * automatically (backend must still be started manually).
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false, // sequential — tests share DB state
	retries: 0,
	reporter: "html",

	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	/** Automatically start the Vite dev server before the test suite. */
	webServer: {
		command: "npm run dev",
		url: "http://localhost:5173",
		reuseExistingServer: true,
		timeout: 30_000,
	},
});
