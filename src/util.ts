class AssertionError extends Error {
	constructor(description?: string | (() => string)) {
		if(description === undefined) super('assertion failed (no description provided)');
		else if(typeof description === 'function') super(`assertion failed: ${description()}`);
		else super(`assertion failed: ${description}`);
	}
}

function assert(condition: boolean, description?: string | (() => string)): asserts condition {
	if(!condition) throw new AssertionError(description);
}

function getElementByIdSafe(id: string): HTMLElement {
	const elem = document.getElementById(id);
	assert(elem !== null, templateFancyDefer`found no element with id ${id}`);
	return elem;
}

function querySelectorSafe<K extends keyof HTMLElementTagNameMap>(target: ParentNode, selector: K): HTMLElementTagNameMap[K];
function querySelectorSafe<K extends keyof SVGElementTagNameMap>(target: ParentNode, selector: K): SVGElementTagNameMap[K];
function querySelectorSafe<E extends Element = Element>(target: ParentNode, selector: string): E;
function querySelectorSafe<E extends Element = Element>(target: ParentNode, selector: string): E {
	const elem = target.querySelector<E>(selector);
	assert(elem !== null, templateFancyDefer`found no element matching selector ${selector} on element ${target}`);
	return elem;
}

type Nullable<T> = T | null;

function nextEventFirePromise<T extends EventTarget>(target: T, eventType: string, errorEventType?: string): Promise<void> {
	return new Promise((resolve, reject) => {
		function event(e: Event): void {
			target.removeEventListener(eventType, event);
			if(errorEventType !== undefined) target.removeEventListener(errorEventType, event);
			if(e.type === eventType) resolve();
			else if(e.type === errorEventType) reject();
			// else reject(new Error(`event type ${e.type} is neither ${eventType} nor ${errorEventType}`));
		}
		target.addEventListener(eventType, event);
		if(errorEventType !== undefined) target.addEventListener(errorEventType, event);
	});
}

function templateFancy(strings: TemplateStringsArray, ...expressions: Array<unknown>): string {
	let ret = '';
	for(let i = 0; i < strings.length; i++) {
		ret += strings[i];
		if(i < strings.length - 1) {
			const expression = expressions[i];
			if(expression instanceof Element) {
				// manual cast needed since cloneNode just returns Node
				// shallow cloneNode + outerHTML since we want a string representation of JUST the node itself, not any of its children
				ret += (expression.cloneNode(false) as typeof expression).outerHTML;
			}
			// using JSON.stringify means that:
			//   - strings will be surrounded in quotes and have backslashes properly escaped
			//   - objects will (hopefully) be properly represented rather than just being [object Object]
			else ret += JSON.stringify(expressions[i]);
		}
	}
	return ret;
}

function templateFancyDefer(strings: TemplateStringsArray, ...expressions: Array<unknown>): () => ReturnType<typeof templateFancy> {
	return (): string => templateFancy(strings, ...expressions);
}

async function _fetchSafeNocache(path: string, options?: RequestInit): Promise<Response> {
	const response = await fetch(path, options);
	assert(response.ok, templateFancyDefer`file ${path} failed to load (${response.status} ${response.statusText})`);
	return response;
}

async function fetchTextSafe(path: string, options?: RequestInit): Promise<string> {
	const response = await _fetchSafeNocache(path, options);
	return await response.text();
}

async function fetchJSONSafe(path: string, options?: RequestInit): Promise<unknown> {
	const response = await _fetchSafeNocache(path, options);
	const responseData: unknown = await response.json();
	return responseData;
}
