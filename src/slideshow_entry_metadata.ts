// need to do this one like this since the compiler wasn't quite able to figure it out implicitly from the check
function _isJSONDataImageEntry(data: JSONDataEntry): data is JSONDataImageEntry {
	return !('type' in data) || data.type === 'image';
}
 
function createSlideshowEntryMetadata(data: unknown): SlideshowEntryMetadata {
	_assertIsJSONDataEntry(data);
	if(_isJSONDataImageEntry(data)) return new SlideshowImageEntryMetadata(data);
	else if(data.type === 'video') return new SlideshowVideoEntryMetadata(data);
	else return new SlideshowGroupEntryMetadata(data);
}

abstract class SlideshowEntryMetadata {
	createInstance(): SlideshowEntryController {
		return new SlideshowEntryController(this);
	}

	abstract createMediaElement(): SlideshowMediaElement;
}

abstract class SlideshowMediaEntryMetadata extends SlideshowEntryMetadata {
	path: string;
	artist: string;
	constructor(path: string, artist: string) {
		super();
		this.path = path;
		this.artist = artist;
	}
}

class SlideshowImageEntryMetadata extends SlideshowMediaEntryMetadata {
	constructor(data: JSONDataImageEntry) {
		super(data.path, data.artist);
	}

	createMediaElement(): SlideshowMediaElementImage {
		return new SlideshowMediaElementImage(this);
	}
}

class SlideshowVideoEntryMetadata extends SlideshowMediaEntryMetadata {
	constructor(data: JSONDataVideoEntry) {
		super(data.path, data.artist);
	}

	createMediaElement(): SlideshowMediaElementVideo {
		return new SlideshowMediaElementVideo(this);
	}
}

class SlideshowGroupEntryMetadata extends SlideshowEntryMetadata {
	children: Array<SlideshowEntryMetadata>;  // TODO this might need to just be SlideshowMediaEntry, depends on how groups end up getting implemented
	constructor(data: JSONDataGroupEntry) {
		super();
		this.children = data.entries.map(createSlideshowEntryMetadata);
	}

	createMediaElement(): SlideshowMediaElementGroup {
		return new SlideshowMediaElementGroup(this);
	}
}
