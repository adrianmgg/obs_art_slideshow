function throwError(message?: string): never {
	if(message == null) throw new Error();
	else throw new Error(message);
}

type Nullable<T> = T | null;

function nextEventFirePromise<T extends EventTarget>(target: T, eventType: string, errorEventType?: string): Promise<Event> {
	return new Promise((resolve, reject) => {
		function event(e: Event) {
			target.removeEventListener(eventType, event);
			if(errorEventType) target.removeEventListener(errorEventType, event);
			if(e.type === errorEventType) reject(e);
			else if(e.type === eventType) resolve(e);
			else reject(new Error(`event type ${e.type} is neither ${eventType} nor ${errorEventType}`));
		}
		target.addEventListener(eventType, event);
		if(errorEventType) target.addEventListener(errorEventType, event);
	});
}
