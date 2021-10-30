import { dispatchCustomEvent, SlideshowPhaseEvent } from './events.js';
import { SlideshowMediaElement } from './mediaelements.js';
import { SlideshowEntryMetadata } from './slideshow_entry_metadata.js';
import { SlideshowTheme } from './slideshow_theme.js';
import { Nullable, querySelectorSafe } from './util.js';

export class SlideshowEntryController {
	mediaElement: SlideshowMediaElement;
	private _lastAnimation: Nullable<string> = null;
	contentRoot: HTMLElement;
	artistName: HTMLElement;
	wrapper: HTMLElement;
	private readonly theme: SlideshowTheme;

	// TODO maybe add a root: DocumentOrShadowRoot param that this will populate? or maybe have it set that up itself and return it? idk
	constructor(entry: SlideshowEntryMetadata, theme: SlideshowTheme) {
		this.theme = theme;

		// const templateInstance = <typeof template>template.cloneNode(true);  // we need to cast here b/c clonenode just returns a Node
		const templateInstance = this.theme.instanceTemplate();
		
		// get certain elements from template
		// TODO support multiple artist name elements?
		// TODO the queryselector stuff can probably be in SlideshowTheme now
		this.contentRoot = querySelectorSafe<this['contentRoot']>(templateInstance, '.slideshow_template_root');
		this.artistName = querySelectorSafe<this['artistName']>(templateInstance, '.slideshow_artist_name');
		const mediaPlaceholder = querySelectorSafe<Element>(templateInstance, '.slideshow_media_placeholder');
		
		this.mediaElement = entry.createMediaElement(this.contentRoot);
		
		// replace media placeholder with correct element
		mediaPlaceholder.replaceWith(this.mediaElement.element);
		// fill in artist name
		this.artistName.appendChild(this.mediaElement.artistNameDisplay);

		this.wrapper = document.createElement('div');
		this.wrapper.appendChild(this.contentRoot);
		// TODO outer script should handle this, not us
		slideshowContainer.appendChild(this.wrapper);

		this.wrapper.style.display = 'none';
	}

	async run(): Promise<void> {
		// wait for media to be loaded
		await this.mediaElement.isReady;
		
		// intro
		this.wrapper.style.display = 'unset';
		this._dispatchPhaseEvent('intro');
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_intro', this.theme.config.introAnimation);

		// idle
		this._dispatchPhaseEvent('idle');
		this._switchCurrentPhaseClass('slideshow_idle');
		await this.mediaElement.start();
		await this.mediaElement.isFinished;

		// outro
		this._dispatchPhaseEvent('outro');
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_outro', this.theme.config.outroAnimation);

		// cleanup
		this.wrapper.parentElement?.removeChild(this.wrapper);
	}

	private _dispatchPhaseEvent(phase: SlideshowPhaseEvent['detail']['phase']): void {
		dispatchCustomEvent(this.contentRoot, 'slideshowphase', {phase: phase});
	}
	
	// FIXME give this a better name
	private async _switchCurrentPhaseClassAndMaybeAnimate(className: string, animationName?: Nullable<string>): Promise<void> {
		let animCompletePromise: Nullable<Promise<void>> = null;
		if(animationName !== null && animationName !== undefined) animCompletePromise = this._awaitTemplateAnimationComplete(animationName);
		this._switchCurrentPhaseClass(className);
		if(animCompletePromise !== null) await animCompletePromise;
	}

	private _switchCurrentPhaseClass(className: string): void {
		if(this._lastAnimation !== null) this.contentRoot.classList.remove(this._lastAnimation);
		this.contentRoot.classList.add(className);
		this._lastAnimation = className;
	}

	private _awaitTemplateAnimationComplete(animationName: string): Promise<void> {
		const wrapper = this.wrapper;
		return new Promise<void>(function (resolve){
			function onAnimationEnd(e: AnimationEvent): void {
				if(e.animationName === animationName) resolve();
				else wrapper.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
			}
			wrapper.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
		});
	}
}
