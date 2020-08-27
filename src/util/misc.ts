export function throwError(message?: string): never {
	if(message == null) throw new Error();
	else throw new Error(message);
}

export type Nullable<T> = T | null;
