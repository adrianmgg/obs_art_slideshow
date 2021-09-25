class SlideshowEntryController {
	mediaElement: SlideshowMediaElement;
	private _lastAnimation: string | null;
	contentRoot: HTMLElement;
	artistName: HTMLElement;
	wrapper: HTMLElement;

	constructor(entry: SlideshowEntryMetadata) {
		this.mediaElement = entry.createMediaElement();  // FIXME give this a clearer name?
	
		this._lastAnimation = null;

		let templateInstance = <typeof template>template.cloneNode(true);  // we need to cast here b/c clonenode just returns a Node
		
		// get certain elements from template
		// TODO support multiple artist name elements?
		this.contentRoot = templateInstance.querySelector<this['contentRoot']>('.slideshow_template_root') || throwError('no element found in template with class slideshow_template_root');
		this.artistName = templateInstance.querySelector<this['artistName']>('.slideshow_artist_name') || throwError('no element found in template with class slideshow_artist_name');
		let mediaPlaceholder = templateInstance.querySelector<Element>('.slideshow_media_placeholder') || throwError('no element found in template with class slideshow_media_placeholder');
		
		// replace media placeholder with correct element
		mediaPlaceholder.replaceWith(this.mediaElement.element);
		// fill in artist name
		this.artistName.appendChild(this.mediaElement.artistNameDisplay);

		this.wrapper = document.createElement('div');
		this.wrapper.appendChild(this.contentRoot);
		slideshowContainer.appendChild(this.wrapper);

		this.wrapper.style.display = 'none';
	}

	async animateIn() {
		await this.mediaElement.isReady;
		this.wrapper.style.display = 'unset';
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_intro', themeConfig.introAnimation);
	}

	async idle() {
		this._switchCurrentPhaseClass('slideshow_idle');
		await this.mediaElement.start();
		await this.mediaElement.isFinished;
	}

	async animateOut() {
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_outro', themeConfig.outroAnimation);
	}
	
	// FIXME give this a better name
	async _switchCurrentPhaseClassAndMaybeAnimate(className: string, animationName: Nullable<string>) {
		let animCompletePromise: Nullable<Promise<void>> = null;
		if(animationName != null) animCompletePromise = this._awaitTemplateAnimationComplete(animationName);
		this._switchCurrentPhaseClass(className);
		if(animCompletePromise != null) await animCompletePromise;
	}

	_switchCurrentPhaseClass(className: string) {
		if(this._lastAnimation != null) this.contentRoot.classList.remove(this._lastAnimation);
		this.contentRoot.classList.add(className);
		this._lastAnimation = className;
	}

	_awaitTemplateAnimationComplete(animationName: string): Promise<void> {
		const wrapper = this.wrapper;
		return new Promise<void>(function(resolve, reject){
			function onAnimationEnd(e: AnimationEvent) {
				if(e.animationName === animationName) resolve();
				else wrapper.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
			}
			wrapper.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
		});
	}

	destroy() {
		this.wrapper.parentElement!.removeChild(this.wrapper);
	}
}
