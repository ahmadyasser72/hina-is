declare global {
	interface Window {
		playCardAudio: (button: HTMLButtonElement, slug: string) => void;
		playStampAudio: (button: HTMLButtonElement, slug: string) => void;

		playEventBgm: (button: HTMLButtonElement, slug: string) => void;
		stopEventBgm: () => void;
	}
}

export {};
