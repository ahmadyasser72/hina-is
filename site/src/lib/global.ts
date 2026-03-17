import { AUDIO_FORMAT } from "@hina-is/bestdori/constants";

{
	let playEventBGMButton: HTMLButtonElement | undefined;
	let eventBGM: HTMLAudioElement | undefined;

	window.playEventBGM = (button, slug) => {
		if (playEventBGMButton && eventBGM) window.stopEventBGM();

		playEventBGMButton = button;
		eventBGM = new Audio(`/assets/events/${slug}-bgm.${AUDIO_FORMAT}`);
		eventBGM.loop = true;
		eventBGM.controls = false;
		eventBGM.disableRemotePlayback = true;

		button.disabled = true;
		button.classList.toggle("htmx-request", true);
		eventBGM.addEventListener("canplay", () => {
			button.classList.toggle("htmx-request", false);
			eventBGM!.play();
		});
	};

	window.stopEventBGM = () => {
		if (playEventBGMButton && eventBGM) {
			playEventBGMButton.disabled = false;
			eventBGM.pause();

			playEventBGMButton = undefined;
			eventBGM = undefined;
		}
	};

	const playAudio = (
		button: HTMLButtonElement,
		pathname: string,
		handler: { afterPlay?: () => void; beforePlay?: () => void } = {},
	) => {
		const audio = new Audio(pathname);

		audio.addEventListener("ended", () => {
			button.disabled = false;
			handler.afterPlay?.();

			setTimeout(() => {
				if (eventBGM) eventBGM.volume = 1;
			}, 300);
		});

		button.disabled = true;
		button.classList.toggle("htmx-request", true);
		audio.addEventListener("canplaythrough", () => {
			button.classList.toggle("htmx-request", false);
			handler.beforePlay?.();

			if (eventBGM) eventBGM.volume = 1 / 3;
			audio.play();
		});
	};

	window.playStampAudio = (button, slug) =>
		playAudio(button, `/assets/stamps/${slug}-voice.${AUDIO_FORMAT}`);

	window.playCardAudio = (button, slug) => {
		const gachaText = document.getElementById(`${slug}-gacha-text`)!;

		playAudio(button, `/assets/cards/${slug}-voice.${AUDIO_FORMAT}`, {
			beforePlay: () => gachaText.classList.replace("opacity-0", "opacity-100"),
			afterPlay: () => gachaText.classList.replace("opacity-100", "opacity-0"),
		});
	};
}

window.scrollKeepHistory = (targetId) => {
	const selector = `#${targetId}`;

	history.replaceState(null, "", selector);
	document.querySelector(selector)?.scrollIntoView();
};
