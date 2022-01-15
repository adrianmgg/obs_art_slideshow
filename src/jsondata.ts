import { allOf, anyOf, arrayOf, theseKeys, isNull, isNumber, isString, TypeGuard } from './json_validation';

export interface ImagePart {
	image: string;
}
export const isImagePart: TypeGuard<ImagePart> = theseKeys({
	required: {
		image: isString,
	},
});

export interface VideoPart {
	video: string;
}
export const isVideoPart: TypeGuard<VideoPart> = theseKeys({
	required: {
		video: isString,
	},
});

export interface GroupPart {
	group: (ImagePart | VideoPart)[];
}
export const isGroupPart: TypeGuard<GroupPart> = theseKeys({
	required: {
		group: arrayOf(anyOf(isImagePart, isVideoPart)),
	},
});

export type MediaPart = GroupPart | ImagePart | VideoPart;

export interface CreditPart {
	credit: string;
}
const isCreditPart: TypeGuard<CreditPart> = theseKeys({
	required: {
		credit: isString,
	},
});

export type EntryMetadata = (ImagePart | VideoPart | GroupPart) & CreditPart;
export const isEntryMetadata: TypeGuard<EntryMetadata> = allOf(
	isCreditPart,
	anyOf(isVideoPart, isImagePart, isGroupPart),
);

export interface ThemeConfig {
	/** how long to idle for when displaying images (in seconds) */
	imageIdleTime: number;
	/** animation name for intro animtion, or null if no intro animation */
	introAnimation?: string | null;
	/** animation name for outro animtion, or null if no outro animation */
	outroAnimation?: string | null;
}
export const isThemeConfig: TypeGuard<ThemeConfig> = theseKeys({
	required: {
		imageIdleTime: isNumber,
	},
	optional: {
		introAnimation: anyOf(isString, isNull),
		outroAnimation: anyOf(isString, isNull),
	},
});
