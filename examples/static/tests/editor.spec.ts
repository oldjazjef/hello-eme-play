import { expect, test, type Page } from '@playwright/test';

const url = '/examples/editor/index.html';
const json = async (page: Page): Promise<Record<string, unknown>> =>
	JSON.parse((await page.locator('#json').textContent()) ?? '{}');

test('edits the configuration without a CMS: quick setting, undo, redo', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	await page.goto(url);
	await expect(page.getByRole('tab', { name: 'Quick settings' })).toBeVisible();

	const lives = page.getByRole('spinbutton', { name: 'Lives' });
	await lives.fill('4');
	await expect.poll(async () => (await json(page)).game).toMatchObject({ lives: 4 });
	// The preset list does not fold itself away on the first edit.
	await expect(page.getByRole('button', { name: 'Use this preset' }).first()).toBeVisible();

	await page.getByRole('button', { name: /Undo/ }).click();
	await expect.poll(async () => json(page)).toEqual({});
	await page.getByRole('button', { name: /Redo/ }).click();
	await expect.poll(async () => (await json(page)).game).toMatchObject({ lives: 4 });
	expect(errors).toEqual([]);
});

test('shows the balance check and the presets', async ({ page }) => {
	await page.goto(url);
	await expect(page.getByText(/A practice bot played 10 rounds/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Use this preset' }).first()).toBeVisible();
});

test('expert mode: a dropped picture becomes a sprite, a problem links to its field', async ({
	page
}) => {
	await page.goto(url);
	await page.getByRole('button', { name: 'Expert' }).click();
	await page.getByRole('tab', { name: 'Characters' }).click();
	await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
		name: 'Hero Walk.svg',
		mimeType: 'image/svg+xml',
		buffer: Buffer.from(
			'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="32"><rect width="128" height="32"/></svg>'
		)
	});
	await expect
		.poll(async () => (await json(page)).sprites)
		.toMatchObject({ 'hero-walk': { size: 32, columns: 4 } });

	// A reference to something that does not exist: the list links to the field.
	await page.getByRole('tab', { name: 'Raw JSON' }).click();
	await page.getByLabel('Raw JSON').fill('{"spawns":[{"entity":"nobody"}]}');
	await page.getByLabel('Raw JSON').blur();
	await page.getByRole('button', { name: 'Go to field' }).click();
	await expect(page.getByRole('tab', { name: 'Characters', selected: true })).toBeVisible();
});

test('the guide lists every setting and filters', async ({ page }) => {
	await page.goto(url);
	await page.getByRole('tab', { name: 'Guide' }).click();
	await page.getByLabel('Search the guide').fill('drift');
	await expect(page.getByText('keys.drift').first()).toBeVisible();
	await page.getByLabel('Search the guide').fill('zzzz-no-such-setting');
	await expect(page.getByText('Nothing matches.')).toBeVisible();
});

test('the preview page plays inside the editor', async ({ page }) => {
	await page.goto(url);
	const frame = page.frameLocator('iframe');
	await expect(frame.locator('h1')).toHaveText('Preview');
	await expect
		.poll(
			() =>
				page
					.frames()
					.find((f) => f.url().includes('preview.html'))
					?.evaluate(() => typeof window.Play) ?? ''
		)
		.toBe('object');
});
