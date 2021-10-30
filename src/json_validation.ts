export type TypeGuard<OutType = unknown> = (a: unknown) => a is OutType;

// type UnionOf<T extends unknown[]> =
// 	T extends [] ? never :
// 		T extends [infer First] ? First :
// 			T extends [infer First, infer Second] ? First | Second :
// 				T extends [infer First, infer Second, ...infer Rest] ? First | Second | UnionOf<Rest> :
// 					never;

type UnionOf<T extends unknown[]> = T[number]; // this works fine i think?

type IntersectionOf<T extends unknown[]> =
	T extends [] ? never :
		T extends [infer First] ? First :
			T extends [infer First, infer Second] ? First & Second :
				T extends [infer First, infer Second, ...infer Rest] ? First & Second & IntersectionOf<Rest> :
					never;

type TypeGuardToGuardedType<Guard extends TypeGuard> = Guard extends TypeGuard<infer G> ? G : never;

type TypeGuardArrayToTypeArray<Guards extends TypeGuard[]> = {
	[K in keyof Guards]: Guards[K] extends TypeGuard<infer G> ? G : never;
};

type TypeGuardArrayToTypeUnion<Guards extends TypeGuard[]> = UnionOf<{
	[K in keyof Guards]: Guards[K] extends TypeGuard<infer G> ? G : never;
}>;

type TypeGuardArrayToTypeIntersection<Guards extends TypeGuard[]> = IntersectionOf<{
	[K in keyof Guards]: Guards[K] extends TypeGuard<infer G> ? G : never;
}>;

export function isLiteral<L>(literal: L): TypeGuard<L> {
	return (x: unknown): x is L => x === literal;
}

// writing these as variables with TypeGuard<foo> types (as opposed to as functions) make them show
// up nicer in errors.
// compare this:
//   | Type '(x: unknown) => x is boolean' is not assignable to type '(x: unknown) => x is string'.
//   |   Type predicate 'x is boolean' is not assignable to 'x is string'.
//   |     Type 'boolean' is not assignable to type 'string'.ts(2322)
// to this:
//   | Type 'TypeGuard<boolean>' is not assignable to type 'TypeGuard<string>'.
//   |   Type 'boolean' is not assignable to type 'string'.ts(2322)
export const isString: TypeGuard<string> = (x: unknown): x is string => typeof x === 'string';
export const isNumber: TypeGuard<number> = (x: unknown): x is number => typeof x === 'number';
export const isArray: TypeGuard<unknown[]> = (x: unknown): x is unknown[] => Array.isArray(x);
export const isBoolean: TypeGuard<boolean> = (x: unknown): x is boolean => typeof x === 'boolean';
export const isNull: TypeGuard<null> = isLiteral(null);

export function anyOf<Guards extends TypeGuard[]>(...guards: Guards): TypeGuard<TypeGuardArrayToTypeUnion<Guards>> {
	return (x: unknown): x is TypeGuardArrayToTypeUnion<Guards> => {
		let ret = false;
		for(const guard of guards) ret ||= guard(x);
		return ret;
	};
}

export function allOf<Guards extends TypeGuard[]>(...guards: Guards): TypeGuard<TypeGuardArrayToTypeIntersection<Guards>> {
	return (x: unknown): x is TypeGuardArrayToTypeIntersection<Guards> => {
		let ret = false;
		for(const guard of guards) ret ||= guard(x);
		return ret;
	};
}

export function tupleOf<Guards extends TypeGuard[]>(...guards: Guards): TypeGuard<TypeGuardArrayToTypeArray<Guards>> {
	return (x: unknown): x is TypeGuardArrayToTypeArray<Guards> => {
		if(!isArray(x)) return false;
		if(x.length !== guards.length) return false;
		let ret = true;
		for(let i = 0; i < guards.length; i++) {
			ret &&= guards[i]!(x[i]!);
		}
		return ret;
	};
}

export function arrayOf<Guard extends TypeGuard>(guard: Guard): TypeGuard<TypeGuardToGuardedType<Guard>[]> {
	return (x: unknown): x is TypeGuardToGuardedType<Guard>[] => {
		if(!isArray(x)) return false;
		let ret = true;
		for(const n of x) {
			ret &&= guard(n);
		}
		return ret;
	};
}

