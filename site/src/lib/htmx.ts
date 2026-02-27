import htmx from "htmx.org";
import { thumbHashToDataURL } from "thumbhash";

htmx.onLoad((node) => {
	if (!(node instanceof HTMLElement)) return;

	// auto-open dialog element and auto self-remove on close
	if (node instanceof HTMLDialogElement) {
		node.show();
		node.addEventListener("toggle", ({ newState }) => {
			if (newState === "closed") setTimeout(() => node.remove(), 300);
		});
	}

	// data-scroll-here attribute
	node
		.querySelector<HTMLElement>("[data-scroll-here]")
		?.scrollIntoView({ behavior: "smooth" });

	// thumbhash image placeholder
	node
		.querySelectorAll<HTMLImageElement>("img[data-thumbhash]")
		.forEach((img) => {
			if (img.complete) return;

			const base64Hash = img.dataset.thumbhash!;
			if (base64Hash === "UNKNOWN_IMAGE") {
				img.remove();
				return;
			}

			const binaryHash = new Uint8Array(
				atob(base64Hash)
					.split("")
					.map((x) => x.charCodeAt(0)),
			);

			const placeholderUrl = thumbHashToDataURL(binaryHash);
			img.style.background = `center / cover url(${placeholderUrl})`;
			img.addEventListener("load", () => {
				img.style.removeProperty("background");
			});
		});
});

// automatic swap target for dialog responses
htmx.on("htmx:beforeSwap", (e) => {
	const event = e as Event & {
		detail: {
			serverResponse: string;
			target: HTMLElement;
			swapOverride: string;
		};
	};

	if (
		event.detail.serverResponse.startsWith("<dialog") &&
		event.detail.target instanceof HTMLButtonElement
	) {
		event.detail.target = document.body;
		event.detail.swapOverride = "beforeend";
	}
});
