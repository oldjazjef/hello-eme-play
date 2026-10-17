import { expect, test, type Page } from '@playwright/test';
import type { Play } from '@hello-eme/play';

declare global {
	interface Window {
		Play?: Play;
	}
}

/** The schema package is ESM only: read it with a real dynamic import. */
async function presets() {
	return (await import('@hello-eme/play-schema')).PRESETS;
}

const retro = [
	'retro-asteroids',
	'retro-frogger',
	'retro-snake',
	'retro-munch',
	'retro-bricks',
	'retro-ping',
	'retro-jumper',
	'retro-titan'
];

async function start(page: Page, id: string): Promise<void> {
	const preset = (await presets())[id];
	if (!preset) throw new Error(`no preset ${id}`);
	await page.goto('/examples/static/index.html');
	await page.evaluate((config) => window.Play?.configure(config), preset.config);
	await page.locator('[data-play-toggle]').click();
	await expect
		.poll(() =>
			page.evaluate(() => document.querySelector<HTMLElement>('.play-canvas')?.dataset.state)
		)
		.toBe('playing');
}

const world = <T>(page: Page, read: (world: NonNullable<Window['Play']>['world']) => T) =>
	page.evaluate(`(${read.toString()})(window.Play.world)`) as Promise<T>;

for (const id of retro) {
	test(`${id} starts, runs without errors and leaves with Esc`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(String(error)));
		await start(page, id);
		await page.waitForTimeout(1200);
		expect(await world(page, (w) => w?.phase)).toBe('playing');
		await page.keyboard.press('Escape');
		await expect(page.locator('.play-canvas')).toHaveCount(0);
		expect(errors).toEqual([]);
	});
}

test('an arena that is the window keeps the page still, and lets go afterwards', async ({
	page
}) => {
	await start(page, 'retro-bricks');
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow))
		.toBe('hidden');
	await page.keyboard.press('Escape');
	await expect
		.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow))
		.not.toBe('hidden');
});

test('the spaceship turns, pushes and keeps drifting', async ({ page }) => {
	await start(page, 'retro-asteroids');
	const angle = await world(page, (w) => w?.player.angle ?? 0);
	await page.keyboard.down('ArrowRight');
	await page.waitForTimeout(400);
	await page.keyboard.up('ArrowRight');
	expect(await world(page, (w) => w?.player.angle ?? 0)).toBeGreaterThan(angle + 0.5);
	await page.keyboard.down('ArrowUp');
	await page.waitForTimeout(300);
	await page.keyboard.up('ArrowUp');
	const speed = await world(page, (w) => Math.hypot(w?.player.vx ?? 0, w?.player.vy ?? 0));
	expect(speed).toBeGreaterThan(50);
	await page.waitForTimeout(300);
	expect(
		await world(page, (w) => Math.hypot(w?.player.vx ?? 0, w?.player.vy ?? 0))
	).toBeGreaterThan(speed * 0.7);
});

test('holding the fire key keeps shooting', async ({ page }) => {
	await start(page, 'retro-asteroids');
	await page.keyboard.down('Space');
	await page.waitForTimeout(1000);
	await page.keyboard.up('Space');
	expect(await world(page, (w) => w?.stats.thrown ?? 0)).toBeGreaterThan(2);
});

test('the paddle slides along the bottom and the ball is in play', async ({ page }) => {
	await start(page, 'retro-bricks');
	const before = await world(page, (w) => ({ x: w?.player.x ?? 0, y: w?.player.y ?? 0 }));
	await page.keyboard.down('ArrowRight');
	await page.waitForTimeout(300);
	await page.keyboard.up('ArrowRight');
	const after = await world(page, (w) => ({ x: w?.player.x ?? 0, y: w?.player.y ?? 0 }));
	expect(after.x).toBeGreaterThan(before.x + 50);
	expect(after.y).toBeCloseTo(before.y, 0);
	expect(await world(page, (w) => w?.bodies.some((body) => body.def === 'ball'))).toBe(true);
});

test('the muncher keeps moving by itself once you steer it', async ({ page }) => {
	await start(page, 'retro-munch');
	await page.keyboard.down('ArrowLeft');
	await page.waitForTimeout(150);
	await page.keyboard.up('ArrowLeft');
	const x = await world(page, (w) => w?.player.x ?? 0);
	await page.waitForTimeout(500);
	expect(await world(page, (w) => w?.player.x ?? 0)).toBeLessThan(x - 20);
});

test('the jumper stands on a platform and jumps twice', async ({ page }) => {
	await start(page, 'retro-jumper');
	await expect.poll(() => world(page, (w) => w?.player.grounded)).toBe(true);
	await page.keyboard.press('Space');
	await page.waitForTimeout(150);
	const first = await world(page, (w) => w?.player.y ?? 0);
	await page.keyboard.press('Space');
	await page.waitForTimeout(250);
	expect(await world(page, (w) => w?.player.y ?? 0)).toBeLessThan(first - 20);
});
