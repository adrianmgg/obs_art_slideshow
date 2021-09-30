class SlideshowEntryController {
	mediaElement: SlideshowMediaElement;
	private _lastAnimation: string | null;
	contentRoot: HTMLElement;
	artistName: HTMLElement;
	wrapper: HTMLElement;

	constructor(entry: SlideshowEntryMetadata) {
		this.mediaElement = entry.createMediaElement();  // FIXME give this a clearer name?

		this._lastAnimation = null;

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

	async getReady(): Promise<void> {  // TODO rename this
		await this.mediaElement.isReady;
	}

	async animateIn(): Promise<void> {
		this.wrapper.style.display = 'unset';
		this._dispatchPhaseEvent('intro');
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_intro', themeConfig.introAnimation);
	}

	async idle(): Promise<void> {
		this._dispatchPhaseEvent('idle');
		this._switchCurrentPhaseClass('slideshow_idle');
		await this.mediaElement.start();
		await this.mediaElement.isFinished;
	}

	async animateOut(): Promise<void> {
		this._dispatchPhaseEvent('outro');
		await this._switchCurrentPhaseClassAndMaybeAnimate('slideshow_outro', themeConfig.outroAnimation);
	}

	_dispatchPhaseEvent(phase: string): void {
		this._dispatchCustomEvent('slideshow_phase', {phase: phase});
	}

	_dispatchCustomEvent<T>(eventName: string, detail: T): void {
		this.contentRoot.dispatchEvent(new CustomEvent<T>(eventName, {
			bubbles: true,
			detail: detail,
		}));
	}
	
	// FIXME give this a better name
	async _switchCurrentPhaseClassAndMaybeAnimate(className: string, animationName: Nullable<string>): Promise<void> {
		let animCompletePromise: Nullable<Promise<void>> = null;
		if(animationName !== null) animCompletePromise = this._awaitTemplateAnimationComplete(animationName);
		this._switchCurrentPhaseClass(className);
		if(animCompletePromise !== null) await animCompletePromise;
	}

	_switchCurrentPhaseClass(className: string): void {
		if(this._lastAnimation !== null) this.contentRoot.classList.remove(this._lastAnimation);
		this.contentRoot.classList.add(className);
		this._lastAnimation = className;
	}

	_awaitTemplateAnimationComplete(animationName: string): Promise<void> {
		const wrapper = this.wrapper;
		return new Promise<void>(function (resolve){
			function onAnimationEnd(e: AnimationEvent): void {
				if(e.animationName === animationName) resolve();
				else wrapper.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
			}
			wrapper.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
		});
	}

	destroy(): void {
		this.wrapper.parentElement?.removeChild(this.wrapper);
	}
}
