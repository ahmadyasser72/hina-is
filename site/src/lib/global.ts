import { AUDIO_FORMAT } from "~/lib/compressor/constants";

const playAudio = (
	button: HTMLButtonElement,
	pathname: string,
	handler: { afterPlay?: () => void; beforePlay?: () => void } = {},
) => {
	const audio = new Audio(pathname);

	audio.addEventListener("ended", () => {
		button.disabled = false;
		handler.afterPlay?.();
	});

	button.disabled = true;
	button.classList.toggle("htmx-request", true);
	audio.addEventListener("canplaythrough", () => {
		button.classList.toggle("htmx-request", false);
		handler.beforePlay?.();
		audio.play();
	});
};

window.playStampAudio = (button, slug) =>
	playAudio(button, `/assets/stamps/${slug}-voice.${AUDIO_FORMAT}`);

window.playCardAudio = (button, slug) => {
	const dropdown = button.closest<HTMLElement>(".dropdown")!;

	playAudio(button, `/assets/cards/${slug}-voice.${AUDIO_FORMAT}`, {
		beforePlay: () =>
			dropdown.classList.replace("dropdown-close", "dropdown-open"),
		afterPlay: () =>
			dropdown.classList.replace("dropdown-open", "dropdown-close"),
	});
};
