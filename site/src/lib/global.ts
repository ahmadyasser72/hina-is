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
	const tooltip = button.closest<HTMLElement>(".tooltip")!;

	playAudio(button, `/assets/cards/${slug}-voice.${AUDIO_FORMAT}`, {
		beforePlay: () => tooltip.classList.toggle("tooltip-open", true),
		afterPlay: () => tooltip.classList.toggle("tooltip-open", false),
	});
};
