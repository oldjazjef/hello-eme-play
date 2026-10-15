// Takes the screenshots of the README: npm run build && node scripts/screenshots.mjs
// Needs chromium for Playwright (CHROME_PATH overrides where it is). Pictures go to docs/images.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = 4179;
const page_url = `http://localhost:${port}/examples/static/index.html`;
const server = spawn('node', ['examples/static/serve.mjs'], {
	cwd: root,
	env: { ...process.env, PORT: String(port) },
	stdio: 'ignore'
});
const out = (name) => `${root}docs/images/${name}.png`;

async function start(page) {
	await page.goto(page_url);
	await page.locator('[data-play-toggle]').click();
	await page.waitForFunction(
		() => document.querySelector('.play-canvas')?.dataset.state === 'playing'
	);
	await page.evaluate(() => {
		const world = window.Play.world;
		world.config.visits.enabled = false;
	});
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
try {
	const desktop = await browser.newContext({ viewport: { width: 1000, height: 640 } });
	const page = await desktop.newPage();

	await start(page);
	await page.evaluate(() => {
		const { world } = window.Play;
		world.spawnAt('blob', 3, 'near');
	});
	await page.keyboard.down('Space');
	await page.waitForTimeout(900);
	await page.keyboard.up('Space');
	await page.screenshot({ path: out('topdown') });

	await page.evaluate(() => window.Play.world.setView('side'));
	await page.keyboard.down('ArrowRight');
	await page.waitForTimeout(500);
	await page.keyboard.up('ArrowRight');
	await page.evaluate(() => window.Play.world.spawnAt('blob', 2, 'near'));
	await page.waitForTimeout(800);
	await page.screenshot({ path: out('side-scroller') });

	const phone = await browser.newContext({
		viewport: { width: 390, height: 760 },
		hasTouch: true,
		isMobile: true
	});
	const mobile = await phone.newPage();
	await start(mobile);
	await mobile.evaluate(() => window.Play.world.spawnAt('blob', 2, 'near'));
	await mobile.waitForTimeout(700);
	await mobile.screenshot({ path: out('touch') });
} finally {
	await browser.close();
	server.kill();
}
