import { EntryMetadata } from './jsondata';
import { dispatchCustomEvent, SlideshowPhaseEvent } from './events';
import { create_media_element } from './mediaelements';
import { querySelectorSafe, specificAnimationCompletePromise } from './util';
import { Globals } from './misc';

async function slideshow_phase_transition_helper(
	targetElem: HTMLElement,
	phaseClass: string,
	prevPhaseClass: string | null,
	phaseEventType: SlideshowPhaseEvent['detail']['phase'],
	animationName?: string | null
): Promise<void> {
	dispatchCustomEvent(targetElem, 'slideshowphase', {phase: phaseEventType});
	let animCompletePromise: Promise<void> | null = null;
	if(animationName !== null && animationName !== undefined) animCompletePromise = specificAnimationCompletePromise(targetElem, animationName);
	if(prevPhaseClass !== null) targetElem.classList.remove(prevPhaseClass);
	targetElem.classList.add(phaseClass);
	if(animCompletePromise !== null) await animCompletePromise;
}

/** outer promise is for if loaded, function is to add to dom as child of target, inner promise is for when complete */
export async function entrycontroller_preload(globals: Globals, meta: EntryMetadata): Promise<(target: Node) => Promise<void>> {
	const contentRoot = globals.theme.template.cloneNode(true) as typeof globals.theme.template;

	// get certain elements from template
	// TODO support multiple artist name elements?
	// TODO the queryselector stuff can probably be in SlideshowTheme now
	const artistName: HTMLElement = querySelectorSafe(contentRoot, '.slideshow_artist_name');
	const mediaPlaceholder: Element = querySelectorSafe(contentRoot, '.slideshow_media_placeholder');

	artistName.textContent = meta.credit;

	const mediaElementLoading = create_media_element(globals, meta);

	return async (target: Node) => {
		// add to dom
		target.appendChild(contentRoot);
		// wait for media to finish loading, and add it to the dom
		const mediaElementPlay = (await mediaElementLoading)(mediaPlaceholder);
		// intro
		await slideshow_phase_transition_helper(contentRoot, 'slideshow_intro', null, 'intro', globals.theme.config.introAnimation);
		// idle
		await slideshow_phase_transition_helper(contentRoot, 'slideshow_idle', 'slideshow_intro', 'idle');
		await mediaElementPlay();
		// outro
		await slideshow_phase_transition_helper(contentRoot, 'slideshow_outro', 'slideshow_idle', 'outro', globals.theme.config.outroAnimation);
		// cleanup
		target.removeChild(contentRoot);
	};
}

