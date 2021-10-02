interface JSONDataImageEntry {
	type?: 'image';
	path: string;
	artist: string;
}
interface JSONDataVideoEntry {
	type: 'video';
	path: string;
	artist: string;
}
interface JSONDataGroupEntry {
	type: 'group';
	entries: Array<JSONDataImageEntry | JSONDataVideoEntry>;
}
type JSONDataEntry = JSONDataImageEntry | JSONDataVideoEntry | JSONDataGroupEntry;

/** schema for theme_config.json files */
interface JSONDataThemeConfig {
	/** how long to idle for when displaying images (in seconds) */
	imageIdleTime: number;
	/** animation name for intro animtion, or null if no intro animation */
	introAnimation?: Nullable<string>;
	/** animation name for outro animtion, or null if no outro animation */
	outroAnimation?: Nullable<string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _assertIsJSONDataThemeConfig(data: any): asserts data is JSONDataThemeConfig {
	assert(data !== null && data !== undefined, 'theme config was null/undefined');
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	assert(data.constructor === Object, templateFancyDefer`while parsing theme config, expected an object ({}) but found ${data}`);
	assert('imageIdleTime' in data, templateFancyDefer`while parsing theme config, expected "imageIdleTime" property but none found`);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	assert(typeof data.imageIdleTime === 'number', templateFancyDefer`while parsing theme config, expected imageIdleTime to be a number but found ${data.imageIdleTime}`);
	for(const animKey of ['introAnimation', 'outroAnimation']) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if(animKey in data) assert(data[animKey] === null || typeof data[animKey] === 'string', templateFancyDefer`while parsing theme config, expected ${animKey} to be either null or a string but found ${data[animKey]}`);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _assertIsJSONDataEntry(data: any): asserts data is JSONDataEntry {
	assert(data !== null && data !== undefined, 'entry in images.json was null/undefined');
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	assert(data.constructor === Object, templateFancyDefer`while parsing entry in images.json, expected an object ({}) but found ${data}`);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const type: unknown = data.type;
	if(typeof type === 'string') {
		assert((type === 'image') || (type === 'video') || (type === 'group'), templateFancyDefer`expected "type" to be either "image", "video", or "group", instead found ${type} (entry: ${data})`);
	}
	if(type === undefined || type === 'image' || type === 'video') {
		assert('path' in data, templateFancyDefer`while parsing entry in images.json, expected "path" property on ${data}`);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		assert(typeof data.path === 'string', templateFancyDefer`while parsing entry in images.json, expected "path" property on to be string, instead found ${data.path} (entry: ${data})`);
		assert('artist' in data, templateFancyDefer`while parsing entry in images.json, expected "artist" property on ${data}`);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		assert(typeof data.artist === 'string', templateFancyDefer`while parsing entry in images.json, expected "artist" property on to be string, instead found ${data.artist} (entry: ${data})`);
	}
	else {
		assert('entries' in data, templateFancyDefer`while parsing entry in images.json, expected "entries" property on ${data}`);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		assert(Array.isArray(data.entries), templateFancyDefer`while parsing entry in images.json, expected "entries" property on to be array, instead found ${data.entries} (entry: ${data})`);
	}
}
