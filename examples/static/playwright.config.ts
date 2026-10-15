import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	// Players move with the real clock: keep tests independent and not too parallel.
	workers: 2,
	use: {
		baseURL: 'http://localhost:4173',
		viewport: { width: 1000, height: 700 },
		// Motion off: shards and bobbing are not under test (and axe-like tools see everything).
		contextOptions: { reducedMotion: 'reduce' }
	},
	webServer: {
		command: 'node serve.mjs',
		url: 'http://localhost:4173/examples/static/index.html',
		reuseExistingServer: !process.env.CI
	}
});
