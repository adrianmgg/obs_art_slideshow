import { initGlobalErrorHandlers } from './error_handler';
import { entrycontroller_preload } from './slideshow_entry_controller';
import { entry_meta_list_managers, EntryMetaListManager } from './entrylist';
import { loadTheme, SlideshowTheme } from './slideshow_theme';
import { assert, fetchJSONSafe, getElementByIdSafe, templateFancyDefer } from './util';
import { isEntryMetadata } from './jsondata';
import { Globals } from './misc';
import { dispatchCustomEvent } from './events';

async function main(): Promise<void> {
	let slideshowContainer: HTMLElement;
	let controlsPanel: HTMLElement;

	let entriesManager: EntryMetaListManager;
	let theme: SlideshowTheme;

	initGlobalErrorHandlers();
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
	// TODO should rename this to 'order' or something
	// TODO should have default url params in one place rather than doing this
	const entryManagerName = urlParams.get('entries_manager') ?? 'standard'; 
	const entryMetaManager = entry_meta_list_managers[entryManagerName];
	assert(entryMetaManager !== undefined, templateFancyDefer`unknown entry manager ${entryManagerName}, valid values are ${Object.keys(entry_meta_list_managers)}`);

	[entriesManager, theme] = await Promise.all([
		// load images list
		(async function loadImagesList(): Promise<EntryMetaListManager> {
			const data = await fetchJSONSafe('images.json', {cache: 'no-cache'});
			// TODO should the isarray & map should be factored out to a helper in another file?
			assert(Array.isArray(data));
			assert(data.every(isEntryMetadata));
			return entryMetaManager(data);
		})(),
		// load theme
		loadTheme(themePath),
	]);

	
	const slideshowContainerShadow = slideshowContainer.attachShadow({mode:'open'});
	slideshowContainerShadow.appendChild(theme.style);
	slideshowContainerShadow.appendChild(theme.script);


	dispatchCustomEvent(document, 'slideshowinit', {
		root: slideshowContainerShadow,
	});


	const globals: Globals = Object.freeze({
		theme,
	});


	let nextEntry = entrycontroller_preload(globals, entriesManager.next().value);
	// we're displaying each image one at a time, so in this specific case we don't want to run these promises in parallel
	/* eslint-disable no-await-in-loop */
	for(const entry of entriesManager) {
		const currentEntry = nextEntry;
		// start loading the next one as early as possible
		nextEntry = entrycontroller_preload(globals, entry);
		// make sure the current one is loaded it's finished loading, then display it, and wait for it to be done displaying
		await (await currentEntry)(slideshowContainerShadow);
	}
	/* eslint-enable no-await-in-loop */
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener('DOMContentLoaded', main);

