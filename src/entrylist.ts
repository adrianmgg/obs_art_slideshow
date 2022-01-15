import { EntryMetadata } from './jsondata';
import { randomIntBetween } from './util';

export type EntryMetaListManager = Generator<EntryMetadata, never, void>;

export const entry_meta_list_managers: { [name: string]: (entries: EntryMetadata[]) => EntryMetaListManager } = {
	standard: function*(entries: EntryMetadata[]) {
		while(true) for(const e of entries) yield e;
	},
	random: function*(entries: EntryMetadata[]) {
		while(true) {
			const shuffled: EntryMetadata[] = [...entries]; // shallow clone
			// https://en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
			for(let i = shuffled.length - 1; i >= 1; i--) {
				const idx = randomIntBetween(0, i);
				const tmp = shuffled[i];
				shuffled[i] = shuffled[idx]!;
				shuffled[idx] = tmp!;
			}
			for(const e of shuffled) yield e;
		}
	},
};

