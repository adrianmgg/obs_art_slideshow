import { assert, randomIntBetween, templateFancyDefer } from './util.js';
import { SlideshowEntryMetadata } from './slideshow_entry_metadata.js';

interface SlideshowEntryManagerConstructor {
	new (images: SlideshowEntryMetadata[]): SlideshowEntryManager;
}

// TODO should rename these to make it more clear that they manage the overall list of entries, not just a single entry

export abstract class SlideshowEntryManager { // TODO should probably be an interface
	abstract nextEntry(): SlideshowEntryMetadata;
}

// TODO should these be classes?

class SlideshowEntryManagerStandard extends SlideshowEntryManager {
	private readonly _images: SlideshowEntryMetadata[];
	private _index: number;
	
	constructor(images: SlideshowEntryMetadata[]) {
		super();
		this._images = images;
		this._index = 0;
	}

	nextEntry(): SlideshowEntryMetadata {
		const ret = this._images[this._index];
		assert(ret !== undefined);
		this._index++;
		if(this._index >= this._images.length) this._index = 0;
		return ret;
	}
}

class SlideshowEntryManagerRandom extends SlideshowEntryManager {
	private _images: SlideshowEntryMetadata[];
	private _index: number;

	constructor(images: SlideshowEntryMetadata[]) {
		super();
		this._images = images;
		this._index = 0;
		this._shuffle();
	}

	nextEntry(): SlideshowEntryMetadata {
		const ret = this._images[this._index];
		assert(ret !== undefined);
		this._index++;
		if(this._index >= this._images.length) {
			this._index = 0;
			this._shuffle();
		}
		return ret;
	}

	// https://en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
	private _shuffle(): void {
		for(let i = this._images.length - 1; i >= 1; i--) {
			const idx = randomIntBetween(0, i);
			const temp = this._images[i]!;
			this._images[i] = this._images[idx]!;
			this._images[idx] = temp;
		}
	}
}

const _slideshowEntryManagerClasses: Record<string, SlideshowEntryManagerConstructor> = {
	standard: SlideshowEntryManagerStandard,
	random: SlideshowEntryManagerRandom,
};

export function getEntriesManagerClass(type: string | null): SlideshowEntryManagerConstructor {
	if(type === null) return SlideshowEntryManagerStandard;
	const ret = _slideshowEntryManagerClasses[type];
	assert(ret !== undefined, templateFancyDefer`unknown entry manager type ${type}`);
	return ret;
}
