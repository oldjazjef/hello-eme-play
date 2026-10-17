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
	await expect(page.getByRole('button', { name: 'Try it' }).first()).toBeVisible();

	await page.getByRole('button', { name: /Undo/ }).click();
	await expect.poll(async () => json(page)).toEqual({});
	await page.getByRole('button', { name: /Redo/ }).click();
	await expect.poll(async () => (await json(page)).game).toMatchObject({ lives: 4 });
	expect(errors).toEqual([]);
});

test('shows the balance check and the presets', async ({ page }) => {
	await page.goto(url);
	await expect(page.getByText(/A practice bot played 10 rounds/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Try it' }).first()).toBeVisible();
});

test('trying a preset shows it in the preview and offers to use it', async ({ page }) => {
	await page.goto(url);
	await page.getByRole('button', { name: 'Try it' }).nth(1).click();
	await expect(page.getByText(/Trying “Arcade with upgrades” in the preview/)).toBeVisible();
	// The configuration is not changed until "Use this preset".
	await expect.poll(async () => json(page)).toEqual({});
	await page.getByRole('button', { name: 'Use this preset' }).click();
	await expect.poll(async () => Object.keys(await json(page)).length).toBeGreaterThan(0);
});

test('using a preset works where dialogs are blocked, and undo brings the settings back', async ({
	page
}) => {
	// Embedded pages often cannot show confirm(); it answers "no" at once.
	page.on('dialog', (dialog) => void dialog.dismiss());
	await page.goto(url);
	await page.getByRole('spinbutton', { name: 'Lives' }).fill('4');
	await expect.poll(async () => (await json(page)).game).toMatchObject({ lives: 4 });
	await page.getByRole('button', { name: 'Try it' }).nth(1).click();
	await page.getByRole('button', { name: 'Use this preset' }).click();
	await expect(page.getByText(/Preset applied/)).toBeVisible();
	await expect
		.poll(async () => ((await json(page)).game as { lives?: number } | undefined)?.lives)
		.not.toBe(4);
	await page.getByRole('button', { name: /Undo/ }).click();
	await expect.poll(async () => (await json(page)).game).toMatchObject({ lives: 4 });
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

test('the built-in preview plays every change', async ({ page }) => {
	await page.goto(url);
	const canvas = page.frameLocator('iframe').locator('.play-canvas');
	await expect(canvas).toBeAttached();
	await expect(canvas).toHaveAttribute('data-view', 'topdown');
	await page.getByRole('combobox', { name: 'View' }).selectOption('side');
	await expect(canvas).toHaveAttribute('data-view', 'side');
});

test('the live preview can be shown full screen and back', async ({ page }) => {
	await page.goto(url);
	const frame = page.locator('iframe');
	await expect(frame).toBeVisible();
	const small = await frame.boundingBox();
	const viewport = page.viewportSize();
	await page.getByRole('button', { name: /Full screen/ }).click();
	await expect
		.poll(async () => (await frame.boundingBox())?.width ?? 0)
		.toBeGreaterThan((viewport?.width ?? 0) - 40);
	expect((await frame.boundingBox())?.height ?? 0).toBeGreaterThan((viewport?.height ?? 0) - 120);
	// Still the same running game, not a fresh frame.
	await expect(page.frameLocator('iframe').locator('.play-canvas')).toBeAttached();
	await page.getByRole('button', { name: /Exit full screen/ }).click();
	await expect
		.poll(async () => (await frame.boundingBox())?.height ?? 0)
		.toBeLessThanOrEqual((small?.height ?? 0) + 2);
});

test('loads a complete example game in the preview, with its pictures', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	await page.goto(url);
	const card = page.locator('li, div').filter({ hasText: 'Ememons (catch monsters)' }).last();
	await card.getByRole('button', { name: 'Try it' }).click();
	await expect(page.getByText(/Trying “Ememons \(catch monsters\)” in the preview/)).toBeVisible();
	await page.getByRole('button', { name: 'Use this preset' }).click();
	await expect.poll(async () => Object.keys((await json(page)).hideouts ?? {}).length).toBe(4);
	expect(errors).toEqual([]);
});
