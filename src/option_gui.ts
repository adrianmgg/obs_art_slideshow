import { Globals } from './misc';
import { create } from '@amgg/elhelper';

export function setup_option_gui(globals: Globals, target: Element) {
	const optionsRoot = create('div', {
		parent: target,
		style: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'flex-start',
		},
	});
	for(const optionName in globals.theme.optionsInfo) {
		const option = globals.theme.optionsInfo[optionName]!;
		const label = create('label', {
			parent: optionsRoot,
			textContent: optionName,
		});
		if(option.type === 'color') {
			create('input', {
				parent: label,
				type: 'color',
				value: globals.themeOptions[optionName],
				events: {
					input: (e) => {
						globals.themeOptions[optionName] = (e.target as HTMLInputElement).value;
						globals.themeRootRule.style.setProperty(`--option-${optionName}`, (e.target as HTMLInputElement).value);
					},
				},
			});
		}
		else if(option.type === 'float') {
			create('input', {
				parent: label,
				type: 'number',
				value: globals.themeOptions[optionName],
				events: {
					input: (e) => {
						globals.themeOptions[optionName] = (e.target as HTMLInputElement).valueAsNumber;
						globals.themeRootRule.style.setProperty(`--option-${optionName}`, (e.target as HTMLInputElement).value);
					},
				},
			});
		}
	}
	create('button', {
		parent: optionsRoot,
		textContent: 'export json',
		events: {
			click: () => {
				const currentOptionsText = JSON.stringify(globals.themeOptions, null, '    ');
				const blob = new Blob([currentOptionsText], {type: 'application/json'});
				create('a', {
					// TODO revokeObjectURL after download
					href: URL.createObjectURL(blob),
					download: 'options.json',  // TODO make this be the same as the url param one specified (if any)
				}).click();
			},
		},
	});
}

