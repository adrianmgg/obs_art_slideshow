function createSlideshowEntryMetadata(data: unknown): SlideshowEntryMetadata {
	_assertIsJSONDataEntry(data);
	if(data.type === 'image' || !('type' in data)) return new SlideshowImageEntryMetadata(data);
	else if(data.type === 'video') return new SlideshowVideoEntryMetadata(data);
	else if(data.type === 'group') return new SlideshowGroupEntryMetadata(data);
	else assert(false, 'should be unreachable');
}

abstract class SlideshowEntryMetadata {
	createInstance() {
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
