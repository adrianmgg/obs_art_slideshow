abstract class SlideshowMediaElement {
	abstract metadata: SlideshowEntryMetadata;
	abstract isReady: Promise<void>;
	abstract isFinished: Promise<void>;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract element: Element;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract artistNameDisplay: Text;

	abstract start(): Promise<void>;
}

class SlideshowMediaElementImage extends SlideshowMediaElement {
	metadata: SlideshowImageEntryMetadata;
	isReady: Promise<void>;
	isFinished: Promise<void>;
	private _isFinishedResolve!: () => void;
	element: HTMLImageElement;
	artistNameDisplay: Text;

	constructor(metadata: SlideshowImageEntryMetadata, eventTarget: EventTarget) {
		super();
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
		setTimeout(this._isFinishedResolve, themeConfig.imageIdleTime * 1000);
		return Promise.resolve();
	}
}

class SlideshowMediaElementVideo extends SlideshowMediaElement {
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

class SlideshowMediaElementGroup extends SlideshowMediaElement {
	metadata: SlideshowGroupEntryMetadata;
	isReady: Promise<void>;
	isFinished: Promise<void>;
	element: Element;
	artistNameDisplay: Text;
	private _currentChild: SlideshowMediaElement;
	private readonly _eventTarget: EventTarget;

	constructor(metadata: SlideshowGroupEntryMetadata, eventTarget: EventTarget) {
		super();
		this.metadata = metadata;
		this._eventTarget = eventTarget;
		const firstChildMeta = this.metadata.children[0];
		assert(firstChildMeta !== undefined, "groups can't have zero children");
		this._currentChild = firstChildMeta.createMediaElement(this._eventTarget);
		this.element = this._currentChild.element;
		this.artistNameDisplay = this._currentChild.artistNameDisplay;
		this.isReady = this._currentChild.isReady;
		this.isFinished = this._isFinished();
	}

	private async _isFinished(): Promise<void> {
		await this._currentChild.isFinished;
		// we specifically want to go through these one at a time
		/* eslint-disable no-await-in-loop */
		const children = this.metadata.children.values();
		children.next(); // pass first element
		for(const currentChildMeta of children) {
			this._currentChild = currentChildMeta.createMediaElement(this._eventTarget);
			await this._currentChild.isReady;
			this.artistNameDisplay.replaceWith(this._currentChild.artistNameDisplay);
			this.artistNameDisplay = this._currentChild.artistNameDisplay;
			this.element.replaceWith(this._currentChild.element);
			this.element = this._currentChild.element;
			await this._currentChild.start();
			await this._currentChild.isFinished;
		}
		/* eslint-enable no-await-in-loop */
	}

	start(): Promise<void> {
		return this._currentChild.start();
	}
}
