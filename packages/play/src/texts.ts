import { DEFAULT_TEXTS, TEXT_KEYS, type GameTexts, type PlayConfig } from '@hello-eme/play-schema';

export { fill } from '@hello-eme/play-schema';

/** The texts to show: the language's defaults, with every non-empty text of the configuration on top. */
export function textsFor(config: Pick<PlayConfig, 'locale' | 'texts'>): GameTexts {
	const texts = { ...DEFAULT_TEXTS[config.locale] };
	for (const key of TEXT_KEYS) {
		const custom = config.texts[key];
		if (custom.trim() !== '') texts[key] = custom;
	}
	return texts;
}
