const TIME_PER_IMAGE_MS = 6000;


const template = document.getElementById('slideshow_template');
const slideshowTemplateTarget = document.getElementById('slideshow_template_target');
const debugStatusElement = document.getElementById('debug_status');

let lastImageContent = null;

function nextEventFirePromise(target, eventType) {
	return new Promise((resolve, reject) => {
		function event(e) {
			target.removeEventListener(eventType, event);
			resolve(e);
		}
		target.addEventListener(eventType, event);
	});
}

// TODO start loading next image while showing current image
// TODO add support for videos
// TODO wrap debug text display in function

async function nextImage() {
	let templateInstance = template.cloneNode(true);
	// FIXME these are kinda ugly
	let slideshowContent = templateInstance.getElementsByClassName('slideshow_content_inner')[0];
	let slideshowImage = templateInstance.getElementsByClassName('slideshow_image')[0];
	let slideshowArtistName = templateInstance.getElementsByClassName('slideshow_artist_name')[0];

	slideshowArtistName.innerText = 'a'.repeat(Math.random()*16+1);
	let aspectRatio = Math.random()*2;
	let width = Math.random() * 1000 + 16;
	let height = width * aspectRatio;

	slideshowImage.src = `https://picsum.photos/${Math.floor(width)}/${Math.floor(height)}`
	
	debugStatusElement.innerText = 'waiting for next image to load';
	await nextEventFirePromise(slideshowImage, 'load');
	debugStatusElement.innerText = '';
	
	if(lastImageContent != null) {
		lastImageContent.classList.remove('slide_in');
		void lastImageContent.offsetWidth; // https://css-tricks.com/restart-css-animation/
		lastImageContent.classList.add('slide_out');
		debugStatusElement.innerText = 'waiting for last image to slide out';
		await nextEventFirePromise(lastImageContent, 'animationend');
		debugStatusElement.innerText = '';
		lastImageContent.parentElement.removeChild(lastImageContent);
		// TODO properly delete after slide out is finished instead of hard-coding delay
		// setTimeout(function(){this.parentElement.removeChild(this)}.bind(lastImageContent), 6000);
	}
	
	slideshowContent.classList.add('slide_in');
	slideshowTemplateTarget.appendChild(slideshowContent);
	debugStatusElement.innerText = 'waiting for new image to slide in';
	await nextEventFirePromise(slideshowContent, 'animationend');
	debugStatusElement.innerText = `showing this image for ${TIME_PER_IMAGE_MS/1000} seconds`;
	setTimeout(nextImage, TIME_PER_IMAGE_MS);

	lastImageContent = slideshowContent;
}


// let nextImageButton = document.createElement('button');
// nextImageButton.innerText = 'next image';
// nextImageButton.addEventListener('click', nextImage);
// document.body.appendChild(nextImageButton);

// nextImage();

nextImage();