import { expect, test } from '@playwright/test';

const site = '/site-dist';

test('the demo: editor with a live preview, and the JSON it makes', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(String(error)));
	await page.goto(`${site}/index.html`);
	await expect(page.getByRole('tab', { name: 'Quick settings' })).toBeVisible();
	const canvas = page.frameLocator('iframe').locator('.play-canvas');
	await expect(canvas).toBeAttached();
	await page.getByRole('combobox', { name: 'View' }).selectOption('side');
	await expect(canvas).toHaveAttribute('data-view', 'side');
	await expect(page.locator('#json')).toContainText('"mode": "side"');
	// The page explains the game's script as well as the editor's.
	await expect(page.getByRole('heading', { name: 'Use the game on your own page' })).toBeVisible();
	await expect(page.getByText('data-config-url="/play.json"')).toBeVisible();
	expect(errors).toEqual([]);
});

test('the demo switches to German', async ({ page }) => {
	await page.goto(`${site}/index.html`);
	await page.getByRole('button', { name: 'Deutsch' }).click();
	await expect(page.getByRole('tab', { name: 'Schnell-Einstellungen' })).toBeVisible();
});

test('the guide page lists the settings in both languages', async ({ page }) => {
	await page.goto(`${site}/guide.html`);
	await page.getByLabel('Search the guide').fill('drift');
	await expect(page.getByText('keys.drift').first()).toBeVisible();
	await page.getByRole('button', { name: 'Deutsch' }).click();
	await expect(page.getByLabel('Anleitung durchsuchen')).toBeVisible();
});

test('the game page plays the configuration made in the editor', async ({ page }) => {
	await page.goto(`${site}/index.html`);
	await page.getByRole('combobox', { name: 'View' }).selectOption('side');
	await expect(page.locator('#json')).toContainText('"mode": "side"');
	await page.goto(`${site}/game.html`);
	await expect(page.locator('#state')).toContainText('Using your configuration');
	await page.locator('[data-play-toggle]').click();
	await expect(page.locator('.play-canvas')).toHaveAttribute('data-view', 'side');
});
