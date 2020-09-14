const template = document.getElementById('slideshow_template') || throwError('element not found');
const slideshowContainer = document.getElementById('slideshow_container') || throwError('element not found');

let themeConfig: JSONDataThemeConfig;

let imagesList: Array<SlideshowEntryMetadata>;
let imagesListIndex: number;

//#region JSON data classes
interface JSONDataImageEntry {
	type?: 'image';
	path: string;
	artist: string;
}
interface JSONDataVideoEntry {
	type: 'video';
	path: string;
	artist: string;
}
interface JSONDataGroupEntry {
	type: 'group';
	entries: Array<JSONDataImageEntry|JSONDataVideoEntry>;
}
type JSONDataEntry = JSONDataImageEntry | JSONDataVideoEntry | JSONDataGroupEntry;

interface JSONDataThemeConfig {
	imageIdleTime: number;
}
//#endregion

function createSlideshowEntryMetadata(data: JSONDataEntry) {
	if(data.type === 'image' || !('type' in data)) return new SlideshowImageEntryMetadata(data);
	else if(data.type === 'video') return new SlideshowVideoEntryMetadata(data);
	else if(data.type === 'group') return new SlideshowGroupEntryMetadata(data);
	else throw new Error(`invalid slideshow entry type "${data.type}"`);
}

//#region slideshow entry metadata classes
abstract class SlideshowEntryMetadata {
	constructor() {}

	createInstance() {
		return new SlideshowEntryController(this);
	}

	abstract createMediaElement(): SlideshowMediaElement;
}

abstract class SlideshowMediaEntryMetadata extends SlideshowEntryMetadata {
	path: string;
	artist: string;
	constructor(path: string, artist: string) {
		super();
		this.path = path;
		this.artist = artist;
	}
}

class SlideshowImageEntryMetadata extends SlideshowMediaEntryMetadata {
	constructor(data: JSONDataImageEntry) {
		super(data.path, data.artist);
	}

	createMediaElement(): SlideshowMediaElementImage {
		return new SlideshowMediaElementImage(this);
	}
}

class SlideshowVideoEntryMetadata extends SlideshowMediaEntryMetadata {
	constructor(data: JSONDataVideoEntry) {
		super(data.path, data.artist);
	}

	createMediaElement(): SlideshowMediaElementVideo {
		return new SlideshowMediaElementVideo(this);
	}
}

class SlideshowGroupEntryMetadata extends SlideshowEntryMetadata {
	children: Array<SlideshowEntryMetadata>;  // TODO this might need to just be SlideshowMediaEntry, depends on how groups end up getting implemented
	constructor(data: JSONDataGroupEntry) {
		super();
		this.children = data.entries.map(createSlideshowEntryMetadata);
	}

	createMediaElement(): SlideshowMediaElementGroup {
		return new SlideshowMediaElementGroup(this);
	}
}
//#endregion

//#region media element classes
abstract class SlideshowMediaElement {
	abstract metadata: SlideshowEntryMetadata;
	abstract isReady: Promise<any>;
	abstract isFinished: Promise<any>;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract element: Element;
	/** WARNING: the value of this variable may change during the lifetime of this object */
	abstract artistNameDisplay: Text;

