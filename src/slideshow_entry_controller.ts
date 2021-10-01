class SlideshowEntryController {
	mediaElement: SlideshowMediaElement;
	private _lastAnimation: Nullable<string> = null;
	contentRoot: HTMLElement;
	artistName: HTMLElement;
	wrapper: HTMLElement;

	constructor(entry: SlideshowEntryMetadata) {
		this.mediaElement = entry.createMediaElement();  // FIXME give this a clearer name?

		const templateInstance = <typeof template>template.cloneNode(true);  // we need to cast here b/c clonenode just returns a Node
		
		// get certain elements from template
		// TODO support multiple artist name elements?
		this.contentRoot = querySelectorSafe<this['contentRoot']>(templateInstance, '.slideshow_template_root');
		this.artistName = querySelectorSafe<this['artistName']>(templateInstance, '.slideshow_artist_name');
		const mediaPlaceholder = querySelectorSafe<Element>(templateInstance, '.slideshow_media_placeholder');
		
		// replace media placeholder with correct element
		mediaPlaceholder.replaceWith(this.mediaElement.element);
		// fill in artist name
		this.artistName.appendChild(this.mediaElement.artistNameDisplay);

		this.wrapper = document.createElement('div');
		this.wrapper.appendChild(this.contentRoot);
		slideshowContainer.appendChild(this.wrapper);

		this.wrapper.style.display = 'none';
	}

	async run(): Promise<void> {
		// wait for media to be loaded
		await this.mediaElement.isReady;
		// media loaded event
		// TODO groups should fire this (or maybe fire a different one, but they shouldnt do nothing)
		this._dispatchCustomEvent('slideshow_media_loaded', {media: this.mediaElement.element});
		
		// intro
		this.wrapper.style.display = 'unset';
		this._dispatchPhaseEvent('intro');
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_intro', themeConfig.introAnimation);

		// idle
		this._dispatchPhaseEvent('idle');
		this._switchCurrentPhaseClass('slideshow_idle');
		await this.mediaElement.start();
		await this.mediaElement.isFinished;

		// outro
		this._dispatchPhaseEvent('outro');
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_outro', themeConfig.outroAnimation);

		// cleanup
		this.wrapper.parentElement?.removeChild(this.wrapper);
	}

	private _dispatchPhaseEvent(phase: string): void {
		this._dispatchCustomEvent('slideshow_phase', {phase: phase});
	}

	private _dispatchCustomEvent<T>(eventName: string, detail: T): void {
		this.contentRoot.dispatchEvent(new CustomEvent<T>(eventName, {
			bubbles: true,
			detail: detail,
		}));
	}
	
	// FIXME give this a better name
	private async _switchCurrentPhaseClassAndMaybeAnimate(className: string, animationName: Nullable<string>): Promise<void> {
		let animCompletePromise: Nullable<Promise<void>> = null;
		if(animationName !== null) animCompletePromise = this._awaitTemplateAnimationComplete(animationName);
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