// why hasthesekeys/hasonlythesekeys/HasKeysParam/HasKeysHelper are written the way they are:
//  - having the final return type be directly from a type alias results in the inferred type being
//    displayed like this:
//      | TypeGuard<HasKeysHelper<{
//      |     required: {
//      |         foo: TypeGuard<bar>;
//      |     };
//      |     required: {
//      |         baz: TypeGuard<qux>;
//      |     };
//      | }>>
//    as opposed to this, which is what we want:
//      | TypeGuard<{
//      |     foo: bar;
//      |     baz: qux;
//      | }>
// - writing all or part of what the helper type alias might do as a default value to a generic
//   argument solves the above problem, but causes a new one. the calculated type for the type
//   guard can be inferred over by other things, causing the return type to not be properly checked
//   since it's essentially overwritten.
//   so, with code like this:
//     | interface Foo { bar: string };
//     | const isFoo: TypeGuard<Foo> = hasthesekeys({ required: { qux: isBoolean } });
//   assigning the clearly wrong type guard to isFoo wouldn't cause any errors.
// - on the other hand, doing the first step in a helper type alias and then making a new mapped
//   type from that to get the final return type works fine and doesn't suffer from any of the
//   above issues. (making the mapped type from it was going to be done anyways, since we want to
//   normalize the two intersected types into a single type)

type HasKeysParam = {
	required?: Record<string, TypeGuard>;
	optional?: Record<string, TypeGuard>;
};

type HasKeysHelper<
	Param extends HasKeysParam,
> = (Param['optional'] extends undefined ? never : {
	[K2 in keyof Param['optional']]?: Param['optional'][K2] extends TypeGuard<infer G> ? G : unknown;
}) & (Param['required'] extends undefined ? never : {
	[K2 in keyof Param['required']]: Param['required'][K2] extends TypeGuard<infer G> ? G : unknown;
});

export function onlyTheseKeys<Param extends HasKeysParam>(param: Param): TypeGuard<{[K in keyof HasKeysHelper<Param>]: HasKeysHelper<Param>[K]}> {
	return (x: unknown): x is {[K in keyof HasKeysHelper<Param>]: HasKeysHelper<Param>[K]} => {
		if(typeof x !== 'object' || x === null) return false;
		// keep track of how many properties of x we've checked so far, it'll be useful later
		let numPropsChecked = 0;
		// first, check that all the required keys are present and that their values match the corresponding type quards
		if(param.required !== undefined) {
			for(const [key, guard] of Object.entries(param.required)) {
				if(!(key in x)) return false;
				numPropsChecked++;
				if(!guard(x[key as keyof typeof x])) return false;
			}
		}
		// next, check that, if any of the optional keys are present, their values match the corresponding type guards
		if(param.optional !== undefined) {
			for(const [key, guard] of Object.entries(param.optional)) {
				if(key in x) {
					numPropsChecked++;
					if(!guard(x[key as keyof typeof x])) return false;
				}
			}
		}
		// finally, use the 'how may properties of x have we checked' counter to make sure that there aren't any unexpected keys in x
		//  (if the number of keys in x != the number of keys of x that we checked, then x has keys which are in neither param.required nor param.optional)
		return Object.keys(x).length === numPropsChecked;
	};
}

export function theseKeys<Param extends HasKeysParam>(param: Param): TypeGuard<{[K in keyof HasKeysHelper<Param>]: HasKeysHelper<Param>[K]}> {
	return (x: unknown): x is {[K in keyof HasKeysHelper<Param>]: HasKeysHelper<Param>[K]} => {
		if(typeof x !== 'object' || x === null) return false;
		// first, check that all the required keys are present and that their values match the corresponding type quards
		if(param.required !== undefined) {
			for(const [key, guard] of Object.entries(param.required)) {
				if(!(key in x)) return false;
				if(!guard(x[key as keyof typeof x])) return false;
			}
		}
		// next, check that, if any of the optional keys are present, their values match the corresponding type guards
		if(param.optional !== undefined) {
			for(const [key, guard] of Object.entries(param.optional)) {
				if(key in x) {
					if(!guard(x[key as keyof typeof x])) return false;
				}
			}
		}
		return true;
	};
}
