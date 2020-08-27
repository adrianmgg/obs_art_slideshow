const template = document.getElementById('slideshow_template');
const slideshowContainer = document.getElementById('slideshow_container');
const debugStatusElement = document.getElementById('debug_status');

/** @type {Array<SlideshowEntry>} */
let imagesList;
let imagesListIndex;

function throwError(message) { throw new Error(message); }

function createSlideshowEntry(data) {
	switch(data.type || 'image') {
		case 'image': return new SlideshowImageEntry(data);
		case 'video': return new SlideshowVideoEntry(data);
		case 'group': return new SlideshowGroupEntry(data);
		default: throw new Error(`invalid slideshow entry type "${this.type}"`);
	}
}

class SlideshowEntry {
	constructor() {}

	createInstance() {
		return new SlideshowEntryInstance(this);
	}
}

class SlideshowMediaEntry extends SlideshowEntry {
	constructor(path, artist) {
		super();
		this.path = path;
		this.artist = artist;
	}
}

class SlideshowImageEntry extends SlideshowMediaEntry {
	constructor(data) {
		super(data.path, data.artist);
	}

	_createMediaElement() {
		let ret = document.createElement('img');
		ret.src = this.path;
		return ret;
	}
}

class SlideshowVideoEntry extends SlideshowMediaEntry {
	constructor(data) {
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
	constructor(data) {
		super();
		this.children = data.entries.map(createSlideshowEntry);
	}
}

class SlideshowEntryInstance {
	constructor(entry) {
		this.entry = entry;  // FIXME give this a clearer name?
	
		this._lastAnimation = null;

		let templateInstance = template.cloneNode(true);

		// get certain elements from template
		this.contentRoot = templateInstance.querySelector('[data-template-content-root]');
		this.artistName = templateInstance.querySelector('[data-template-artist-name]');
		let mediaPlaceholder = templateInstance.querySelector('[data-template-media-placeholder]');
		this.animationTimingReference = templateInstance.querySelector('[data-template-animation-timing-reference]');
		
		// replace media placeholder with correct element
		this.media = this._createMediaElement();
		mediaPlaceholder.replaceWith(this.media);

		// fill in artist name
		this.artistName.innerText = this.entry.artist;

		// TODO factor to media type-specific classes
		if(this.entry instanceof SlideshowImageEntry) this.mediaReady = nextEventFirePromise(this.media, 'load');
		else if(this.entry instanceof SlideshowVideoEntry) this.mediaReady = nextEventFirePromise(this.media, 'loadeddata');
		else throw new Error('Unreachable State');

		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('slideshow_template_instance_wrapper');
		this.wrapper.appendChild(this.contentRoot);
		slideshowContainer.appendChild(this.wrapper);

		/** @type {'INITIAL'|'ANIMATE_IN'|'IDLE'|'ANIMATE_OUT'} */
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
			this.media.loop = false;
			await this.media.play();
			await nextEventFirePromise(this.media, 'ended');
			this.media.classList.remove('imperceptible_jitter');
		}
		else throw new Error('Unreachable State');
	}
	
	_animateGeneric(className) {
		if(this._lastAnimation != null) this.contentRoot.classList.remove(this._lastAnimation);
		this.contentRoot.classList.add(className);
		this._lastAnimation = className;
		const animationTimingReference = this.animationTimingReference;
		return new Promise(function(resolve, reject) {
			function onAnimationEnd(e){
				if(e.target == animationTimingReference) resolve();
				else animationTimingReference.addEventListener(onAnimationEnd, {once: true, passive: true});
			}
			animationTimingReference.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
		});
	}

	destroy() {
		this.wrapper.parentElement.removeChild(this.wrapper);
	}

	_createMediaElement() {
		let ret = this.entry._createMediaElement();
		ret.classList.add('slideshow_image');  // FIXME factor out implementation specific class
		return ret;
	}
}

function setDebugStatus(msg){
	debugStatusElement.innerText = msg;
}
function clearDebugStatus(){
	setDebugStatus('');
};

function nextEventFirePromise(target, eventType) {
	return new Promise((resolve, reject) => {
		function event(e) {
			target.removeEventListener(eventType, event);
			target.removeEventListener('error', event);
			if(e.type === 'error') reject(e);
			else resolve(e);
		}
		target.addEventListener(eventType, event);
		target.addEventListener('error', event);
	});
}

let lastImage = null;
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


const controlsPanel = document.getElementById('slideshow_controls');
document.addEventListener('mouseenter', function(e) {
	controlsPanel.classList.add('visible');
});
document.addEventListener('mouseleave', function(e) {
	controlsPanel.classList.remove('visible');
});

(async function main(){
	const urlParams = (new URL(window.location)).searchParams;
	if(!urlParams.has('theme')) throw new Error('theme not specified');
	let themePath = `themes/${urlParams.get('theme')}`;
	// load images list
	imagesList = (await fetch('images.json', {cache: 'no-cache'}).then(response=>response.json())).map(x=>createSlideshowEntry(x));
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
