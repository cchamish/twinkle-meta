import { Config, Preference, WarnCore, warning, warningLevel, getPref, makeTemplate } from './core';

const AUTO_SIGNED_TEMPLATES = new Set([
	'Test1',
	'Test2',
	'Test3',
	'Test4',
	'Test4im',
	'Spam',
	'Attack',
	'Bv',
	'Offtopic',
	'Offtopic-edits',
	'Not an encyclopedia',
	'Norecreate',
	'Copyviowarn-possible',
	'Sb',
]);

export class Warn extends WarnCore {
	footerlinks = {
		'Meta:Warning templates': 'Category:User warning templates',
	};

	static userPreferences() {
		return {
			title: 'Warn user',
			preferences: [
				{
					name: 'defaultWarningGroup',
					label: 'Default warning level',
					type: 'enum',
					enumValues: {
						'1': 'Level 1',
						'2': 'Level 2',
						'3': 'Level 3',
						'4': 'Level 4',
						'5': 'Level 4im',
						'6': 'Single-issue notices',
						'8': 'All warnings',
						'9': 'Custom warnings',
					},
					default: '1',
				},
				{
					name: 'showSharedIPNotice',
					label: 'Add extra notice on shared IP talk pages',
					type: 'boolean',
					default: true,
				},
				{
					name: 'watchWarnings',
					label: 'When warning a user, how long to watch their talk page for',
					type: 'enum',
					enumValues: Config.watchlistEnums,
					default: '1 month',
				},
				{
					name: 'oldSelect',
					label: 'Use the non-searchable classic select menu',
					type: 'boolean',
					default: false,
				},
				{
					name: 'customWarningList',
					label: 'Custom warning templates to display',
					type: 'customList',
					default: [],
				},
			] as Preference[],
		};
	}

	warningLevels = {
		level1: {
			label: '1: General note',
			selected: (pref: number) => pref === 1,
		},
		level2: {
			label: '2: Caution',
			selected: (pref: number) => pref === 2,
		},
		level3: {
			label: '3: Warning',
			selected: (pref: number) => pref === 3,
		},
		level4: {
			label: '4: Final warning',
			selected: (pref: number) => pref === 4,
		},
		level4im: {
			label: '4im: Only warning',
			selected: (pref: number) => pref === 5,
		},
		singlenotice: {
			label: 'Single-issue notices',
			selected: (pref: number) => pref === 6,
		},
		kitchensink: {
			label: 'All warnings',
			selected: (pref: number) => pref === 8,
		},
		custom: {
			label: 'Custom warnings',
			selected: (pref: number) => pref === 9,
			visible: () => getPref('customWarningList').length > 0,
		},
	};

	processWarnings() {
		const w = (template: string, label: string, summary: string): warning => ({
			template,
			label,
			summary,
			inputConfig: {},
		});

		this.warnings = {
			level1: {
				label: 'Level 1: General note',
				list: [
					w('Test1', 'Test edits / vandalism (level 1)', 'General note: unconstructive editing'),
					w(
						'Uw-delete1',
						'Removing deletion templates (level 1)',
						'General note: removing deletion tags'
					),
				],
			},
			level2: {
				label: 'Level 2: Caution',
				list: [
					w('Test2', 'Test edits / vandalism (level 2)', 'Caution: unconstructive editing'),
					w(
						'Uw-delete2',
						'Removing deletion templates (level 2)',
						'Caution: removing deletion tags'
					),
				],
			},
			level3: {
				label: 'Level 3: Warning',
				list: [w('Test3', 'Vandalism (level 3)', 'Warning: vandalism')],
			},
			level4: {
				label: 'Level 4: Final warning',
				list: [w('Test4', 'Vandalism (level 4)', 'Final warning: vandalism')],
			},
			level4im: {
				label: 'Level 4im: Only warning',
				list: [
					w('Test4im', 'Severe vandalism (only warning)', 'Only warning: vandalism'),
					w('Bv', 'Blatant vandalism (only warning)', 'Only warning: blatant vandalism'),
				],
			},
			singlenotice: {
				label: 'Single-issue notices',
				list: [
					w('Spam', 'Adding spam or promotional content', 'Notice: spam / advertising'),
					w('Attack', 'Personal attacks', 'Notice: personal attacks'),
					w('Offtopic', 'Off-topic page creation', 'Notice: off-topic page'),
					w('Offtopic-edits', 'Off-topic editing', 'Notice: off-topic edits'),
					w(
						'Not an encyclopedia',
						'Meta-Wiki is not an encyclopedia',
						'Notice: Meta is not an encyclopedia'
					),
					w('Uw-machine', 'Machine translation', 'Notice: machine translation'),
					w('Norecreate', 'Recreating deleted content', 'Notice: recreating deleted page'),
					w(
						'Copyviowarn-possible',
						'Possible copyright infringement',
						'Notice: possible copyright infringement'
					),
					w('No license notice', 'Uploaded file missing licence', 'Notice: file missing licence'),
					w('Image source', 'Uploaded file missing source', 'Notice: file missing source'),
					w('Upload warning', 'Inappropriate file upload', 'Notice: file upload warning'),
					w('Sb', 'Use the sandbox for tests', 'Notice: please use the sandbox'),
					w('Blocked', 'Blocked from editing Meta', 'You have been blocked from editing Meta'),
					w('Welcome', 'Welcome to Meta-Wiki', 'Welcome!'),
				],
			},
		} as Record<string, warningLevel>;
	}

	getWarningWikitext(
		templateName: string,
		article: string,
		reason: string,
		isCustom: boolean
	): string {
		if (templateName === 'Blocked') {
			return makeTemplate('subst:Blocked', {
				1: article || '',
				2: reason || '',
				sig: '~~~~',
			});
		}
		let text = makeTemplate(`subst:${templateName}`, {
			1: article || '',
			2: reason && !isCustom ? reason : '',
		});
		if (isCustom && reason) {
			text += ` ''${reason}''`;
		}
		// Meta's auto-signed warning templates already embed ~~~~
		return AUTO_SIGNED_TEMPLATES.has(templateName) ? text : `${text} ~~~~`;
	}

	getHistoryRegex(): RegExp {
		return /<!--\s*Template:([\w -]+)\s*-->.*?(\d{2}:\d{2}, \d{1,2} \w+ \d{4} \(UTC\))/g;
	}
}
