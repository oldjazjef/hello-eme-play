/** The real page as the world's host, plus the little DOM helpers the runtime needs. */
import type { Host, Platform } from '@hello-eme/play-core';

export interface PageHostOptions {
	/** Selector of the sticky header the figure can walk into. */
	header: string;
	/** Parts at the bottom the figure should stay above (touch controls, hint …). */
	bottomParts: () => HTMLElement[];
	/** Side view: which elements are platforms. */
	platforms: () => { selector: string; minWidth: number };
}

/** How long the platforms are cached (ms); reading every element's box each frame would be slow. */
const PLATFORM_CACHE = 250;

export function createPageHost(options: PageHostOptions): Host {
	let cached: { at: number; list: Platform[] } | undefined;
	return {
		viewport() {
			const header = options.header ? document.querySelector(options.header) : null;
			const top = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
			const bottom = Math.min(
				innerHeight,
				...options
					.bottomParts()
					.map((part) => part.getBoundingClientRect())
					.filter((rect) => rect.height > 0 && rect.top > innerHeight / 2)
					.map((rect) => rect.top)
			);
			return { width: innerWidth, height: bottom, top };
		},
		scroll: () => ({ x: scrollX, y: scrollY }),
		page() {
			const page = document.documentElement;
			return {
				width: Math.max(page.scrollWidth, innerWidth),
				height: Math.max(page.scrollHeight, innerHeight)
			};
		},
		scrollTo: (x, y) => scrollTo({ left: x, top: y, behavior: 'instant' }),
		platforms() {
			const now = performance.now();
			if (cached && now - cached.at < PLATFORM_CACHE) return cached.list;
			const { selector, minWidth } = options.platforms();
			const list: Platform[] = [];
			try {
				for (const element of document.querySelectorAll(selector)) {
					if (element.closest('[data-play-ui], [data-wrecked]')) continue;
					const rect = element.getBoundingClientRect();
					if (rect.width < minWidth || rect.height === 0) continue;
					// Only what is near the window; the rest isn't reachable right now.
					if (rect.bottom < -innerHeight || rect.top > innerHeight * 2) continue;
					list.push({ x1: rect.left + scrollX, x2: rect.right + scrollX, y: rect.top + scrollY });
				}
			} catch {
				// An invalid selector in the configuration: no platforms.
			}
			cached = { at: now, list };
			return list;
		}
	};
}

/** Whether the visitor prefers no motion. */
export const reducedMotion = (): MediaQueryList => matchMedia('(prefers-reduced-motion: reduce)');
