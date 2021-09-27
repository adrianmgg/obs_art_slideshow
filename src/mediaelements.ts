abstract class SlideshowMediaElement {
	abstract metadata: SlideshowEntryMetadata;
	abstract isReady: Promise<any>;
	abstract isFinished: Promise<any>;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract element: Element;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract artistNameDisplay: Text;

	abstract start(): Promise<any>;
}

class SlideshowMediaElementImage extends SlideshowMediaElement {
	metadata: SlideshowImageEntryMetadata;
	isReady: Promise<any>;
	isFinished: Promise<any>;
	private isFinishedResolve!: () => void;
	element: HTMLImageElement;
	artistNameDisplay: Text;

	constructor(metadata: SlideshowImageEntryMetadata) {
		super();
		this.metadata = metadata;
		this.artistNameDisplay = document.createTextNode(metadata.artist);
		this.element = document.createElement('img');
		this.isReady = nextEventFirePromise(this.element, 'load', 'error');
		this.isFinished = new Promise<void>((resolve) => {
			this.isFinishedResolve = resolve;
		});
		this.element.src = this.metadata.path;
	}

	async start(): Promise<any> {
		setTimeout(this.isFinishedResolve, themeConfig.imageIdleTime * 1000);
	}
}

class SlideshowMediaElementVideo extends SlideshowMediaElement {
	metadata: SlideshowVideoEntryMetadata;
	isReady: Promise<any>;
	isFinished: Promise<any>;
	element: HTMLVideoElement;
	artistNameDisplay: Text;

	constructor(metadata: SlideshowVideoEntryMetadata) {
		super();
		this.metadata = metadata;
		this.artistNameDisplay = document.createTextNode(this.metadata.artist);
		this.element = document.createElement('video');
		this.isReady = nextEventFirePromise(this.element, 'loadeddata', 'error');
		this.isFinished = nextEventFirePromise(this.element, 'ended', 'error');
		this.element.muted = true;
		this.element.autoplay = false;
		this.element.classList.add('imperceptible_jitter');  // see comment in style.css for explanation
		this.element.src = this.metadata.path;
	}

	async start(): Promise<any> {
		await this.element.play();
	}
}

class SlideshowMediaElementGroup extends SlideshowMediaElement {
	metadata: SlideshowGroupEntryMetadata;
	isReady: Promise<any>;
	isFinished: Promise<any>;
	element: Element;
	artistNameDisplay: Text;
	private childIndex: number;
	private currentChild: SlideshowMediaElement;

	constructor(metadata: SlideshowGroupEntryMetadata) {
		super();
		this.metadata = metadata;
		this.childIndex = 0;
		this.currentChild = this.metadata.children[this.childIndex].createMediaElement();
		this.element = this.currentChild.element;
		this.artistNameDisplay = this.currentChild.artistNameDisplay;
		this.isReady = this.currentChild.isReady;
		this.isFinished = this._isFinished();
	}

	private async _isFinished(): Promise<void> {
		await this.currentChild.isFinished;
		for(this.childIndex = 1; this.childIndex < this.metadata.children.length; this.childIndex++) {
			this.currentChild = this.metadata.children[this.childIndex].createMediaElement();
			await this.currentChild.isReady;  // TODO not sure if we'll need to add it to the document to get it to start loading, be sure to check this for images and videos
			this.artistNameDisplay.replaceWith(this.currentChild.artistNameDisplay);
			this.artistNameDisplay = this.currentChild.artistNameDisplay;
			this.element.replaceWith(this.currentChild.element);
			this.element = this.currentChild.element;
			await this.currentChild.start();
			await this.currentChild.isFinished;
		}
	}

	start(): Promise<any> {
		return this.currentChild.start();
	}
}