import { AUDIO_FORMAT, IMAGE_FORMAT } from "~/lib/compressor/config";

const DISPLAY_DELAY_MS = 1667;

const stampStylesheet = (() => {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(`
		@keyframes bounce-in {
			0% { transform: scale(0.2); opacity: 0; }
			100% { transform: scale(1); opacity: 1; }
		}

		:host {
			position: absolute;
			transform-origin: top left;
			user-select: none;
			width: 6rem;
		}

		:host img {
			width: 100%;
			user-select: none;
		}

		@media (min-width: 768px) {
			:host {
				width: 9rem;
			}
		}

		@media (min-width: 1024px) {
			:host {
				width: 12rem;
			}
		}
	`);

	return sheet;
})();

export class StampComponent extends HTMLElement {
	private readonly shadow: ShadowRoot;
	img: HTMLImageElement;
	audio: HTMLAudioElement | null;

	constructor(id: string, voiced: boolean) {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		this.shadow.adoptedStyleSheets = [stampStylesheet];

		this.img = document.createElement("img");
		this.img.src = `/assets/stamp/${id}.${IMAGE_FORMAT}`;
		this.audio = voiced
			? new Audio(`/assets/stamp/${id}.${AUDIO_FORMAT}`)
			: null;
	}

	async ensureLoaded() {
		await new Promise<void>((resolve) => {
			if (
				this.audio === null ||
				this.audio.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA
			)
				resolve();

			this.audio!.addEventListener("canplaythrough", () => resolve());
		});
	}

	connectedCallback() {
		const randomX = Math.random() * 100 + "%";
		const randomY = Math.random() * 100 + "%";
		this.style.left = randomX;
		this.style.top = randomY;
		this.style.translate = `-${randomX} -${randomY}`;

		this.shadow.innerHTML = "";
		this.img.addEventListener(
			"animationend",
			() => (this.img.style.animation = ""),
		);
		this.img.style.animation = "bounce-in 300ms forwards";
		this.shadow.appendChild(this.img);

		const scheduleRemove = () => {
			setTimeout(() => {
				this.img.addEventListener("animationend", () =>
					this.parentElement!.removeChild(this),
				);
				this.img.style.animation = "bounce-in 300ms reverse";
			}, DISPLAY_DELAY_MS);
		};

		if (this.audio) {
			this.audio.addEventListener("ended", scheduleRemove);
			this.audio.play().catch(() => scheduleRemove());
		} else {
			scheduleRemove();
		}
	}
}

if (!customElements.get("stamp-component")) {
	customElements.define("stamp-component", StampComponent);
}
