import { allOf, anyOf, arrayOf, theseKeys, isNull, isNumber, isString, TypeGuard } from './json_validation.js';

interface ImagePart {
	image: string;
}
const isImagePart: TypeGuard<ImagePart> = theseKeys({
	required: {
		image: isString,
	},
});

interface VideoPart {
	video: string;
}
const isVideoPart: TypeGuard<VideoPart> = theseKeys({
	required: {
		video: isString,
	},
});

interface GroupPart {
	children: (ImagePart | VideoPart)[];
}
const isGroupPart: TypeGuard<GroupPart> = theseKeys({
	required: {
		children: arrayOf(anyOf(isImagePart, isVideoPart)),
	},
});

interface CreditPart {
	credit: string;
}
const isCreditPart: TypeGuard<CreditPart> = theseKeys({
	required: {
		credit: isString,
	},
});

export type EntryMetadata = (ImagePart | VideoPart | GroupPart) & CreditPart;
export const isMediaEntry: TypeGuard<EntryMetadata> = allOf(
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
