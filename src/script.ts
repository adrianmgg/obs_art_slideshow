let template: HTMLElement;
let slideshowContainer: HTMLElement;
let controlsPanel: HTMLElement;

let themeConfig: JSONDataThemeConfig;
let entriesManager: SlideshowEntryManager;

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
	const themeUrlParam = urlParams.get('theme');
	assert(themeUrlParam !== null, 'theme not specified');
	const themePath = `themes/${themeUrlParam}`;
	const entriesManagerClass = getEntriesManagerClass(urlParams.get('entries_manager'));

	await Promise.all([
		// load images list
		(async function loadImagesList(): Promise<void> {
			const data = await fetchJSONSafe('images.json', {cache: 'no-cache'});
			assert(Array.isArray(data));
			entriesManager = new entriesManagerClass(data.map(createSlideshowEntryMetadata));
		})(),
		// load theme config
		(async function loadThemeConfig(): Promise<void> {
			const data = await fetchJSONSafe(`${themePath}/theme_config.json`, {cache: 'no-cache'});
			_assertIsJSONDataThemeConfig(data);
			themeConfig = data;
		})(),
		// load theme template html
		(async function loadThemeHTML(): Promise<void> {
			template.innerHTML = await fetchTextSafe(`${themePath}/slideshow_template.html`, {cache: 'no-cache'});
		})(),
		// load theme stylesheet
		(async function loadThemeCSS(): Promise<void> {
			const templateStylesheet = document.createElement('style');
			document.head.appendChild(templateStylesheet);
			templateStylesheet.innerHTML = await fetchTextSafe(`${themePath}/slideshow_theme.css`, {cache: 'no-cache'});
		})(),
		// load theme script
		(async function loadThemeJS(): Promise<void> {
			const templateScript = document.createElement('script');
			document.head.appendChild(templateScript);
			templateScript.innerHTML = await fetchTextSafe(`${themePath}/slideshow_script.js`, {cache: 'no-cache'});
		})(),
	]);
}

async function run(): Promise<never> {
	let nextImage: SlideshowEntryController = entriesManager.nextEntry().createInstance();
	// we're displaying each image one at a time, so in this specific case we don't want to run these promises in parallel
	/* eslint-disable no-await-in-loop */
	while(true) {
		const currentImage = nextImage;
		// instance the next image before running the current one, to give it more time to load
		nextImage = entriesManager.nextEntry().createInstance();
		await currentImage.run();
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
