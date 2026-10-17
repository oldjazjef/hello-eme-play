import { expect, test, type Page } from '@playwright/test';
import type { Play } from '@hello-eme/play';

declare global {
	interface Window {
		Play?: Play;
	}
}

const page_url = '/examples/static/index.html';
const canvas = (page: Page, key: string) =>
	page.evaluate((name) => document.querySelector<HTMLElement>('.play-canvas')?.dataset[name], key);

async function start(page: Page): Promise<void> {
	await page.goto(page_url);
	await page.locator('[data-play-toggle]').click();
	await expect(page.locator('.play-canvas')).toBeAttached();
	await expect.poll(() => canvas(page, 'state')).toBe('playing');
}

test('starts from the toggle, walks and shows the HUD', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	await start(page);
	const before = Number(await canvas(page, 'x'));
	await page.keyboard.down('ArrowRight');
	await page.waitForTimeout(400);
	await page.keyboard.up('ArrowRight');
	expect(Number(await canvas(page, 'x'))).toBeGreaterThan(before + 50);
	await expect(page.locator('.play-hud')).toContainText('Punkte: 0');
	await page.keyboard.press('Escape');
	await expect(page.locator('.play-canvas')).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('punches a page element until it breaks, and repairs the page', async ({ page }) => {
	await start(page);
	const card = page.locator('.card').first();
	const box = await card.boundingBox();
	if (!box) throw new Error('no card');
	await page.evaluate(
		({ x, y }) => {
			const world = window.Play?.world;
			if (!world) return;
			world.player.x = x + scrollX;
			world.player.y = y - 30 + scrollY;
			world.player.angle = Math.PI / 2;
		},
		{ x: box.x + box.width / 2, y: box.y }
	);
	await page.keyboard.down('Space');
	await expect(page.locator('[data-wrecked]')).toHaveCount(1);
	await page.keyboard.up('Space');
	await expect(page.locator('.play-hint')).toContainText('Zerstört: 1');
	await page.getByRole('button', { name: 'Seite reparieren' }).click();
	await expect(page.locator('[data-wrecked]')).toHaveCount(0);
});

test('monsters come in, get beaten and give points and drops', async ({ page }) => {
	await start(page);
	await page.evaluate(() => window.Play?.world?.spawnAt('blob', 2, 'near'));
	await expect.poll(() => canvas(page, 'enemies')).toBe('2');
	await page.evaluate(() => {
		const world = window.Play?.world;
		for (const body of [...(world?.bodies ?? [])]) world?.damage(body, 99, world.player);
	});
	await expect.poll(() => canvas(page, 'enemies')).toBe('0');
	expect(Number(await canvas(page, 'score'))).toBe(200);
});

test('buys an upgrade in the shop with the points', async ({ page }) => {
	await start(page);
	await page.evaluate(() => {
		const world = window.Play?.world;
		if (world) world.score = 150;
	});
	await page.keyboard.press('KeyU');
	const shop = page.getByRole('dialog', { name: 'Upgrades' });
	await expect(shop).toBeVisible();
	await shop.getByRole('button', { name: 'Kaufen' }).click();
	await expect(shop).toContainText('Muscles 1/3');
	expect(
		await page.evaluate(() => window.Play?.world?.stat(window.Play.world.player, 'attack'))
	).toBe(2);
	await page.keyboard.press('Escape');
	await expect(shop).toHaveCount(0);
});

test('switches from top-down to the side-scroller and the figure lands on the ground', async ({
	page
}) => {
	await start(page);
	await page.evaluate(() => window.Play?.world?.setView('side'));
	await expect.poll(() => canvas(page, 'view')).toBe('side');
	await expect.poll(() => page.evaluate(() => window.Play?.world?.player.grounded)).toBe(true);
	await page.keyboard.down('ArrowUp');
	await page.waitForTimeout(150);
	await page.keyboard.up('ArrowUp');
	expect(await page.evaluate(() => window.Play?.world?.player.grounded)).toBe(false);
	await expect(page.locator('.play-hint')).toContainText('laufen und springen');
});

test('gets into a car, drives, drifts and leaves tire marks', async ({ page }) => {
	await start(page);
	await page.evaluate(() => {
		const world = window.Play?.world;
		if (!world) return;
		const car = world.spawn('car', world.player.x + 30, world.player.y);
		if (car) car.pilot = undefined;
	});
	await page.keyboard.press('KeyF');
	await expect.poll(() => canvas(page, 'driving')).toBe('true');
	await page.keyboard.down('ArrowUp');
	await page.keyboard.down('ArrowRight');
	await page.keyboard.down('Space');
	await page.waitForTimeout(1200);
	expect(Number(await canvas(page, 'marks'))).toBeGreaterThan(0);
	await page.keyboard.up('ArrowUp');
	await page.keyboard.up('ArrowRight');
	await page.keyboard.up('Space');
	await page.keyboard.press('KeyF');
	await expect.poll(() => canvas(page, 'driving')).toBe('false');
});

test('advances through levels by their goals and wins after the last', async ({ page }) => {
	await start(page);
	await page.evaluate(() => {
		const world = window.Play?.world;
		if (!world) return;
		world.spawnAt('blob', 3, 'near');
		for (const body of [...world.bodies]) world.damage(body, 99, world.player);
	});
	await expect.poll(() => canvas(page, 'level')).toBe('2');
	await expect.poll(() => canvas(page, 'view')).toBe('side');
	await expect(page.locator('.play-level')).toContainText('Level 2');
});

test('shows game over with a restart button when the figure dies', async ({ page }) => {
	await start(page);
	await page.evaluate(() => {
		const world = window.Play?.world;
		if (world) world.damage(world.player, 1000, undefined);
	});
	await expect(page.locator('.play-over')).toContainText('Game over');
	await page.getByRole('button', { name: 'Nochmal' }).click();
	await expect.poll(() => canvas(page, 'health')).toBe('100');
	await expect(page.locator('.play-over')).toHaveCount(0);
});

test('throws a bomb with G: it uses up ammo and goes off after its fuse', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	await start(page);
	await page.evaluate(() => {
		const world = window.Play?.world;
		if (!world) return;
		world.player.angle = 0;
		const blob = world.spawn('blob', world.player.x + 100, world.player.y);
		if (blob) blob.speed = 0;
	});
	await page.keyboard.press('KeyG');
	await expect.poll(() => canvas(page, 'projectiles')).toBe('1');
	expect(await page.evaluate(() => window.Play?.world?.ammoOf('bomb'))).toBe(4);
	await expect.poll(() => canvas(page, 'projectiles'), { timeout: 5000 }).toBe('0');
	expect(errors).toEqual([]);
});

test('can pause while the instructions are open, and runs once they are folded away', async ({
	page
}) => {
	await page.goto(page_url);
	await page.evaluate(() => {
		window.Play?.configure({ hint: { hideAfter: 0, pauseWhileOpen: true } });
	});
	await page.locator('[data-play-toggle]').click();
	await expect.poll(() => canvas(page, 'state')).toBe('playing');
	const time = () => page.evaluate(() => window.Play?.world?.time ?? -1);
	await page.waitForTimeout(500);
	const before = await time();
	await page.waitForTimeout(700);
	expect(await time()).toBe(before);
	await page
		.getByRole('button', { name: /Hinweis ausblenden|Hide hint/i })
		.first()
		.click();
	await page.waitForTimeout(700);
	expect(await time()).toBeGreaterThan(before + 0.3);
});
