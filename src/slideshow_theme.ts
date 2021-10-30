import { ThemeConfig, _assertIsJSONDataThemeConfig } from './jsondata';
import { fetchJSONSafe, fetchTextSafe } from './util';

// TODO? https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template

/*
DocumentFragment
 - "represents a minimal document object that has no parent"
DOMParser
ShadowRoot
<template>
*/

export class SlideshowTheme {
	// private readonly templateElement: HTMLElement;
	public readonly config: Readonly<ThemeConfig>;

	private constructor(config: ThemeConfig, _template: HTMLElement, _style: string, _script: string) {
		this.config = config;
	}

	public instanceTemplate(): HTMLElement {
		// TODO implement
		return document.createElement('div');
	}

	static async loadTheme(basePath: string): Promise<SlideshowTheme> {
		const [config, template, style, script] = await Promise.all([
			// load theme config
			(async function loadThemeConfig(): Promise<ThemeConfig> {
				const data = await fetchJSONSafe(`${basePath}/theme_config.json`, {cache: 'no-cache'});
				_assertIsJSONDataThemeConfig(data);
				return data;
			})(),
			// load theme template html
			(async function loadThemeHTML(): Promise<HTMLElement> {
				// template.innerHTML = await fetchTextSafe(`${basePath}/slideshow_template.html`, {cache: 'no-cache'});
				// TODO implement
				await fetchTextSafe(`${basePath}/slideshow_template.html`, {cache: 'no-cache'});
				return document.createElement('div');
			})(),
			// load theme stylesheet
			// TODO currently just storing this as a string - is there a better way to do this
			(async function loadThemeCSS(): Promise<string> {
				const templateStylesheet = document.createElement('style');
				document.head.appendChild(templateStylesheet);
				return await fetchTextSafe(`${basePath}/slideshow_theme.css`, {cache: 'no-cache'});
			})(),
			// load theme script
			// TODO same as above
			(async function loadThemeJS(): Promise<string> {
				const templateScript = document.createElement('script');
				document.head.appendChild(templateScript);
				return await fetchTextSafe(`${basePath}/slideshow_script.js`, {cache: 'no-cache'});
			})(),
		]);
		// TODO maybe just splat the promise.all into the constructor?
		const theme = new SlideshowTheme(config, template, style, script);
		return theme;
	}
}
