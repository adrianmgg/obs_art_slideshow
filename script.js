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
			resolve(e);
		}
		target.addEventListener(eventType, event);
	});
}

let lastImageContent = null;
async function nextImage() {
	let templateInstance = template.cloneNode(true);
	// FIXME these are kinda ugly
	let slideshowContent = templateInstance.getElementsByClassName('template_content_root')[0];
	let slideshowImage = templateInstance.getElementsByClassName('template_media')[0];
	let slideshowArtistName = templateInstance.getElementsByClassName('template_artist_name')[0];

	slideshowArtistName.innerText = imagesList[imagesListIndex].artist;
	let aspectRatio = Math.random()*2;
	let width = Math.random() * 1000 + 16;
	let height = width * aspectRatio;

	slideshowImage.src = imagesList[imagesListIndex].path;
	
	setDebugStatus('waiting for next image to load');
	await nextEventFirePromise(slideshowImage, 'load');
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
	setDebugStatus(`showing this image for ${TIME_PER_IMAGE_MS/1000} seconds`);
	setTimeout(nextImage, TIME_PER_IMAGE_MS);

	imagesListIndex++;
	if(imagesListIndex >= imagesList.length) imagesListIndex = 0;
	lastImageContent = slideshowContent;
}

(async function main(){
	imagesList = await fetch('images.json').then(response=>response.json());
	imagesListIndex = 0;
	console.log(imagesList);
	nextImage();
})()
