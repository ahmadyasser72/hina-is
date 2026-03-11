declare global {
	namespace preact.JSX {
		interface IntrinsicElements {
			"iconify-icon": preact.HTMLAttributes<HTMLElement> &
				import("iconify-icon").IconifyIconProperties;
		}
	}
}

export {};
