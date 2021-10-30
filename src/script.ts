import { initGlobalErrorHandlers } from './error_handler.js';
import { getEntriesManagerClass, SlideshowEntryManager } from './image_list_manager.js';
import { ThemeConfig, _assertIsJSONDataThemeConfig } from './jsondata.js';
import { SlideshowEntryController } from './slideshow_entry_controller.js';
import { createSlideshowEntryMetadata } from './slideshow_entry_metadata.js';
import { SlideshowTheme } from './slideshow_theme.js';
import { assert, fetchJSONSafe, fetchTextSafe, getElementByIdSafe } from './util.js';

let template: HTMLElement;
let slideshowContainer: HTMLElement;
let controlsPanel: HTMLElement;

// let themeConfig: JSONDataThemeConfig;
let entriesManager: SlideshowEntryManager;
let theme: SlideshowTheme;

async function init(): Promise<void> {
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

	const urlParams = (new URL(window.location.href)).searchParams;
	const themeUrlParam = urlParams.get('theme');
	assert(themeUrlParam !== null, 'theme not specified');
	const themePath = `themes/${themeUrlParam}`;
	const entriesManagerClass = getEntriesManagerClass(urlParams.get('entries_manager')); // TODO should rename this to 'order' or something

	[entriesManager, theme] = await Promise.all([
		// load images list
		(async function loadImagesList(): Promise<SlideshowEntryManager> {
			const data = await fetchJSONSafe('images.json', {cache: 'no-cache'});
			// TODO the isarray & map should be factored out to a helper in another file
			assert(Array.isArray(data));
			return new entriesManagerClass(data.map(createSlideshowEntryMetadata));
		})(),
		// load theme
		SlideshowTheme.loadTheme(themePath),
	]);
}

async function run(): Promise<never> {
	let nextImage: SlideshowEntryController = new SlideshowEntryController(entriesManager.nextEntry(), theme);
	// we're displaying each image one at a time, so in this specific case we don't want to run these promises in parallel
	/* eslint-disable no-await-in-loop */
	while(true) {
		const currentImage = nextImage;
		// instance the next image before running the current one, to give it more time to load
		nextImage = new SlideshowEntryController(entriesManager.nextEntry(), theme);
		await currentImage.run();
	}
	/* eslint-enable no-await-in-loop */
}

async function main(): Promise<void> {
	await init();
	await run();
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener('DOMContentLoaded', main);
