/** Sounds: tiny synthesized beeps from the configuration, no files to load. Off unless turned on. */
import type { PlayConfig, SoundDefinition } from '@hello-eme/play-schema';

/** Sounds the engine plays by itself, unless the configuration defines its own with that id. */
const BUILT_IN: Record<string, SoundDefinition> = {
	honk: { wave: 'square', from: 330, to: 300, seconds: 0.25, volume: 0.4 }
};

export interface Audio {
	/** Plays a defined sound (nothing for unknown ids, or when audio is off). */
	play(id: string): void;
	configure(config: PlayConfig['audio']): void;
	close(): void;
}

export function createAudio(initial: PlayConfig['audio']): Audio {
	let config = initial;
	let context: AudioContext | undefined;
	return {
		configure(next) {
			config = next;
		},
		play(id) {
			const sound = config.sounds[id] ?? BUILT_IN[id];
			if (!config.enabled || !sound) return;
			try {
				context ??= new AudioContext();
				if (context.state === 'suspended') void context.resume();
				const now = context.currentTime;
				const oscillator = context.createOscillator();
				const gain = context.createGain();
				oscillator.type = sound.wave;
				oscillator.frequency.setValueAtTime(sound.from, now);
				oscillator.frequency.linearRampToValueAtTime(sound.to, now + sound.seconds);
				const volume = sound.volume * config.volume * 0.3;
				gain.gain.setValueAtTime(volume, now);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.seconds);
				oscillator.connect(gain).connect(context.destination);
				oscillator.start(now);
				oscillator.stop(now + sound.seconds);
			} catch {
				// No audio in this browser, or not allowed yet: the game is silent, that's fine.
			}
		},
		close() {
			void context?.close().catch(() => {});
			context = undefined;
		}
	};
}
