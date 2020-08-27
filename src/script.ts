import { throwError, Nullable } from './util/misc';

const template = document.getElementById('slideshow_template') || throwError('element not found');
const slideshowContainer = document.getElementById('slideshow_container') || throwError('element not found');

let imagesList: Array<SlideshowEntry>;
let imagesListIndex: number;

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

function createSlideshowEntry(data: JSONDataEntry) {
	if(data.type === 'image' || !('type' in data)) return new SlideshowImageEntry(data);
	else if(data.type === 'video') return new SlideshowVideoEntry(data);
	else if(data.type === 'group') return new SlideshowGroupEntry(data);
	else throw new Error(`invalid slideshow entry type "${data.type}"`);
}

abstract class SlideshowEntry {
	constructor() {}

	createInstance() {
		return new SlideshowEntryInstance(this);
	}
}

abstract class SlideshowMediaEntry extends SlideshowEntry {
	path: string;
	artist: string;
	constructor(path: string, artist: string) {
		super();
		this.path = path;
		this.artist = artist;
	}

	abstract _createMediaElement(): Element;
}

class SlideshowImageEntry extends SlideshowMediaEntry {
	constructor(data: JSONDataImageEntry) {
		super(data.path, data.artist);
	}

	_createMediaElement() {
		let ret = document.createElement('img');
		ret.src = this.path;
		return ret;
	}
}

class SlideshowVideoEntry extends SlideshowMediaEntry {
	constructor(data: JSONDataVideoEntry) {
		super(data.path, data.artist);
	}

	_createMediaElement() {
		let ret = document.createElement('video');
		ret.muted = true;
		ret.src = this.path;
		return ret;
	}
}

class SlideshowGroupEntry extends SlideshowEntry {
	children: Array<SlideshowEntry>;  // TODO this might need to just be SlideshowMediaEntry, depends on how groups end up getting implemented
	constructor(data: JSONDataGroupEntry) {
		super();
		this.children = data.entries.map(createSlideshowEntry);
	}
}

class SlideshowEntryInstance {
	entry: SlideshowEntry;
	private _lastAnimation: string | null;
	contentRoot: Element;
	artistName: HTMLElement;
	animationTimingReference: HTMLElement;
	media: Element;
	mediaReady: Promise<unknown>;
	wrapper: HTMLElement;
	currentState: 'INITIAL'|'ANIMATE_IN'|'IDLE'|'ANIMATE_OUT';  // TODO move this to an interface or typedef or smth?

	constructor(entry: SlideshowEntry) {
		this.entry = entry;  // FIXME give this a clearer name?
	
		this._lastAnimation = null;

		let templateInstance = <typeof template>template.cloneNode(true);  // we need to cast here b/c clonenode just returns a Node
		
		// get certain elements from template
		this.contentRoot = templateInstance.querySelector<this['contentRoot']>('[data-template-content-root]') || throwError('element not found');
		this.artistName = templateInstance.querySelector<this['artistName']>('[data-template-artist-name]') || throwError('element not found');
		let mediaPlaceholder = templateInstance.querySelector<this['media']>('[data-template-media-placeholder]') || throwError('element not found');
		this.animationTimingReference = templateInstance.querySelector<this['animationTimingReference']>('[data-template-animation-timing-reference]') || throwError('element not found');
		
		// replace media placeholder with correct element
		this.media = this._createMediaElement();
		mediaPlaceholder.replaceWith(this.media);

		// fill in artist name
		this.artistName.innerText = (<SlideshowMediaEntry>this.entry).artist; // FIXME can remove cast after finished w/ refactor for groups implemented

		// TODO factor to media type-specific classes
		if(this.entry instanceof SlideshowImageEntry) this.mediaReady = nextEventFirePromise(this.media, 'load');
		else if(this.entry instanceof SlideshowVideoEntry) this.mediaReady = nextEventFirePromise(this.media, 'loadeddata');
		else throw new Error('Unreachable State');

		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('slideshow_template_instance_wrapper');
		this.wrapper.appendChild(this.contentRoot);
		slideshowContainer.appendChild(this.wrapper);

		this.currentState = 'INITIAL';
		this.wrapper.style.display = 'none';
	}

	animateIn() {
		if(this.currentState != 'INITIAL') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'ANIMATE_IN';
		this.wrapper.style.display = 'unset';
		return this._animateGeneric('slideshow_slide_in');
	}
	animateOut() {
		if(this.currentState != 'IDLE') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'ANIMATE_OUT';
		return this._animateGeneric('slideshow_slide_out');
	}

	async idle() {
		if(this.currentState != 'ANIMATE_IN') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'IDLE';
		// TODO factor to media type-specific classes
		if(this.entry instanceof SlideshowImageEntry) {
			await this._animateGeneric('slideshow_idle');
		}
		else if(this.entry instanceof SlideshowVideoEntry) {
			this.media.classList.add('imperceptible_jitter');
			(<HTMLVideoElement>this.media).loop = false;  // TODO remove these casts after refactor
			await (<HTMLVideoElement>this.media).play();
			await nextEventFirePromise(this.media, 'ended');
			this.media.classList.remove('imperceptible_jitter');
		}
		else throw new Error('Unreachable State');
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

	_createMediaElement() {
		let ret = (<SlideshowMediaEntry>this.entry)._createMediaElement();  // FIXME can remove cast after finished w/ refactor for groups implemented
		ret.classList.add('slideshow_image');  // FIXME factor out implementation specific class
		return ret;
	}
}

function nextEventFirePromise(target: Element, eventType: string) {
	return new Promise((resolve, reject) => {
		function event(e: Event) {
			target.removeEventListener(eventType, event);
			target.removeEventListener('error', event);
			if(e.type === 'error') reject(e);
			else resolve(e);
		}
		target.addEventListener(eventType, event);
		target.addEventListener('error', event);
	});
}

let lastImage: Nullable<SlideshowEntryInstance> = null;
async function nextImage() {
	let currentImage = imagesList[imagesListIndex].createInstance();
	
	await currentImage.mediaReady;

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

(async function main(){
	const urlParams = (new URL(window.location.href)).searchParams;
	if(!urlParams.has('theme')) throw new Error('theme not specified');
	let themePath = `themes/${urlParams.get('theme')}`;
	// load images list
	imagesList = (await fetch('images.json', {cache: 'no-cache'}).then(response=>response.json())).map((x: JSONDataEntry)=>createSlideshowEntry(x));
	imagesListIndex = 0;
	// load template
	let templateContents = await fetch(`${themePath}/slideshow_template.html`, {cache: 'no-cache'}).then(response=>response.text());
	template.innerHTML = templateContents;
	// load theme stylesheet
	let templateStylesheet = document.createElement('style');
	document.head.appendChild(templateStylesheet);
	templateStylesheet.innerHTML = await fetch(`${themePath}/slideshow_theme.css`, {cache: 'no-cache'}).then(response=>response.text());
	// start slideshow
	nextImage();
})();
