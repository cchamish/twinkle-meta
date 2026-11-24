import { Config, Preference, ProtectCore, Page, Api, Twinkle, getPref, msg } from './core';

const RFH_PAGE = 'Meta:Requests for help from a sysop or bureaucrat';

export class Protect extends ProtectCore {
	requestPageName = RFH_PAGE;
	requestPageAcronym = 'WM:RFH';

	footerlinks = {
		'Meta:RFH': RFH_PAGE,
	};

	static userPreferences() {
		return {
			title: 'Page protection (RPP)',
			preferences: [
				{
					name: 'watchRequestedPages',
					label: 'When requesting page protection, how long to watch the page for',
					type: 'enum',
					enumValues: Config.watchlistEnums,
					default: 'yes',
				},
				{
					name: 'watchPPTaggedPages',
					label: 'When tagging a page with a protection template, how long to watch it for',
					type: 'enum',
					enumValues: Config.watchlistEnums,
					default: 'default',
				},
				{
					name: 'watchProtectedPages',
					label: 'When protecting a page, how long to watch it for',
					type: 'enum',
					enumValues: Config.watchlistEnums,
					default: 'default',
					adminOnly: true,
				},
			] as Preference[],
		};
	}

	existingTagRegex = /\{\{\s*(?:Permprot|Temprot|Vprotected|PP-template|Protected interface)\b[^}]*\}\}\s*/i;

	// twinkle-core's makeWindow() fires changeAction on the hidden 'protect' radio for non-sysops
	changeAction(e: { target?: HTMLInputElement & { values?: string } }) {
		if (!Morebits.userIsSysop && e.target && e.target.values === 'protect' && e.target.form) {
			const radios = Array.from(e.target.form.actiontype || []) as HTMLInputElement[];
			const checked = radios.find((el) => el.checked);
			if (checked) {
				return super.changeAction({ target: checked });
			}
		}
		return super.changeAction(e);
	}

	getProtectionLevels() {
		return {
			'all': {
				label: msg('protect-level-all'),
				weight: 0,
				types: ['edit', 'move', 'create'] as ('edit' | 'move' | 'create' | 'stable')[],
			},
			'autoconfirmed': {
				label: msg('protect-level-autoconfirmed'),
				weight: 1,
				types: ['edit', 'move', 'create'] as ('edit' | 'move' | 'create' | 'stable')[],
			},
			'sysop': {
				label: msg('protect-level-sysop'),
				weight: 3,
				defaultSelected: true as const,
				types: ['edit', 'move', 'create'] as ('edit' | 'move' | 'create' | 'stable')[],
			},
			'banner-protect': {
				label: msg('restriction-level-banner-protect'),
				weight: 4,
				types: ['edit', 'move'] as ('edit' | 'move' | 'create' | 'stable')[],
			},
			'centralnotice-admin': {
				label: msg('restriction-level-centralnotice-admin'),
				weight: 5,
				types: ['edit', 'move'] as ('edit' | 'move' | 'create' | 'stable')[],
			},
		};
	}

	protectionPresetsInfo: ProtectCore['protectionPresetsInfo'] = {
		'unprotect': {
			edit: 'all',
			move: 'all',
			create: 'all',
			template: 'none',
		},
		'semi-vandalism': {
			edit: 'autoconfirmed',
			reason: 'Persistent vandalism',
			expiry: '1 week',
			template: 'noop',
		},
		'semi-spam': {
			edit: 'autoconfirmed',
			reason: 'Persistent spamming',
			expiry: '1 week',
			template: 'noop',
		},
		'semi-generic': {
			edit: 'autoconfirmed',
			reason: 'Persistent disruptive editing',
			expiry: '1 week',
			template: 'noop',
		},
		'full-dispute': {
			edit: 'sysop',
			move: 'sysop',
			reason: 'Edit warring / content dispute',
			expiry: '3 days',
			template: 'noop',
		},
		'full-vandalism': {
			edit: 'sysop',
			move: 'sysop',
			reason: 'Persistent vandalism',
			expiry: '1 week',
			template: 'noop',
		},
		'full-highrisk': {
			edit: 'sysop',
			move: 'sysop',
			reason: 'High-risk page or template',
			expiry: 'infinity',
			template: 'noop',
		},
		'move-vandalism': {
			move: 'sysop',
			reason: 'Page-move vandalism',
			expiry: '1 week',
			template: 'noop',
		},
		'create-salt': {
			create: 'sysop',
			reason: 'Repeatedly recreated deleted page',
			expiry: 'infinity',
		},
		'create-semi': {
			create: 'autoconfirmed',
			reason: 'Repeatedly recreated spam/vandalism page',
			expiry: '1 month',
		},
	};

	protectionTags: quickFormElementData[] = [
		{ value: 'none', label: 'None (remove existing protection template)' },
		{ value: 'noop', label: 'No change (do not add or remove template)' },
		{ value: 'Temprot', label: '{{Temprot}} (temporary protection)' },
		{ value: 'Permprot', label: '{{Permprot}} (indefinite protection)' },
		{ value: 'Vprotected', label: '{{Vprotected}} (vandalism protection)' },
		{ value: 'PP-template', label: '{{PP-template}} (protected template)' },
		{ value: 'Protected interface', label: '{{Protected interface}} (interface page)' },
	];

	getProtectionPresets(): quickFormElementData[] {
		return [
			{
				label: 'Unprotection',
				list: [{ label: 'Unprotect page', value: 'unprotect' }],
			},
			{
				label: 'Semi-protection',
				list: [
					{ label: 'Persistent vandalism', value: 'semi-vandalism' },
					{ label: 'Persistent spamming', value: 'semi-spam' },
					{ label: 'Generic semi-protection', value: 'semi-generic' },
				],
			},
			{
				label: 'Full protection',
				list: [
					{ label: 'Edit warring / content dispute', value: 'full-dispute' },
					{ label: 'Persistent vandalism', value: 'full-vandalism' },
					{ label: 'High-risk page or template', value: 'full-highrisk' },
				],
			},
			{
				label: 'Move protection',
				list: [{ label: 'Page-move vandalism', value: 'move-vandalism' }],
			},
		];
	}

	getCreateProtectionPresets(): quickFormElementData[] {
		return [
			{
				label: 'Creation protection',
				list: [
					{ label: 'Sysop creation protection (salt)', value: 'create-salt', selected: true },
					{ label: 'Semi creation protection', value: 'create-semi' },
				],
			},
			{
				label: 'Unprotection',
				list: [{ label: 'Unprotect creation', value: 'unprotect' }],
			},
		];
	}

	getRequestTextAndSummary(input: {
		category: string;
		reason: string;
		expiry: string;
	}): [string, string] {
		const isMissing = !mw.config.get('wgArticleId');
		const presets = isMissing ? this.getCreateProtectionPresets() : this.getProtectionPresets();
		let typename = input.category;
		for (const group of presets) {
			for (const item of group.list || []) {
				if (item.value === input.category) {
					typename =
						isMissing && input.category !== 'unprotect'
							? String(item.label || group.label || input.category)
							: String(group.label || item.label || input.category);
					break;
				}
			}
		}

		const presetInfo = this.protectionPresetsInfo[input.category];
		let reason = (presetInfo && presetInfo.reason) || '';
		if (input.reason) {
			reason = reason ? `${reason} \u2013 ${input.reason}` : input.reason;
		}
		if (reason && !reason.endsWith('.')) {
			reason += '.';
		}

		const levelPhrase = input.expiry ? `${input.expiry} ${typename.toLowerCase()}` : typename;
		const text =
			`== Page protection request: [[:${Morebits.pageNameNorm}]] ==\n` +
			`* {{pagelinks|1=${Morebits.pageNameNorm}}}\n\n` +
			`'''${Morebits.string.toUpperCaseFirstChar(levelPhrase)}${
				reason ? `:''' ${Morebits.string.formatReasonText(reason)}` : ".'''"
			} ~~~~`;

		const summary = `Requesting ${typename.toLowerCase()} of [[:${Morebits.pageNameNorm}]].`;
		return [text, summary];
	}

	fileRequest(rppPage: Page, input: { category: string; reason: string; expiry: string }) {
		const text = rppPage.getPageText();
		const statusElement = rppPage.getStatusElement();

		const escapedPage = Morebits.string.escapeRegExp(Morebits.pageNameNorm);
		const existingRe = new RegExp(
			`==\\s*Page protection request:\\s*\\[\\[:?${escapedPage}\\]\\]\\s*==`
		);
		if (existingRe.test(text)) {
			statusElement.error(msg('protect-request-exists', rppPage.getPageName()));
			return $.Deferred().reject() as any;
		}

		const [requestText, summary] = this.getRequestTextAndSummary(input);
		statusElement.status('Adding new protection request...');
		rppPage.setEditSummary(summary);
		rppPage.setPageText(`${text.trimEnd()}\n\n${requestText}`);
		rppPage.setChangeTags(Twinkle.changeTags);
		rppPage.setCreateOption('recreate');
		return rppPage.save().then(() => {
			const watchPref = getPref('watchRequestedPages');
			const watch =
				watchPref !== 'no' &&
				(watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
			if (watch) {
				return new Api('Adding requested page to watchlist', {
					action: 'watch',
					titles: mw.config.get('wgPageName'),
					token: mw.user.tokens.get('watchToken'),
					expiry:
						this.watched !== true && watchPref !== 'default' && watchPref !== 'yes'
							? watchPref
							: undefined,
				}).post();
			}
			return $.Deferred().resolve() as any;
		});
	}
}
