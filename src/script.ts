import { initGlobalErrorHandlers } from './error_handler';
import { entrycontroller_preload } from './slideshow_entry_controller';
import { entry_meta_list_managers, EntryMetaListManager } from './entrylist';
import { loadTheme } from './slideshow_theme';
import { assert, fetchJSONSafe, getElementByIdSafe, templateFancyDefer } from './util';
import { isEntryMetadata } from './jsondata';
import { Globals } from './misc';
import { dispatchCustomEvent } from './events';
import { setup_option_gui } from './option_gui';

async function main(): Promise<void> {
	let slideshowContainer: HTMLElement;
	let controlsPanel: HTMLElement;

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

	const [entriesManager, theme, userThemeOptions] = await Promise.all([
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
		// load user's overrides for the theme options, if specified
		(async function loadUserThemeOptions(): Promise<Record<string, string>> {
			const themeOptionsFile = urlParams.get('theme_options');
			if(themeOptionsFile !== null) {
				// TODO write validator
				return await fetchJSONSafe(themeOptionsFile, {cache: 'no-cache'}) as Record<string, string>;
			}
			else return {};
		})(),
	]);


	const finalThemeOptions = {
		...Object.fromEntries(Object.entries(theme.optionsInfo).map(([k,v])=>[k,v?.default])),
		...userThemeOptions,
	};


	const slideshowContainerShadow = slideshowContainer.attachShadow({mode:'open'});
	slideshowContainerShadow.appendChild(theme.style);
	slideshowContainerShadow.appendChild(theme.script);

	// TODO what do if sheet is null?
	// TODO theres so many !s i rly gotta make this cleaner
	// TODO assert the type rather than casting
	// TODO probably move this to a helper function
	// TODO wow thats a lot of TODOs lmao
	const rootRule: CSSStyleRule = theme.style.sheet!.cssRules[theme.style.sheet!.insertRule(':host{}', theme.style.sheet!.cssRules.length)]! as CSSStyleRule;
	
	// pass options in via css vars
	for(const k in finalThemeOptions) {
		rootRule.style.setProperty(`--option-${k}`, String(finalThemeOptions[k]));
	}

	dispatchCustomEvent(document, 'slideshowinit', {
		root: slideshowContainerShadow,
	});

	const globals: Globals = Object.freeze({
		theme,
		themeOptions: finalThemeOptions,
		themeRootRule: rootRule,
	});

	setup_option_gui(globals, getElementByIdSafe('slideshow_controls'));

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

