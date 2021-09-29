let template: HTMLElement;
let slideshowContainer: HTMLElement;
let controlsPanel: HTMLElement;

let themeConfig: JSONDataThemeConfig;
let imagesList: Array<SlideshowEntryMetadata>; // TODO maybe factor these into an images list manager class? (might make implementing shuffle mode easier)
let imagesListIndex: number;
let lastImage: Nullable<SlideshowEntryController> = null;

/** first stage of initialization, sets up stuff that just depends on the base index.html */
function preInit(): void {
	initGlobalErrorHandlers();
	template = getElementByIdSafe('slideshow_template');
	slideshowContainer = getElementByIdSafe('slideshow_container');
	controlsPanel = getElementByIdSafe('slideshow_controls');

	// TODO probably move controls panel stuff to another file and/or a class
	document.addEventListener('mouseenter', function () {
		controlsPanel.classList.add('visible');
	});
	document.addEventListener('mouseleave', function () {
		controlsPanel.classList.remove('visible');
	});
}

/** second stage of initializaiton, sets up stuff that depends on outside files */
async function init(): Promise<void> {
	const urlParams = (new URL(window.location.href)).searchParams;
	let themeUrlParam = urlParams.get('theme');
	if(themeUrlParam === null) throw new Error('theme not specified');
	let themePath = `themes/${themeUrlParam}`;
	// load images list
	// imagesList = (await fetch('images.json', {cache: 'no-cache'}).then(response=>response.json())).map((x: JSONDataEntry)=>createSlideshowEntryMetadata(x));
	imagesList = await (async function (){
		const response = await fetch('images.json', {cache: 'no-cache'});
		assert(response.ok, 'images.json failed to load. is it missing?');
		const responseData: unknown = await response.json();
		assert(Array.isArray(responseData), 'outer level of images.json must be an array');
		return responseData.map(createSlideshowEntryMetadata);
	})();
	imagesListIndex = 0;
	// load theme config
	// themeConfig = await fetch(`${themePath}/theme_config.json`, {cache: 'no-cache'}).then(response=>response.json());
	themeConfig = await (async function (){
		const response = await fetch(`${themePath}/theme_config.json`, {cache: 'no-cache'});
		assert(response.ok, `theme config ("${themePath}/theme_config.json") failed to load. is it missing?`);
		const responseData: unknown = await response.json();
		_assertIsJSONDataThemeConfig(responseData);
		return responseData;
	})();
	// TODO improve error checking/reporting for these:
	// load theme template html
	let templateContents = await fetch(`${themePath}/slideshow_template.html`, {cache: 'no-cache'}).then(response=>response.text());
	template.innerHTML = templateContents;
	// load theme stylesheet
	let templateStylesheet = document.createElement('style');
	document.head.appendChild(templateStylesheet);
	templateStylesheet.innerHTML = await fetch(`${themePath}/slideshow_theme.css`, {cache: 'no-cache'}).then(response=>response.text());
	// load theme script
	let templateScript = document.createElement('script');
	document.head.appendChild(templateScript);
	templateScript.innerHTML = await fetch(`${themePath}/slideshow_script.js`, {cache: 'no-cache'}).then(response=>response.text());
}

async function nextImage(): Promise<void> {
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

async function main(): Promise<void> {
	preInit();
	await init();
	void nextImage();
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener('DOMContentLoaded', main);
