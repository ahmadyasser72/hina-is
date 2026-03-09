declare module "preact" {
	namespace JSX {
		interface IntrinsicElements {
			"iconify-icon": import("iconify-icon").IconifyIconProperties & {
				class?: string;
			};
		}
	}
}

export {};
