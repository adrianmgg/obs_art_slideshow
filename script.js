const template = document.getElementById('slideshow_template');
const slideshowContainer = document.getElementById('slideshow_container');
const debugStatusElement = document.getElementById('debug_status');

/** @type {Array<SlideshowEntry>} */
let imagesList;
let imagesListIndex;

class SlideshowEntry {
	constructor({path, artist, type='image'}) {
		if(type != 'image' && type != 'video') throw new Error(`invalid slideshow entry type "${type}"`);
		this.path = path;
		this.artist = artist;
		this.type = type;
	}

	createInstance() {
		return new SlideshowEntryInstance(this);
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
		this.animationTargets = templateInstance.querySelectorAll('[data-template-animation-target]');
		
		// replace media placeholder with correct element
		this.media = this._createMediaElement();
		mediaPlaceholder.replaceWith(this.media);

		// fill in artist name
		this.artistName.innerText = this.entry.artist;
		
		if(this.entry.type === 'image') this.mediaReady = nextEventFirePromise(this.media, 'load');
		else if(this.entry.type === 'video') this.mediaReady = nextEventFirePromise(this.media, 'loadeddata');
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
		if(this.entry.type === 'image') {
			await this._animateGeneric('slideshow_idle');
		}
		else if(this.entry.type === 'video') {
			this.media.classList.add('imperceptible_jitter');
			this.media.loop = false;
			await this.media.play();
			await nextEventFirePromise(this.media, 'ended');
			this.media.classList.remove('imperceptible_jitter');
		}
		else throw new Error('Unreachable State');
	}
	
	async _animateGeneric(className) {
		for(let animationTarget of this.animationTargets) {
			if(this._lastAnimation != null) animationTarget.classList.remove(this._lastAnimation);
			animationTarget.classList.add(className);
		}
		this._lastAnimation = className;
		await nextEventFirePromise(this.animationTimingReference, 'animationend');
	}

	destroy() {
		this.wrapper.parentElement.removeChild(this.wrapper);
	}

	_createMediaElement() {
		let ret;
		if(this.entry.type === 'image') {
			ret = document.createElement('img');
			ret.src = this.entry.path;
		}
		else if(this.entry.type === 'video') {
			ret = document.createElement('video');
			ret.src = this.entry.path;
		}
		else throw new Error('Unreachable State');
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
	imagesList = (await fetch('images.json', {cache: 'no-cache'}).then(response=>response.json())).map(x=>new SlideshowEntry(x));
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
