import {
	autoPlacement,
	autoUpdate,
	computePosition,
	hide,
	offset,
} from "@floating-ui/dom";
import { debounce } from "es-toolkit";
import htmx from "htmx.org";
import { thumbHashToDataURL } from "thumbhash";

htmx.onLoad((node) => {
	if (!(node instanceof HTMLElement)) return;

	// auto-open dialog element and auto self-remove on close
	if (node instanceof HTMLDialogElement) {
		node.showModal();
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

	node.querySelectorAll<HTMLElement>("[data-floating]").forEach((element) => {
		const reference = element.closest(element.dataset.floating!);
		if (!(reference instanceof HTMLElement)) return;
		const floating = reference.querySelector(".floating");
		if (!(floating instanceof HTMLElement)) return;

		const updatePosition = async () => {
			const { x, y, middlewareData } = await computePosition(
				reference,
				floating,
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

			Object.assign(floating.style, { left: `${x}px`, top: `${y}px` });
			if (middlewareData.hide) {
				Object.assign(floating.style, {
					visibility: middlewareData.hide.referenceHidden
						? "hidden"
						: "visible",
				});
			}
		};

		const showFloating = () => {
			floating.style.display = "block";
			const cleanup = autoUpdate(reference, floating, updatePosition);

			const hideFloating = () => {
				if (!floating.style.display) return;

				cleanup();
				floating.style.display = "";
			};

			// onblur-outside (ontabbed-out)
			reference.addEventListener("focusout", function listener(event) {
				if (
					event.relatedTarget &&
					!reference.contains(event.relatedTarget as HTMLElement)
				) {
					hideFloating();
					reference.removeEventListener("focusout", listener);
				}
			});

			// onhover-outside
			reference.addEventListener("mouseleave", function listener() {
				hideFloating();
				reference.removeEventListener("mouseleave", listener);
			});

			// onclick-outside
			document.addEventListener("click", function listener(event) {
				if (!reference.contains(event.target as HTMLElement)) {
					hideFloating();
					document.removeEventListener("click", listener);
				}
			});
		};

		// onhover & onclick
		(["mouseenter", "focus"] as const).forEach((event) => {
			element.addEventListener(event, showFloating);
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
	const container = htmx.find("#container")!;
	const scrollToTopButton = htmx.find("#scroll-to-top")!;

	htmx.on(
		container,
		"scroll",
		debounce(() => {
			const screenSize = container.clientHeight;
			const scrolledEnough = container.scrollTop >= screenSize / 2;
			scrollToTopButton.classList.toggle("show", scrolledEnough);
		}, 150),
	);

	htmx.on(scrollToTopButton, "click", () => {
		scrollToTopButton.classList.remove("active");

		container.scroll({ top: 0 });
	});
}

// logic for persistent theme
{
	const LIGHT_THEME = "lemonade";
	const DARK_THEME = "coffee";

	const lastTheme = localStorage.getItem("theme");
	const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)");

	const darkToggle = htmx.find(".theme-controller") as HTMLInputElement;
	darkToggle.checked =
		lastTheme === DARK_THEME || (!lastTheme && systemIsDark.matches);

	const setTheme = (isDark: boolean) => {
		const theme = isDark ? DARK_THEME : LIGHT_THEME;
		localStorage.setItem("theme", theme);
		document.documentElement.dataset.theme = theme;
	};

	htmx.on(darkToggle, "input", () => {
		setTheme(darkToggle.checked);
	});
	htmx.on(systemIsDark, "change", () => {
		darkToggle.checked = systemIsDark.matches;
		setTheme(systemIsDark.matches);
	});
}
