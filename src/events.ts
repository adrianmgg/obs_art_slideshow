export interface SlideshowMediaLoadedEvent extends CustomEvent {
	detail: {
		media: HTMLElement;
	};
}
export interface SlideshowPhaseEvent extends CustomEvent {
	detail: {
		phase: 'intro' | 'idle' | 'outro';
	};
}
export interface SlideshowInitEvent extends CustomEvent {
	// TODO should include config and stuff in here
	detail: {
		root: ShadowRoot;
	},
}

export interface SlideshowEventMap {
	'slideshowphase': SlideshowPhaseEvent;
	'slideshowmedialoaded': SlideshowMediaLoadedEvent;
	'slideshowinit': SlideshowInitEvent;
}

export function dispatchCustomEvent<K extends keyof SlideshowEventMap>(target: EventTarget, eventName: K, detail: SlideshowEventMap[K]['detail'], options?: EventInit): void {
	target.dispatchEvent(new CustomEvent<SlideshowEventMap[K]['detail']>(eventName, {
		bubbles: true,
		detail: detail,
		...options,
	}));
}

