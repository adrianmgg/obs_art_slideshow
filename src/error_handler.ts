import { getElementByIdSafe } from './util.js';

// TODO move this into a hardcoded script tag in index.html so it can report when the main script fails to load

export function initGlobalErrorHandlers(): void {
	const errorsDisplayContents: HTMLElement = getElementByIdSafe('errors_display_contents');

	function putOnscreenErrorMessage(message: string): void {
		if(errorsDisplayContents.textContent !== '') errorsDisplayContents.textContent += '\n';
		errorsDisplayContents.textContent += message;
	}

	window.addEventListener('error', function onUncaughtError(e) {
		putOnscreenErrorMessage(`uncaught error occurred, program will likely not continue.\n\t${e.message}\n\tin ${e.filename} at ${e.lineno}:${e.colno}`);
	});
	window.addEventListener('unhandledrejection', function (e) {
		if(e.reason instanceof Error && e.reason.stack !== undefined) {
			putOnscreenErrorMessage(`uncaught error occurred, program will likely not continue.\n${e.reason.stack}`);
		}
		else {
			putOnscreenErrorMessage(`uncaught error occurred, program will likely not continue.\n\t${String(e.reason)}`);
		}
	});
}
