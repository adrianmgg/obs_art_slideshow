const template = document.getElementById('slideshow_template');
const slideshowTemplateTarget = document.getElementById('slideshow_template_target');
const debugStatusElement = document.getElementById('debug_status');

/** @type {Array<SlideshowEntry>} */
let imagesList;
let imagesListIndex;

class SlideshowEntry {
	constructor({path, artist, type='image'}) {
		this.path = path;
		this.artist = artist;
		this.type = type;
	}

	createMediaElement() {
		let ret;
		if(this.type === 'image') {
			ret = document.createElement('img');
			ret.src = this.path;
		}
		else if(this.type === 'video') {
			ret = document.createElement('video');
			ret.src = this.path;
		}
		else throw new Error('Unreachable State');
		ret.classList.add('slideshow_image');
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

let lastImageContent = null;
async function nextImage() {
	let currentEntry = imagesList[imagesListIndex];

	let templateInstance = template.cloneNode(true);
	// FIXME these are kinda ugly
	let slideshowContent = templateInstance.getElementsByClassName('template_content_root')[0];
	let slideshowArtistName = templateInstance.getElementsByClassName('template_artist_name')[0];
	let mediaPlaceholder = templateInstance.getElementsByClassName('template_media_placeholder')[0];
	
	let slideshowMedia = currentEntry.createMediaElement();
	mediaPlaceholder.replaceWith(slideshowMedia);

	slideshowArtistName.innerText = currentEntry.artist;

	setDebugStatus('waiting for next image to load');
	if(currentEntry.type === 'image') await nextEventFirePromise(slideshowMedia, 'load');
	else if(currentEntry.type === 'video') await nextEventFirePromise(slideshowMedia, 'loadeddata');
	else throw new Error('Unreachable State');
	clearDebugStatus();
	
	if(lastImageContent != null) {
		lastImageContent.classList.remove('slideshow_idle');
		lastImageContent.classList.add('slideshow_slide_out');
		setDebugStatus('waiting for last image to slide out');
		await nextEventFirePromise(lastImageContent, 'animationend');
		clearDebugStatus();
		lastImageContent.parentElement.removeChild(lastImageContent);
	}
	
	slideshowContent.classList.add('slideshow_slide_in');
	slideshowTemplateTarget.appendChild(slideshowContent);
	setDebugStatus('waiting for new image to slide in');
	await nextEventFirePromise(slideshowContent, 'animationend');
	clearDebugStatus();

	if(currentEntry.type === 'image') {
		slideshowContent.classList.remove('slideshow_slide_in');
		slideshowContent.classList.add('slideshow_idle');
		slideshowContent.addEventListener('animationend', function onAnimationEnd(e) {
			slideshowMedia.removeEventListener('animationend', onAnimationEnd);
			nextImage();
		});
	}
	else if(currentEntry.type === 'video') {
		slideshowMedia.classList.add('imperceptible_jitter');
		slideshowMedia.loop = false;
		await slideshowMedia.play();
		slideshowMedia.addEventListener('ended', function onended(e){
			slideshowMedia.classList.remove('imperceptible_jitter');
			slideshowMedia.removeEventListener('ended', onended);
			nextImage();
		});
	}
	else throw new Error('Unreachable State');

	imagesListIndex++;
	if(imagesListIndex >= imagesList.length) imagesListIndex = 0;
	lastImageContent = slideshowContent;
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
	imagesList = (await fetch('images.json').then(response=>response.json())).map(x=>new SlideshowEntry(x));
	imagesListIndex = 0;
	// load template
	let templateContents = await fetch(`${themePath}/slideshow_template.html`).then(response=>response.text());
	template.innerHTML = templateContents;
	// load theme stylesheet
	let templateStylesheet = document.createElement('link');
	document.head.appendChild(templateStylesheet);
	templateStylesheet.rel = 'stylesheet';
	templateStylesheet.href = `${themePath}/slideshow_theme.css`;
	await nextEventFirePromise(templateStylesheet, 'load');
	// start slideshow
	nextImage();
})();
