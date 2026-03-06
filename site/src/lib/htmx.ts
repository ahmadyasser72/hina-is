import htmx from "htmx.org";
import { thumbHashToDataURL } from "thumbhash";

htmx.onLoad((node) => {
	if (!(node instanceof HTMLElement)) return;

	// auto-open dialog element and auto self-remove on close
	if (node instanceof HTMLDialogElement) {
		node.show();
		node.addEventListener("close", () => setTimeout(() => node.remove(), 300));
	}

	// thumbhash image placeholder
	node.querySelectorAll<HTMLImageElement>("[data-thumbhash]").forEach((img) => {
		if (img.complete) return;

		const base64Hash = img.dataset.thumbhash!;
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

{
	const container = htmx.find("#container")!;
	const scrollToTopButton = htmx.find("#scroll-to-top")!;

	let timer: ReturnType<typeof setTimeout> | undefined = undefined;
	htmx.on(container, "scroll", function (this: HTMLElement) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			scrollToTopButton.classList.toggle(
				"active",
				this.scrollTop >= this.clientHeight,
			);
		}, 150);
	});

	htmx.on(scrollToTopButton, "click", function (this: HTMLElement) {
		this.classList.remove("active");
		container.scroll({ top: 0 });
	});
}