	abstract async start(): Promise<any>;
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
		this.isFinished = new Promise<void>((resolve, reject) => {
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
		// while(this.childIndex < this.metadata.children.length) {
		// 	await this.currentChild.isFinished;
		// 	this.childIndex++;
		// 	if(this.childIndex < this.metadata.children.length) break;
		// 	await this.currentChild.isReady;
		// 	this.updateChild(this.childIndex);
		// 	await this.currentChild.start();
		// }
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

	private updateChild(childIndex: number): void {
		this.currentChild = this.metadata.children[this.childIndex].createMediaElement();
		this.artistNameDisplay = this.currentChild.artistNameDisplay;
		this.element = this.currentChild.element;
	}
}
//#endregion

class SlideshowEntryController {
	mediaElement: SlideshowMediaElement;
	private _lastAnimation: string | null;
	contentRoot: Element;
	artistName: HTMLElement;
	animationTimingReference: HTMLElement;
	wrapper: HTMLElement;
	currentState: 'INITIAL'|'ANIMATE_IN'|'IDLE'|'ANIMATE_OUT';  // TODO move this to an interface or typedef or smth?

	constructor(entry: SlideshowEntryMetadata) {
		this.mediaElement = entry.createMediaElement();  // FIXME give this a clearer name?
	
		this._lastAnimation = null;

		let templateInstance = <typeof template>template.cloneNode(true);  // we need to cast here b/c clonenode just returns a Node
		
		// get certain elements from template
		this.contentRoot = templateInstance.querySelector<this['contentRoot']>('[data-template-content-root]') || throwError('element not found');
		this.artistName = templateInstance.querySelector<this['artistName']>('[data-template-artist-name]') || throwError('element not found');
		this.animationTimingReference = templateInstance.querySelector<this['animationTimingReference']>('[data-template-animation-timing-reference]') || throwError('element not found');
		let mediaPlaceholder = templateInstance.querySelector<Element>('[data-template-media-placeholder]') || throwError('element not found');
		
		// replace media placeholder with correct element
		mediaPlaceholder.replaceWith(this.mediaElement.element);
		// fill in artist name
		this.artistName.appendChild(this.mediaElement.artistNameDisplay);

		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('slideshow_template_instance_wrapper');
		this.wrapper.appendChild(this.contentRoot);
		slideshowContainer.appendChild(this.wrapper);

		this.currentState = 'INITIAL';
		this.wrapper.style.display = 'none';
	}

	async animateIn() {
		if(this.currentState != 'INITIAL') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'ANIMATE_IN';
		await this.mediaElement.isReady;
		this.wrapper.style.display = 'unset';
		await this._animateGeneric('slideshow_slide_in');
	}
	animateOut() {
		if(this.currentState != 'IDLE') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'ANIMATE_OUT';
		return this._animateGeneric('slideshow_slide_out');
	}

	async idle() {
		if(this.currentState != 'ANIMATE_IN') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'IDLE';
		await this.mediaElement.start();
		await this.mediaElement.isFinished;
	}
	
	_animateGeneric(className: string) {
		if(this._lastAnimation != null) this.contentRoot.classList.remove(this._lastAnimation);
		this.contentRoot.classList.add(className);
		this._lastAnimation = className;
		const animationTimingReference = this.animationTimingReference;
		return new Promise(function(resolve, reject) {
			function onAnimationEnd(e: AnimationEvent){
				if(e.target == animationTimingReference) resolve();
				else animationTimingReference.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
			}
			animationTimingReference.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
		});
	}

	destroy() {
		(this.wrapper.parentElement || throwError()).removeChild(this.wrapper);
	}
}

let lastImage: Nullable<SlideshowEntryController> = null;
async function nextImage() {
	let currentImage = imagesList[imagesListIndex].createInstance();
	
	if(lastImage != null) {
		await lastImage.animateOut();
		lastImage.destroy();
		lastImage = null;
	}

	await currentImage.animateIn();

	await currentImage.idle();
	
	imagesListIndex++;
	if(imagesListIndex >= imagesList.length) imagesListIndex = 0;
	lastImage = currentImage;

	setTimeout(nextImage, 0);
}


const controlsPanel = document.getElementById('slideshow_controls') || throwError('element not found');
document.addEventListener('mouseenter', function(e) {
	controlsPanel.classList.add('visible');
});
document.addEventListener('mouseleave', function(e) {
	controlsPanel.classList.remove('visible');
});

//#region utility functions
function throwError(message?: string): never {
	if(message == null) throw new Error();
	else throw new Error(message);
}

type Nullable<T> = T | null;

function nextEventFirePromise<T extends EventTarget>(target: T, eventType: string, errorEventType?: string): Promise<Event> {
	return new Promise((resolve, reject) => {
		function event(e: Event) {
			target.removeEventListener(eventType, event);
			if(errorEventType) target.removeEventListener(errorEventType, event);
			if(e.type === errorEventType) reject(e);
			else if(e.type === eventType) resolve(e);
			else reject(new Error(`event type ${e.type} is neither ${eventType} nor ${errorEventType}`));
		}
		target.addEventListener(eventType, event);
		if(errorEventType) target.addEventListener(errorEventType, event);
	});
}
//#endregion

(async function main(){
	const urlParams = (new URL(window.location.href)).searchParams;
	if(!urlParams.has('theme')) throw new Error('theme not specified');
	let themePath = `themes/${urlParams.get('theme')}`;
	// load images list
	imagesList = (await fetch('images.json', {cache: 'no-cache'}).then(response=>response.json())).map((x: JSONDataEntry)=>createSlideshowEntryMetadata(x));
	imagesListIndex = 0;
	// load theme config
	themeConfig = await fetch(`${themePath}/theme_config.json`, {cache: 'no-cache'}).then(response=>response.json());
	// load theme template html
	let templateContents = await fetch(`${themePath}/slideshow_template.html`, {cache: 'no-cache'}).then(response=>response.text());
	template.innerHTML = templateContents;
	// load theme stylesheet
	let templateStylesheet = document.createElement('style');
	document.head.appendChild(templateStylesheet);
	templateStylesheet.innerHTML = await fetch(`${themePath}/slideshow_theme.css`, {cache: 'no-cache'}).then(response=>response.text());
	// start slideshow
	nextImage();
})();
