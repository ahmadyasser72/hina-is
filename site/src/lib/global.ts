import { AUDIO_FORMAT } from "@hina-is/bestdori/constants";

import {
	autoPlacement,
	autoUpdate,
	computePosition,
	hide,
	offset,
} from "@floating-ui/dom";

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

window.toggleFloating = async (reference, floatingElement) => {
	if (floatingElement.style.display) return;

	floatingElement.style.display = "block";
	const updatePosition = async () => {
		const { x, y, middlewareData } = await computePosition(
			reference,
			floatingElement,
			{
				placement: "bottom-end",
				middleware: [
					offset({ crossAxis: -4 }),
					autoPlacement({
						padding: { left: 40, right: 40 },
						alignment: "end",
					}),
					hide({ padding: 80 }),
				],
			},
		);

		Object.assign(floatingElement.style, { left: `${x}px`, top: `${y}px` });
		if (middlewareData.hide) {
			Object.assign(floatingElement.style, {
				visibility: middlewareData.hide.referenceHidden ? "hidden" : "visible",
			});
		}
	};

	const cleanup = autoUpdate(reference, floatingElement, updatePosition);
	document.addEventListener("pointerdown", function hideOnClickOutside(event) {
		if (
			event.target instanceof HTMLElement &&
			!reference.contains(event.target)
		) {
			cleanup();
			floatingElement.style.display = "";
			document.removeEventListener("pointerdown", hideOnClickOutside);
		}
	});
};
