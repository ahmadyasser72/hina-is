declare global {
	declare const __BUILD_DATE__: string;
	declare const __GITHUB_URL__: string;

	interface Window {
		playCardAudio: (button: HTMLButtonElement, slug: string) => void;
		playStampAudio: (button: HTMLButtonElement, slug: string) => void;

		playEventBGM: (button: HTMLButtonElement, slug: string) => void;
		stopEventBGM: () => void;

		scrollKeepHistory: (targetId: string) => void;
	}

	interface ObjectConstructor {
		entries<K extends string, V>(o: Record<K, V>): [K, V][];
		fromEntries<K extends string, V>(e: [K, V][]): Record<K, V>;
	}

	namespace preact.JSX {
		interface IntrinsicElements {
			"iconify-icon": preact.HTMLAttributes<HTMLElement> &
				import("iconify-icon").IconifyIconProperties;
		}
	}
}

export {};
