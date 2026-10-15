import { expect, test, type Page } from '@playwright/test';

/** Phones (portrait and landscape) and a small tablet. */
const DEVICES = [
	{ name: 'iPhone SE', width: 320, height: 568 },
	{ name: 'Galaxy S', width: 360, height: 740 },
	{ name: 'iPhone 14', width: 390, height: 844 },
	{ name: 'Pixel 7', width: 412, height: 915 },
	{ name: 'phone, landscape', width: 844, height: 390 },
	{ name: 'small tablet', width: 768, height: 1024 }
] as const;

const sideways = (page: Page) =>
	page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Opens every section, so the widest forms are on screen. */
const openAll = (page: Page) =>
	page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));

for (const device of DEVICES) {
	test.describe(`${device.name} (${device.width} × ${device.height})`, () => {
		test.use({
			viewport: { width: device.width, height: device.height },
			hasTouch: true,
			isMobile: true
		});

		for (const lang of ['English', 'Deutsch']) {
			test(`the editor fits on every tab (${lang})`, async ({ page }) => {
				await page.goto('/site-dist/index.html');
				await page.getByRole('button', { name: lang }).click();
				await expect(sideways(page)).resolves.toBeLessThanOrEqual(1);
				await page.getByRole('button', { name: /Expert|Experte/ }).click();
				for (const name of await page.getByRole('tab').allInnerTexts()) {
					await page.getByRole('tab', { name, exact: true }).click();
					await openAll(page);
					expect(await sideways(page), `${lang}: tab ${name}`).toBeLessThanOrEqual(1);
					// The editor itself must not be wider than its box either (it could hide it).
					const inner = await page.evaluate(() => {
						const root = document.querySelector<HTMLElement>('#editor > div');
						return root ? root.scrollWidth - root.clientWidth : 0;
					});
					expect(inner, `${lang}: tab ${name}, editor`).toBeLessThanOrEqual(1);
				}
			});
		}

		test('guide, game page and the smallest example fit', async ({ page }) => {
			await page.goto('/site-dist/guide.html');
			await page.getByRole('button', { name: 'Deutsch' }).click();
			await openAll(page);
			expect(await sideways(page), 'guide').toBeLessThanOrEqual(1);
			await page.goto('/site-dist/game.html');
			expect(await sideways(page), 'game').toBeLessThanOrEqual(1);
			await page.goto('/examples/editor/index.html');
			await page.getByRole('button', { name: 'Expert' }).click();
			await openAll(page);
			expect(await sideways(page), 'example').toBeLessThanOrEqual(1);
		});

		test('the preview goes full screen and back', async ({ page }) => {
			await page.goto('/site-dist/index.html');
			const frame = page.locator('iframe');
			await page.getByRole('button', { name: /Full screen/ }).click();
			await expect
				.poll(async () => (await frame.boundingBox())?.width ?? 0)
				.toBeGreaterThan(device.width - 40);
			expect(await sideways(page)).toBeLessThanOrEqual(1);
			await page.getByRole('button', { name: /Exit full screen/ }).click();
			await expect
				.poll(async () => (await frame.boundingBox())?.width ?? 0)
				.toBeLessThanOrEqual(device.width);
		});

		test('controls can be used by touch: buttons and fields are big enough and in reach', async ({
			page
		}) => {
			await page.goto('/site-dist/index.html');
			const small = await page.evaluate(() =>
				[
					...document.querySelectorAll<HTMLElement>(
						'#editor button, #editor input[type=text], #editor select'
					)
				]
					.filter((el) => el.offsetParent !== null)
					.map((el) => ({
						text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
						h: el.getBoundingClientRect().height,
						w: el.getBoundingClientRect().width
					}))
					// WCAG 2.2 AA: at least 24 × 24 px.
					.filter((el) => el.h < 24 || el.w < 24)
			);
			expect(small).toEqual([]);
		});
	});
}

test.describe('a setting reads label above control on a phone', () => {
	test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

	test('not squeezed side by side', async ({ page }) => {
		await page.goto('/site-dist/index.html');
		await page.getByRole('button', { name: 'Expert' }).click();
		await page.getByRole('tab', { name: 'Game', exact: true }).click();
		await openAll(page);
		const label = page.locator('[data-pe-path="game.lives"] label');
		const input = page.locator('[data-pe-path="game.lives"] input');
		const [l, i] = await Promise.all([label.boundingBox(), input.boundingBox()]);
		expect(i?.y ?? 0).toBeGreaterThan((l?.y ?? 0) + (l?.height ?? 0) - 1);
		expect(i?.width ?? 0).toBeGreaterThan(60);
	});
});
