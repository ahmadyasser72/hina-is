declare global {
	interface Window {
		playCardAudio: (button: HTMLButtonElement, slug: string) => void;
		playStampAudio: (button: HTMLButtonElement, slug: string) => void;

		playEventBGM: (button: HTMLButtonElement, slug: string) => void;
		stopEventBGM: () => void;

		scrollKeepHistory: (targetId: string) => void;
	}
}

export {};
