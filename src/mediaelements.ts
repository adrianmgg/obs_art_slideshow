import { dispatchCustomEvent } from './events.js';
import { SlideshowEntryMetadata, SlideshowGroupEntryMetadata, SlideshowImageEntryMetadata, SlideshowVideoEntryMetadata } from './slideshow_entry_metadata.js';
import { SlideshowTheme } from './slideshow_theme.js';
import { assert, nextEventFirePromise, templateFancy } from './util.js';

// TODO give the artist name display to the entry controller instead, media elements should ONLY be handling the media elements

// TODO can maybe factor some behavior into this base class
export abstract class SlideshowMediaElement {
	abstract metadata: SlideshowEntryMetadata;
	abstract isReady: Promise<void>;
	abstract isFinished: Promise<void>;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract element: Element;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract artistNameDisplay: Text;

	abstract start(): Promise<void>;
}

export class SlideshowMediaElementImage extends SlideshowMediaElement {
	metadata: SlideshowImageEntryMetadata;
	isReady: Promise<void>;
	isFinished: Promise<void>;
	private _isFinishedResolve!: () => void;
	element: HTMLImageElement;
	artistNameDisplay: Text;
	private readonly theme: SlideshowTheme;

	constructor(metadata: SlideshowImageEntryMetadata, eventTarget: EventTarget, theme: SlideshowTheme) {
		super();
		this.theme = theme;
		this.metadata = metadata;
		this.artistNameDisplay = document.createTextNode(metadata.artist);
		this.element = document.createElement('img');
		this.isReady = nextEventFirePromise(this.element, 'load', 'error').then(() => {
			dispatchCustomEvent(eventTarget, 'slideshowmedialoaded', {media: this.element});
		}).catch(() => {
			throw new Error(templateFancy`failed to load image ${this.metadata.path}`);
		});
		this.isFinished = new Promise<void>((resolve) => {
			this._isFinishedResolve = resolve;
		});
		this.element.src = this.metadata.path;
	}

	start(): Promise<void> {
		setTimeout(this._isFinishedResolve, this.theme.config.imageIdleTime * 1000);
		return Promise.resolve();
	}
}

export class SlideshowMediaElementVideo extends SlideshowMediaElement {
	metadata: SlideshowVideoEntryMetadata;
	isReady: Promise<void>;
	isFinished: Promise<void>;
	element: HTMLVideoElement;
	artistNameDisplay: Text;

	constructor(metadata: SlideshowVideoEntryMetadata, eventTarget: EventTarget) {
		super();
		this.metadata = metadata;
		this.artistNameDisplay = document.createTextNode(this.metadata.artist);
		this.element = document.createElement('video');
		this.isReady = nextEventFirePromise(this.element, 'loadeddata', 'error').then(() => {
			dispatchCustomEvent(eventTarget, 'slideshowmedialoaded', {media: this.element});
		}).catch(() => {
			throw new Error(templateFancy`failed to load video ${this.metadata.path}`);
		});
		this.isFinished = nextEventFirePromise(this.element, 'ended');
		this.element.muted = true;
		this.element.autoplay = false;
		this.element.classList.add('imperceptible_jitter');  // see comment in style.css for explanation
		this.element.src = this.metadata.path;
	}

	async start(): Promise<void> {
		await this.element.play();
	}
}

export class SlideshowMediaElementGroup extends SlideshowMediaElement {
	metadata: SlideshowGroupEntryMetadata;
	isReady: Promise<void>;
	isFinished: Promise<void>;
	element: Element;
	artistNameDisplay: Text;
	private currentChild: SlideshowMediaElement;
	private readonly eventTarget: EventTarget;

	constructor(metadata: SlideshowGroupEntryMetadata, eventTarget: EventTarget) {
		super();
		this.metadata = metadata;
		this.eventTarget = eventTarget;
		const firstChildMeta = this.metadata.children[0];
		assert(firstChildMeta !== undefined, "groups can't have zero children");
		this.currentChild = firstChildMeta.createMediaElement(this.eventTarget);
		this.element = this.currentChild.element;
		this.artistNameDisplay = this.currentChild.artistNameDisplay;
		this.isReady = this.currentChild.isReady;
		this.isFinished = this._isFinished();
	}

	private async _isFinished(): Promise<void> {
		await this.currentChild.isFinished;
		// we specifically want to go through these one at a time
		/* eslint-disable no-await-in-loop */
		const children = this.metadata.children.values();
		children.next(); // pass first element
		for(const currentChildMeta of children) {
			this.currentChild = currentChildMeta.createMediaElement(this.eventTarget);
			await this.currentChild.isReady;
			this.artistNameDisplay.replaceWith(this.currentChild.artistNameDisplay);
			this.artistNameDisplay = this.currentChild.artistNameDisplay;
			this.element.replaceWith(this.currentChild.element);
			this.element = this.currentChild.element;
			await this.currentChild.start();
			await this.currentChild.isFinished;
		}
		/* eslint-enable no-await-in-loop */
	}

	start(): Promise<void> {
		return this.currentChild.start();
	}
}
