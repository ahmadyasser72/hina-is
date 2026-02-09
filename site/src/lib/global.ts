import { AUDIO_FORMAT } from "~/lib/compressor/constants";

window.playStampAudio = (button, slug) => {
	const audio = new Audio(`/assets/stamps/${slug}-voice.${AUDIO_FORMAT}`);

	if (audio.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
		audio.play();
		return;
	}

	button.disabled = true;
	button.classList.toggle("htmx-request", true);
	audio.addEventListener("canplaythrough", () => {
		button.classList.toggle("htmx-request", false);
		audio.play();
	});

	audio.addEventListener("ended", () => {
		button.disabled = false;
	});
};
