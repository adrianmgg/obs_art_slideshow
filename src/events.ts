interface SlideshowMediaLoadedEvent extends CustomEvent {
	detail: {
		media: HTMLElement;
	};
}
interface SlideshowPhaseEvent extends CustomEvent {
	detail: {
		phase: 'intro' | 'idle' | 'outro';
	};
}

interface SlideshowEventMap {
	'slideshowphase': SlideshowPhaseEvent;
	'slideshowmedialoaded': SlideshowMediaLoadedEvent;
}

function dispatchCustomEvent<K extends keyof SlideshowEventMap>(target: EventTarget, eventName: K, detail: SlideshowEventMap[K]['detail']): void {
	target.dispatchEvent(new CustomEvent<SlideshowEventMap[K]['detail']>(eventName, {
		bubbles: true,
		detail: detail,
	}));
}
