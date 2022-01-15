import { create } from '@amgg/elhelper';
import { ThemeConfig, isThemeConfig } from './jsondata';
import { assert, fetchJSONSafe, fetchTextSafe, querySelectorSafe } from './util';

// TODO? https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template

/*
DocumentFragment
 - "represents a minimal document object that has no parent"
DOMParser
ShadowRoot
<template>
*/

export interface SlideshowTheme {
	readonly config: ThemeConfig;
	readonly template: HTMLElement;
	readonly style: HTMLStyleElement;
	readonly script: HTMLScriptElement;
}

export async function loadTheme(basePath: string): Promise<SlideshowTheme> {
	const [config, template, style, script] = await Promise.all([
		// load theme config
		(async function loadThemeConfig(): Promise<ThemeConfig> {
			const data = await fetchJSONSafe(`${basePath}/theme_config.json`, {cache: 'no-cache'});
			assert(isThemeConfig(data), 'problem in theme_config.json');  // TODO errors for this should be a lot more specific
			return data;
		})(),
		// load theme template html
		(async function loadThemeHTML(): Promise<HTMLElement> {
			// template.innerHTML = await fetchTextSafe(`${basePath}/slideshow_template.html`, {cache: 'no-cache'});
			// TODO implement
			const template = create('template', {
				innerHTML: await fetchTextSafe(`${basePath}/slideshow_template.html`, {cache: 'no-cache'}),
			});
			return querySelectorSafe<HTMLElement>(template.content, '.slideshow_template_root');
		})(),
		// load theme stylesheet
		(async function loadThemeCSS(): Promise<HTMLStyleElement> {
			const templateStylesheet = document.createElement('style');
			document.head.appendChild(templateStylesheet);
			return create('style', {
				textContent: await fetchTextSafe(`${basePath}/slideshow_theme.css`, {cache: 'no-cache'}),
			});
		})(),
		// load theme script
		// TODO currently just storing this as a string - is there a better way to do this
		(async function loadThemeJS(): Promise<HTMLScriptElement> {
			return create('script', {
				innerHTML: await fetchTextSafe(`${basePath}/slideshow_script.js`, {cache: 'no-cache'})
			});
		})(),
	]);
	return Object.freeze({ config, template, style, script });
}

