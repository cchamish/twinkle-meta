import { WarnCore, warning, warningLevel, getPref, makeTemplate } from './core';

const AUTO_SIGNED_TEMPLATES = new Set([
	'Test1',
	'Test2',
	'Test3',
	'Test4',
	'Test4im',
	'Spam',
	'Attack',
	'Bv',
]);

export class Warn extends WarnCore {
	footerlinks = {
		'Meta:Warning templates': 'Category:User warning templates',
	};

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
		let text = makeTemplate(`subst:${templateName}`, {
			1: article || null,
			2: reason && !isCustom ? reason : null,
		});
		if (isCustom && reason) {
			text += ` ''${reason}''`;
		}
		// Meta's Test1..4/Spam/Attack/Bv templates include {{{sig|~~~~}}} via {{warning message}}
		return AUTO_SIGNED_TEMPLATES.has(templateName) ? text : `${text} ~~~~`;
	}

	getHistoryRegex(): RegExp {
		return /<!--\s*Template:([\w -]+)\s*-->.*?(\d{2}:\d{2}, \d{1,2} \w+ \d{4} \(UTC\))/g;
	}
}
