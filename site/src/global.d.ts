declare global {
	interface Window {
		playStampAudio: (button: HTMLButtonElement, slug: string) => void;
	}
}

export {};
