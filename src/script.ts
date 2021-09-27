const template = document.getElementById('slideshow_template') || throwError('element not found');
const slideshowContainer = document.getElementById('slideshow_container') || throwError('element not found');

let themeConfig: JSONDataThemeConfig;

let imagesList: Array<SlideshowEntryMetadata>;
let imagesListIndex: number;

let lastImage: Nullable<SlideshowEntryController> = null;
async function nextImage() {
	let currentImage = imagesList[imagesListIndex].createInstance();
	
	if(lastImage != null) {
		await lastImage.animateOut();
		lastImage.destroy();
		lastImage = null;
	}

	await currentImage.getReady();

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
	// load theme script
	let templateScriptContents = await fetch(`${themePath}/slideshow_script.js`, {cache: 'no-cache'}).then(response=>response.text());
	if(templateScriptContents != null) {
		let templateScript = document.createElement('script');
		document.head.appendChild(templateScript);
		templateScript.innerHTML = templateScriptContents;
	}
	// start slideshow
	nextImage();
})();
