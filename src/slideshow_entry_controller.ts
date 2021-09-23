class SlideshowEntryController {
	mediaElement: SlideshowMediaElement;
	private _lastAnimation: string | null;
	contentRoot: Element;
	artistName: HTMLElement;
	animationTimingReference: HTMLElement;
	wrapper: HTMLElement;
	currentState: 'INITIAL'|'ANIMATE_IN'|'IDLE'|'ANIMATE_OUT';  // TODO move this to an interface or typedef or smth?

	constructor(entry: SlideshowEntryMetadata) {
		this.mediaElement = entry.createMediaElement();  // FIXME give this a clearer name?
	
		this._lastAnimation = null;

		let templateInstance = <typeof template>template.cloneNode(true);  // we need to cast here b/c clonenode just returns a Node
		
		// get certain elements from template
		this.contentRoot = templateInstance.querySelector<this['contentRoot']>('[data-template-content-root]') || throwError('element not found');
		this.artistName = templateInstance.querySelector<this['artistName']>('[data-template-artist-name]') || throwError('element not found');
		this.animationTimingReference = templateInstance.querySelector<this['animationTimingReference']>('[data-template-animation-timing-reference]') || throwError('element not found');
		let mediaPlaceholder = templateInstance.querySelector<Element>('[data-template-media-placeholder]') || throwError('element not found');
		
		// replace media placeholder with correct element
		mediaPlaceholder.replaceWith(this.mediaElement.element);
		// fill in artist name
		this.artistName.appendChild(this.mediaElement.artistNameDisplay);

		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('slideshow_template_instance_wrapper');
		this.wrapper.appendChild(this.contentRoot);
		slideshowContainer.appendChild(this.wrapper);

		this.currentState = 'INITIAL';
		this.wrapper.style.display = 'none';
	}

	async animateIn() {
		if(this.currentState != 'INITIAL') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'ANIMATE_IN';
		await this.mediaElement.isReady;
		this.wrapper.style.display = 'unset';
		await this._animateGeneric('slideshow_slide_in');
	}
	animateOut() {
		if(this.currentState != 'IDLE') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'ANIMATE_OUT';
		return this._animateGeneric('slideshow_slide_out');
	}

	async idle() {
		if(this.currentState != 'ANIMATE_IN') throw new Error(`invalid state "${this.currentState}"`);
		this.currentState = 'IDLE';
		await this.mediaElement.start();
		await this.mediaElement.isFinished;
	}
	
	_animateGeneric(className: string) {
		if(this._lastAnimation != null) this.contentRoot.classList.remove(this._lastAnimation);
		this.contentRoot.classList.add(className);
		this._lastAnimation = className;
		const animationTimingReference = this.animationTimingReference;
		return new Promise<void>(function(resolve, reject) {
			function onAnimationEnd(e: AnimationEvent){
				if(e.target == animationTimingReference) resolve();
				else animationTimingReference.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
			}
			animationTimingReference.addEventListener('animationend', onAnimationEnd, {once: true, passive: true});
		});
	}

	destroy() {
		(this.wrapper.parentElement || throwError()).removeChild(this.wrapper);
	}
}
