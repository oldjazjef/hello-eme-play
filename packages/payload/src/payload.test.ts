import type { Config } from 'payload';
import { describe, expect, it } from 'vitest';
import { playGlobal, playPlugin, validateConfig } from './index.js';

describe('playPlugin', () => {
	it('adds the global next to the existing ones', async () => {
		const config = await playPlugin()({
			globals: [{ slug: 'other', fields: [] }]
		} as unknown as Config);
		expect(config.globals?.map((global) => global.slug)).toEqual(['other', 'play']);
	});
});

describe('playGlobal', () => {
	it('registers the form component for the field', () => {
		const field = playGlobal().fields[0];
		expect(field).toMatchObject({
			type: 'json',
			admin: { components: { Field: { path: '@hello-eme/play-payload/client#PlayConfigField' } } }
		});
	});
});

describe('supportUrl', () => {
	it('is handed to the editor field only when set', () => {
		const props = (url?: string) => {
			const field = playGlobal(url ? { supportUrl: url } : {}).fields[0];
			return (
				field as { admin: { components: { Field: { clientProps: Record<string, unknown> } } } }
			).admin.components.Field.clientProps;
		};
		expect(props('https://buymeacoffee.com/x').supportUrl).toBe('https://buymeacoffee.com/x');
		expect(props()).not.toHaveProperty('supportUrl');
	});
});

describe('previewUrl', () => {
	it('is handed to the form only when set', () => {
		const props = (url?: string) => {
			const field = playGlobal(url ? { previewUrl: url } : {}).fields[0];
			return field && 'admin' in field
				? (field.admin?.components?.Field as { clientProps: Record<string, unknown> }).clientProps
				: {};
		};
		expect(props('https://site.example/preview').previewUrl).toBe('https://site.example/preview');
		expect(props()).not.toHaveProperty('previewUrl');
	});
});

describe('validateConfig', () => {
	it('is lenient: only something that is no object blocks saving', () => {
		expect(validateConfig({ view: { mode: 'side' } })).toBe(true);
		expect(validateConfig({ view: { mode: 'x' } })).toBe(true);
		expect(validateConfig(null)).toBe(true);
		expect(validateConfig([])).toBe('The configuration must be a JSON object.');
	});
});
