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
	entries: Array<JSONDataImageEntry|JSONDataVideoEntry>;
}
type JSONDataEntry = JSONDataImageEntry | JSONDataVideoEntry | JSONDataGroupEntry;

/** schema for theme_config.json files */
interface JSONDataThemeConfig {
	/** how long to idle for when displaying images (in seconds) */
	imageIdleTime: number;
	/** animation name for intro animtion, or null if no intro animation */
	introAnimation: Nullable<string>;
	/** animation name for outro animtion, or null if no outro animation */
	outroAnimation: Nullable<string>;
}
