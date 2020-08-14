const TIME_PER_IMAGE_MS = 6000;

const template = document.getElementById('slideshow_template');
const slideshowTemplateTarget = document.getElementById('slideshow_template_target');
const debugStatusElement = document.getElementById('debug_status');


let imagesList;
let imagesListIndex;

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
	let currentImage = imagesList[imagesListIndex];

	let templateInstance = template.cloneNode(true);
	// FIXME these are kinda ugly
	let slideshowContent = templateInstance.getElementsByClassName('template_content_root')[0];
	let slideshowArtistName = templateInstance.getElementsByClassName('template_artist_name')[0];
	let mediaPlaceholder = templateInstance.getElementsByClassName('template_media_placeholder')[0];
	let slideshowMedia;
	if(currentImage.type === 'image') slideshowMedia = document.createElement('img');
	else if(currentImage.type === 'video') slideshowMedia = document.createElement('video');
	else throw new Error('Unreachable State');
	slideshowMedia.classList.add('slideshow_image');
	mediaPlaceholder.replaceWith(slideshowMedia);

	slideshowArtistName.innerText = currentImage.artist;
	
	if(currentImage.type === 'image') slideshowMedia.src = currentImage.path;
	else if(currentImage.type === 'video') slideshowMedia.src = currentImage.path;
	else throw new Error('Unreachable State');

	setDebugStatus('waiting for next image to load');
	if(currentImage.type === 'image') await nextEventFirePromise(slideshowMedia, 'load');
	else if(currentImage.type === 'video') await nextEventFirePromise(slideshowMedia, 'loadeddata');
	else throw new Error('Unreachable State');
	clearDebugStatus();
	
	if(lastImageContent != null) {
		lastImageContent.classList.remove('slide_in');
		void lastImageContent.offsetWidth; // https://css-tricks.com/restart-css-animation/
		lastImageContent.classList.add('slide_out');
		setDebugStatus('waiting for last image to slide out');
		await nextEventFirePromise(lastImageContent, 'animationend');
		clearDebugStatus();
		lastImageContent.parentElement.removeChild(lastImageContent);
	}
	
	slideshowContent.classList.add('slide_in');
	slideshowTemplateTarget.appendChild(slideshowContent);
	setDebugStatus('waiting for new image to slide in');
	await nextEventFirePromise(slideshowContent, 'animationend');
	clearDebugStatus();

	if(currentImage.type === 'image') setTimeout(nextImage, TIME_PER_IMAGE_MS);
	else if(currentImage.type === 'video') {
		slideshowMedia.classList.add('imperceptible_jitter');
		slideshowMedia.loop = false;
		await slideshowMedia.play();
		slideshowMedia.addEventListener('ended', function onended(e){
			slideshowMedia.classList.remove('imperceptible_jitter');
			// slideshowMedia.currentTime = 0;
			// slideshowMedia.play();
			// setDebugStatus(e.timeStamp);
			slideshowMedia.removeEventListener('ended', onended);
			nextImage();
		});
	}
	else throw new Error('Unreachable State');

	imagesListIndex++;
	if(imagesListIndex >= imagesList.length) imagesListIndex = 0;
	lastImageContent = slideshowContent;
}

(async function main(){
	imagesList = await fetch('images.json').then(response=>response.json());
	imagesListIndex = 0;
	console.log(imagesList);
	nextImage();
})();
