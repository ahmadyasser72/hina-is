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

// logic for show/hide header and scroll-to-top
{
	const header = htmx.find("#header")!;
	const container = htmx.find("#container")!;
	const scrollToTopButton = htmx.find("#scroll-to-top")!;

	let lastScrollTop = container.scrollTop;
	let timer: ReturnType<typeof setTimeout> | undefined = undefined;
	htmx.on(container, "scroll", function (this: HTMLElement) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			const screenSize = this.clientHeight;
			const scrolledEnough = this.scrollTop >= screenSize / 2;
			const scrollingDown = this.scrollTop > lastScrollTop;
			const showScrollToTop = scrolledEnough && scrollingDown;

			scrollToTopButton.classList.toggle("active", showScrollToTop);
			header.classList.toggle("active", !showScrollToTop);

			lastScrollTop = this.scrollTop;
		}, 150);
	});

	htmx.on(scrollToTopButton, "click", function (this: HTMLElement) {
		this.classList.remove("active");
		setTimeout(() => {
			header.classList.add("active");
		}, 150);

		container.scroll({ top: 0 });
	});
}

// logic for persistent dark mode
{
	const lastIsDark = localStorage.getItem("is-dark");
	const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)");

	const darkToggle = htmx.find(".theme-controller") as HTMLInputElement;
	darkToggle.checked =
		lastIsDark !== null ? lastIsDark === "true" : systemIsDark.matches;

	const setTheme = (isDark: boolean) => {
		localStorage.setItem("is-dark", isDark ? "true" : "false");

		document.documentElement.dataset.theme = isDark ? darkToggle.value : "";
	};

	htmx.on(darkToggle, "input", () => setTheme(darkToggle.checked));
	htmx.on(systemIsDark, "change", () => {
		darkToggle.checked = systemIsDark.matches;
		setTheme(systemIsDark.matches);
	});
}
