let template: HTMLElement;
let slideshowContainer: HTMLElement;
let controlsPanel: HTMLElement;

let themeConfig: JSONDataThemeConfig;
let imagesList: Array<SlideshowEntryMetadata>; // TODO maybe factor these into an images list manager class? (might make implementing shuffle mode easier)
let imagesListIndex: number;

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

// TODO move to another file
async function _fetchSafeNocache(path: string, options?: RequestInit): Promise<Response> {
	const response = await fetch(path, options);
	assert(response.ok, templateFancyDefer`file ${path} failed to load (${response.status} ${response.statusText})`);
	return response;
}
async function fetchTextSafe(path: string, options?: RequestInit): Promise<string> {
	const response = await _fetchSafeNocache(path, options);
	return await response.text();
}
async function fetchJSONSafe(path: string, options?: RequestInit): Promise<unknown> {
	const response = await _fetchSafeNocache(path, options);
	const responseData: unknown = await response.json();
	return responseData;
}

/** second stage of initializaiton, sets up stuff that depends on outside files */
async function init(): Promise<void> {
	const urlParams = (new URL(window.location.href)).searchParams;
	const themeUrlParam = urlParams.get('theme');
	if(themeUrlParam === null) throw new Error('theme not specified');
	const themePath = `themes/${themeUrlParam}`;

	await Promise.all([
		// load images list
		async (): Promise<void> => {
			const data = await fetchJSONSafe('images.json', {cache: 'no-cache'});
			assert(Array.isArray(data));
			imagesList = data.map(createSlideshowEntryMetadata);
		},
		// load theme config
		async (): Promise<void> => {
			const data = await fetchJSONSafe(`${themePath}/theme_config.json`, {cache: 'no-cache'});
			_assertIsJSONDataThemeConfig(data);
			themeConfig = data;
		},
		// load theme template html
		async (): Promise<void> => {
			template.innerHTML = await fetchTextSafe(`${themePath}/slideshow_template.html`, {cache: 'no-cache'});
		},
		// load theme stylesheet
		async (): Promise<void> => {
			const templateStylesheet = document.createElement('style');
			document.head.appendChild(templateStylesheet);
			templateStylesheet.innerHTML = await fetchTextSafe(`${themePath}/slideshow_theme.css`, {cache: 'no-cache'});
		},
		// load theme script
		async (): Promise<void> => {
			const templateScript = document.createElement('script');
			document.head.appendChild(templateScript);
			templateScript.innerHTML = await fetchTextSafe(`${themePath}/slideshow_script.js`, {cache: 'no-cache'});
		},
	]);
}

function getNextEntry(): SlideshowEntryMetadata {
	const ret = imagesList[imagesListIndex];
	imagesListIndex++;
	if(imagesListIndex >= imagesList.length) imagesListIndex = 0;
	return ret;
}

async function run(): Promise<never> {
	let nextImage: SlideshowEntryController = getNextEntry().createInstance();
	// we're displaying each image one at a time, so in this specific case we don't want to run these promises in parallel
	/* eslint-disable no-await-in-loop */
	while(true) {
		// instance the entry after the current one as early as possible so they can load before we need them (if we did it right before it had to be displayed it would probably freeze for a bit)
		const currentImage = nextImage;
		nextImage = getNextEntry().createInstance();

		// TODO maybe all these calls should just be handled by a SlideshowEntryController.run(): Promise<void> or something like that?
		await currentImage.getReady();
		await currentImage.animateIn();
		await currentImage.idle();
		await currentImage.animateOut();
		currentImage.destroy();
	}
	/* eslint-enable no-await-in-loop */
}

async function main(): Promise<void> {
	preInit();
	await init();
	await run();
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener('DOMContentLoaded', main);
