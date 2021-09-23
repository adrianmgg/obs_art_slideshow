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

interface JSONDataThemeConfig {
	imageIdleTime: number;
}
