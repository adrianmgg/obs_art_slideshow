import { JSONDataEntry, JSONDataGroupEntry, JSONDataImageEntry, JSONDataVideoEntry, _assertIsJSONDataEntry } from './jsondata.js';
import { SlideshowMediaElement, SlideshowMediaElementGroup, SlideshowMediaElementImage, SlideshowMediaElementVideo } from './mediaelements.js';
import { SlideshowTheme } from './slideshow_theme.js';

// need to do this one like this since the compiler wasn't quite able to figure it out implicitly from the check
function isJSONDataImageEntry(data: JSONDataEntry): data is JSONDataImageEntry {
	return !('type' in data) || data.type === 'image';
}
 
export function createSlideshowEntryMetadata(data: unknown): SlideshowEntryMetadata {
	_assertIsJSONDataEntry(data);
	if(isJSONDataImageEntry(data)) return new SlideshowImageEntryMetadata(data);
	else if(data.type === 'video') return new SlideshowVideoEntryMetadata(data);
	else return new SlideshowGroupEntryMetadata(data);
}

// TODO should probably be an interface
export abstract class SlideshowEntryMetadata {
	abstract createMediaElement(eventTarget: EventTarget, theme: SlideshowTheme): SlideshowMediaElement;
}

export abstract class SlideshowMediaEntryMetadata extends SlideshowEntryMetadata {
	path: string;
	artist: string;
	constructor(path: string, artist: string) {
		super();
		this.path = path;
		this.artist = artist;
	}
}

export class SlideshowImageEntryMetadata extends SlideshowMediaEntryMetadata {
	constructor(data: JSONDataImageEntry) {
		super(data.path, data.artist);
	}

	createMediaElement(eventTarget: EventTarget, theme: SlideshowTheme): SlideshowMediaElementImage {
		return new SlideshowMediaElementImage(this, eventTarget, theme);
	}
}

export class SlideshowVideoEntryMetadata extends SlideshowMediaEntryMetadata {
	constructor(data: JSONDataVideoEntry) {
		super(data.path, data.artist);
	}

	createMediaElement(eventTarget: EventTarget, _theme: SlideshowTheme): SlideshowMediaElementVideo {
		return new SlideshowMediaElementVideo(this, eventTarget);
	}
}

export class SlideshowGroupEntryMetadata extends SlideshowEntryMetadata {
	children: Array<SlideshowEntryMetadata>;
	constructor(data: JSONDataGroupEntry) {
		super();
		this.children = data.entries.map(createSlideshowEntryMetadata);
	}

	createMediaElement(eventTarget: EventTarget, theme: SlideshowTheme): SlideshowMediaElementGroup {
		return new SlideshowMediaElementGroup(this, eventTarget, theme);
	}
}
