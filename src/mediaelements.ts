import { MediaPart } from './jsondata';
import { Globals } from './misc';
import { assert, nextEventFirePromise, waitMS } from './util';
import { create } from '@amgg/elhelper';

/**
 * outer promise resolves when the media is ready to display, and resolves with a function,
 *   call that when you want to actually display the element, it will return another promise,
 *   which resolves when the media is done displaying, and resolves with an element,
 *   which will be whatever's currently in the spot where your placeholder was.
 */
// TODO maybe use a generator instead for this
export async function create_media_element(globals: Globals, meta: MediaPart): Promise<(placeholder: Element) => () => Promise<Element>> {
	if('group' in meta) {
		// preload first element
		let curr: ReturnType<typeof create_media_element> | null = create_media_element(globals, meta.group[0]!);
		// TODO handle empty group
		const addFirst = await curr;
		return (placeholder: Element) => {
			let currElem = placeholder;
			const playFirst = addFirst(currElem);
			return async () => {
				await playFirst();
				for(let i = 1; i < meta.group.length; i++) {
					// preload next (if any)
					let nextMeta = meta.group[i];
					let next = (nextMeta === undefined) ? null : create_media_element(globals, nextMeta);
					// make sure curr is finished loading & then display it
					currElem = await (await curr!)(currElem)();
					//
					curr = next;
				}
				return currElem;
			}
		}
	}
	else if('image' in meta) {
		const img = create('img', {
			src: meta.image,
		});
		await nextEventFirePromise(img, 'load', 'error');
		return (placeholder: Element) => {
			placeholder.replaceWith(img);
			return async () => {
				await waitMS(globals.theme.config.imageIdleTime * 1000);
				return img;
			}
		};
	}
	else if('video' in meta) {
		const vid = create('video', {
			muted: true, autoplay: false,
			src: meta.video,
			classList: [ 'imperceptible_jitter' ],
		});
		await nextEventFirePromise(vid, 'loadeddata', 'error');
		return (placeholder: Element) => {
			placeholder.replaceWith(vid);
			return async () => {
				await vid.play();
				await nextEventFirePromise(vid, 'ended');
				return vid;
			}
		};
	}
	assert(false, 'should be unreachable'); // TODO better message
}

