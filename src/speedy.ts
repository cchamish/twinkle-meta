import {
	SpeedyCore,
	criterion,
	getPref,
	Page,
	Preference,
	Twinkle,
	makeArray,
	obj_entries,
} from './core';

export class Speedy extends SpeedyCore {
	portletTooltip = Morebits.userIsSysop
		? 'Delete page according to WM:CSD'
		: 'Request speedy deletion according to WM:CSD';

	footerlinks = {
		'Meta CSD criteria': 'Meta:Deletion policy#Criteria for speedy deletion',
	};

	makeWindow() {
		super.makeWindow();
		if (this.result && this.result.tag_only && this.result.deleteRedirects) {
			this.result.tag_only.addEventListener('change', (event) => {
				const target = event.target as HTMLInputElement;
				this.result.deleteRedirects.checked = !target.checked && getPref('deleteRedirectsOnDelete');
			});
		}
	}

	normalizeHash: Record<string, string> = {
		'reason': 'db',
		'g1-nonsense': 'g1',
		'g1-vandalism': 'g1',
		'g1-test': 'g1',
		'g2': 'g2',
		'g3': 'g3',
		'g4': 'g4',
		'g5': 'g5',
		'g6': 'g6',
		'g7': 'g7',
		'g8': 'g8',
		'g9': 'g9',
		'g10': 'g10',
		'a1': 'a1',
		'i1': 'i1',
		'i2': 'i2',
		'i3': 'i3',
		'i4': 'i4',
		't1': 't1',
		't2': 't2',
		't3': 't3',
		'm1': 'm1',
		'm2': 'm2',
		'm3': 'm3',
		'm4': 'm4',
		'm5': 'm5',
	};

	reasonLabels: Record<string, string> = {
		'g1-nonsense': 'G1: No meaningful content or history',
		'g1-vandalism': 'G1: Vandalism',
		'g1-test': 'G1: Test page',
		'g2': 'G2: Reposted content previously deleted',
		'g3': 'G3: Indefinitely blocked or globally banned contributor',
		'g4': 'G4: Redundant content',
		'g5': 'G5: Copyright infringement',
		'g6': "G6: Author's request",
		'g7': 'G7: Out of project scope',
		'g8': 'G8: Advertising or other inappropriate promotion',
		'g9': 'G9: Attack page',
		'g10': 'G10: Possible copyright infringement unresolved after 7 days',
		'a1': 'A1: Transwikied to or already present on another project',
		'i1': 'I1: Unfree file',
		'i2': 'I2: Unsourced or unlicensed file',
		'i3': 'I3: File available on Wikimedia Commons',
		'i4': 'I4: Corrupt, missing, or empty file',
		't1': 'T1: Not a translation',
		't2': 'T2: Low quality / machine translation',
		't3': 'T3: Not translation documentation',
		'm1': 'M1: Routine housekeeping',
		'm2': 'M2: Unneeded or broken redirect',
		'm3': 'M3: Unneeded talk page',
		'm4': 'M4: Empty category',
		'm5': 'M5: Aged "looks useless" page',
	};

	criteriaLists: Array<{
		label: string;
		visible: (self: SpeedyCore) => boolean;
		list: Array<criterion>;
	}> = [
		{
			label: 'Custom rationale',
			visible: () => true,
			list: [
				{
					label: 'Custom rationale using {{delete}}',
					value: 'reason',
					code: 'db',
					tooltip: 'Specify a custom speedy deletion reason.',
					subgroup: {
						name: 'reason_1',
						type: 'input',
						label: 'Reason:',
						size: 60,
						parameter: '1',
					},
					hideWhenMultiple: true,
				},
			],
		},
		{
			label: 'General criteria',
			visible: () => true,
			list: [
				{
					label: 'G1: No meaningful content or history (nonsense / empty)',
					value: 'g1-nonsense',
					code: 'g1',
					tooltip: 'Obvious nonsense, blanked pages, or no meaningful content.',
				},
				{
					label: 'G1: Vandalism',
					value: 'g1-vandalism',
					code: 'g1',
					tooltip: 'Pure vandalism or hoax page.',
				},
				{
					label: 'G1: Test page',
					value: 'g1-test',
					code: 'g1',
					tooltip: 'Test edits or experiments outside the sandbox.',
				},
				{
					label: 'G2: Reposted content',
					value: 'g2',
					code: 'g2',
					tooltip: 'Previously deleted under deletion policy without significant rewrite.',
				},
				{
					label: 'G3: Banned or indefinitely blocked contributor',
					value: 'g3',
					code: 'g3',
					tooltip: 'Created and edited solely by an indefinitely blocked or globally banned user.',
				},
				{
					label: 'G4: Redundant content',
					value: 'g4',
					code: 'g4',
					tooltip: 'Identical to another page with no significant differences.',
					subgroup: {
						name: 'g4_page',
						type: 'input',
						label: 'Existing page:',
						size: 50,
						parameter: 'detail',
					},
				},
				{
					label: 'G5: Copyright infringement',
					value: 'g5',
					code: 'g5',
					tooltip: 'Clear and proven copyright violation.',
					subgroup: {
						name: 'g5_url',
						type: 'input',
						label: 'Source URL (optional):',
						size: 60,
						parameter: 'detail',
					},
				},
				{
					label: "G6: Author's request",
					value: 'g6',
					code: 'g6',
					tooltip: 'Requested by the sole significant contributor in good faith.',
				},
				{
					label: 'G7: Out of project scope',
					value: 'g7',
					code: 'g7',
					tooltip:
						'Encyclopedic articles, dictionary definitions, or content belonging on another project.',
				},
				{
					label: 'G8: Advertising or inappropriate promotion',
					value: 'g8',
					code: 'g8',
					tooltip: 'Spam, advertising, or promotional content.',
				},
				{
					label: 'G9: Attack page',
					value: 'g9',
					code: 'g9',
					tooltip:
						'Content created solely to attack, threaten, or denigrate a person or organisation.',
					redactContents: true,
				},
				{
					label: 'G10: Possible copyright infringement (after 7 days)',
					value: 'g10',
					code: 'g10',
					tooltip: 'Tagged with {{possible copyright infringement}} for 7+ days without clearance.',
				},
			],
		},
		{
			label: 'Articles',
			visible: (self) => self.namespace === 0 && !self.isRedirect,
			list: [
				{
					label: 'A1: Transwikied or already present on another project',
					value: 'a1',
					code: 'a1',
					tooltip: 'Content already present on or transwikied to another Wikimedia project.',
				},
			],
		},
		{
			label: 'Media files',
			visible: (self) => self.namespace === 6 && !self.isRedirect,
			list: [
				{
					label: 'I1: Unfree file',
					value: 'i1',
					code: 'i1',
					tooltip: 'Copyright infringement or non-free / fair-use licence.',
				},
				{
					label: 'I2: Unsourced or unlicensed file (after 1 week)',
					value: 'i2',
					code: 'i2',
					tooltip: 'Missing source or licence for at least one week after uploader notification.',
				},
				{
					label: 'I3: Available on Wikimedia Commons',
					value: 'i3',
					code: 'i3',
					tooltip: 'File already exists on or was transferred to Wikimedia Commons.',
				},
				{
					label: 'I4: Corrupt, missing, or empty file',
					value: 'i4',
					code: 'i4',
					tooltip: 'File is corrupt, missing, or empty.',
				},
			],
		},
		{
			label: 'Translations',
			visible: (self) => self.namespace === 1198 || /\//.test(mw.config.get('wgTitle')),
			list: [
				{
					label: 'T1: Not a translation',
					value: 't1',
					code: 't1',
					tooltip: 'Obviously untranslated or nonsense translation page.',
				},
				{
					label: 'T2: Low quality / machine translation',
					value: 't2',
					code: 't2',
					tooltip: 'Machine-generated translation or full of errors.',
				},
				{
					label: 'T3: Not translation documentation',
					value: 't3',
					code: 't3',
					tooltip: 'Invalid translation documentation.',
				},
			],
		},
		{
			label: 'Miscellaneous',
			visible: () => true,
			list: [
				{
					label: 'M1: Routine housekeeping',
					value: 'm1',
					code: 'm1',
					tooltip: 'Uncontroversial maintenance (e.g. preparing for page move or history merge).',
					subgroup: {
						name: 'm1_detail',
						type: 'input',
						label: 'Details (optional):',
						size: 50,
						parameter: 'detail',
					},
				},
				{
					label: 'M2: Unneeded or broken redirect',
					value: 'm2',
					code: 'm2',
					tooltip: 'Broken or unneeded redirect without significant history.',
				},
				{
					label: 'M3: Unneeded talk page',
					value: 'm3',
					code: 'm3',
					tooltip: 'Talk page of a deleted or non-existent page.',
				},
				{
					label: 'M4: Empty category (after 1 week)',
					value: 'm4',
					code: 'm4',
					tooltip: 'Category empty for at least a week.',
					showInNamespaces: [14],
				},
				{
					label: 'M5: Aged "looks useless" page (after 60 days)',
					value: 'm5',
					code: 'm5',
					tooltip: 'Tagged with {{looks useless}} for at least 60 days.',
				},
			],
		},
	];

	formatCriterionReason(value: string, templateParams: Record<string, string> = {}): string {
		if (value === 'reason') {
			return (templateParams['1'] || '').trim();
		}
		const base = this.reasonLabels[value] || value.toUpperCase();
		const detail = (templateParams.detail || '').trim();
		return detail ? `${base} (${detail})` : base;
	}

	buildCombinedReason(): string {
		const csdValues = makeArray(this.params.csd) as string[];
		const templateParams = this.params.templateParams || [];
		return csdValues
			.map((val, idx) => this.formatCriterionReason(val, templateParams[idx]))
			.filter(Boolean)
			.join('; ');
	}

	getTaggingCode(): string {
		const reason = this.buildCombinedReason();
		return reason ? `{{delete|${reason}}}` : '{{delete}}';
	}

	preprocessParams() {
		const params = this.params;
		params.csd = makeArray(params.csd);
		params.normalizeds = params.csd.map((critValue) => this.flatObject[critValue].code);
		this.getTemplateParameters();
		this.getMode();

		const hasPref = (prefName: string, norm: string) =>
			(getPref(prefName) || []).indexOf(norm) !== -1;

		if (this.mode.isSysop) {
			params.promptForSummary = params.normalizeds.some((norm) =>
				hasPref('promptForSpeedyDeletionSummary', norm)
			);
			params.warnUser =
				params.warnusertalk &&
				params.normalizeds.some((norm) => hasPref('warnUserOnSpeedyDelete', norm));
		} else {
			params.notifyUser =
				params.notify &&
				params.normalizeds.some((norm) => hasPref('notifyUserOnSpeedyDeletionNomination', norm));
		}
		params.redactContents = params.csd.some((csd) => this.flatObject[csd].redactContents);
		params.watch = params.normalizeds.some(
			(norm) => hasPref('watchSpeedyPages', norm) && getPref('watchSpeedyExpiry')
		);
		params.welcomeuser =
			(params.notifyUser || params.warnUser) &&
			params.normalizeds.some((norm) => hasPref('welcomeUserOnSpeedyDeletionNotification', norm));

		this.preprocessParamInputs();
	}

	getUserNotificationText(): string {
		const action = this.params.warnUser ? 'deleted' : 'nominated for speedy deletion';
		const reason = this.buildCombinedReason();
		const target = this.params.redactContents ? 'an attack page' : `[[:${Morebits.pageNameNorm}]]`;
		const greeting = this.params.welcomeuser ? 'Welcome to Meta-Wiki! ' : 'Hello. ';
		return (
			`\n== Speedy deletion ${this.params.warnUser ? 'of' : 'nomination of'} ${target} ==\n` +
			`${greeting}The page ${target} has been ${action} under [[Meta:Deletion policy#Criteria for speedy deletion|Meta-Wiki's speedy deletion criteria]]` +
			(reason ? ` (${reason})` : '') +
			'. ~~~~'
		);
	}

	parseDeletionReason() {
		const params = this.params;
		let reason: string;
		if (params.normalizeds[0] === 'db') {
			reason = this.buildCombinedReason() || prompt('Enter the deletion summary to use:', '') || '';
		} else {
			const csdValues = makeArray(params.csd) as string[];
			const parts = csdValues.map((val, idx) => {
				const code = (this.normalizeHash[val] || val).toUpperCase();
				const text = this.formatCriterionReason(val, (params.templateParams || [])[idx]);
				const withoutCode = text.replace(/^[A-Z]\d+:\s*/, '');
				return `[[WM:CSD#${code}|${code}]]: ${withoutCode}`;
			});
			reason = parts.join('; ');
			if (params.promptForSummary) {
				reason = prompt('Enter the deletion summary to use, or press OK to accept:', reason);
			}
		}
		params.deleteReason = reason;
		return $.Deferred().resolve();
	}

	tagPage(pageobj: Page) {
		const params = this.params;
		let text = pageobj.getPageText();
		let code = this.getTaggingCode();

		if (
			!pageobj.canEdit() ||
			['wikitext', 'Scribunto', 'javascript', 'css', 'sanitized-css'].indexOf(
				pageobj.getContentModel()
			) === -1
		) {
			const talkName = new mw.Title(pageobj.getPageName()).getTalkPage().toText();
			if (talkName === pageobj.getPageName()) {
				pageobj
					.getStatusElement()
					.error('Page protected and nowhere to add an edit request, aborting');
				return $.Deferred().reject();
			}
			pageobj.getStatusElement().warn('Unable to edit page, placing tag on talk page');
			const talkPage = new Page(talkName, 'Automatically placing tag on talk page');
			talkPage.setNewSectionTitle(`${pageobj.getPageName()} nominated for CSD`);
			talkPage.setNewSectionText(
				`${code}\n\nI was unable to tag [[:${pageobj.getPageName()}]], so please delete it. ~~~~`
			);
			talkPage.setCreateOption('recreate');
			talkPage.setFollowRedirect(true);
			talkPage.setWatchlist(params.watch);
			talkPage.setChangeTags(Twinkle.changeTags);
			return talkPage.newSection();
		}

		if (mw.config.get('wgNamespaceNumber') === 10) {
			code = `<noinclude>${code}</noinclude>`;
		}
		if (mw.config.get('wgPageContentModel') === 'Scribunto') {
			let equals = '';
			while (code.indexOf(`]${equals}]`) !== -1) {
				equals += '=';
			}
			code = `require('Module:Module wikitext')._addText([${equals}[${code}]${equals}]);`;
		} else if (
			['javascript', 'css', 'sanitized-css'].indexOf(mw.config.get('wgPageContentModel')) !== -1
		) {
			code = `/* ${code} */`;
		}

		let editsummary: string;
		if (params.normalizeds[0] === 'db') {
			editsummary = `Requesting [[WM:CSD|speedy deletion]] (${this.buildCombinedReason()}).`;
		} else {
			const criteriaText = params.normalizeds
				.map((norm) => `[[WM:CSD#${norm.toUpperCase()}|CSD ${norm.toUpperCase()}]]`)
				.join(', ');
			editsummary = `Requesting speedy deletion (${criteriaText}).`;
		}

		text = params.redactContents ? code : this.insertTagText(code, text);

		pageobj.setPageText(text);
		pageobj.setEditSummary(editsummary);
		pageobj.setWatchlist(params.watch);
		return pageobj.save();
	}

	static userPreferences() {
		const csdCodes = {
			db: 'Custom rationale',
			g1: 'G1 (nonsense/vandalism/test)',
			g2: 'G2 (reposted)',
			g3: 'G3 (banned/blocked contributor)',
			g4: 'G4 (redundant)',
			g5: 'G5 (copyright)',
			g6: 'G6 (author request)',
			g7: 'G7 (out of scope)',
			g8: 'G8 (advertising)',
			g9: 'G9 (attack page)',
			g10: 'G10 (unresolved copyvio)',
			a1: 'A1 (transwikied)',
			i1: 'I1 (unfree file)',
			i2: 'I2 (unsourced/unlicensed file)',
			i3: 'I3 (on Commons)',
			i4: 'I4 (corrupt/empty file)',
			t1: 'T1 (not a translation)',
			t2: 'T2 (machine translation)',
			t3: 'T3 (not translation doc)',
			m1: 'M1 (housekeeping)',
			m2: 'M2 (broken redirect)',
			m3: 'M3 (unneeded talk page)',
			m4: 'M4 (empty category)',
			m5: 'M5 (aged looks useless)',
		};
		const defaultNotify = ['g1', 'g2', 'g3', 'g5', 'g7', 'g8', 'g9', 'g10', 'i1', 'i2', 't1', 't2'];

		return {
			title: 'CSD',
			preferences: [
				{
					name: 'speedyWindowWidth',
					label: 'Width of CSD dialog (px)',
					type: 'integer',
					default: 800,
				},
				{
					name: 'speedyWindowHeight',
					label: 'Height of CSD dialog (px)',
					type: 'integer',
					default: 500,
				},
				{
					name: 'deleteSysopDefaultToDelete',
					label: 'Default to outright deletion instead of requesting deletion',
					type: 'boolean',
					default: false,
					adminOnly: true,
				},
				{
					name: 'deleteTalkPageOnDelete',
					label: 'Check the "also delete talk page" box by default',
					type: 'boolean',
					default: true,
					adminOnly: true,
				},
				{
					name: 'deleteRedirectsOnDelete',
					label: 'Check the "also delete redirects" box by default',
					type: 'boolean',
					default: true,
					adminOnly: true,
				},
				{
					name: 'promptForSpeedyDeletionSummary',
					label: 'Criteria for which to prompt for a deletion summary',
					type: 'set',
					setValues: csdCodes,
					default: ['g1', 'g4', 'g6', 'm1'],
					adminOnly: true,
				},
				{
					name: 'warnUserOnSpeedyDelete',
					label: 'Criteria for which to notify the creator when deleting',
					type: 'set',
					setValues: csdCodes,
					default: defaultNotify,
					adminOnly: true,
				},
				{
					name: 'notifyUserOnSpeedyDeletionNomination',
					label: 'Criteria for which to notify the creator when nominating',
					type: 'set',
					setValues: csdCodes,
					default: defaultNotify,
				},
				{
					name: 'welcomeUserOnSpeedyDeletionNotification',
					label: 'Criteria for which to welcome the creator alongside notification',
					type: 'set',
					setValues: csdCodes,
					default: [],
				},
				{
					name: 'logSpeedyNominations',
					label: 'Keep a log in userspace of all CSD nominations',
					type: 'boolean',
					default: false,
				},
				{
					name: 'speedyLogPageName',
					label: 'Keep the CSD userspace log at this subpage',
					type: 'string',
					default: 'CSD log',
				},
				{
					name: 'noLogOnSpeedyNomination',
					label: 'Do not create a userspace log entry when tagging with these criteria',
					type: 'set',
					setValues: csdCodes,
					default: ['g6', 'm1', 'm2', 'm3', 'm4'],
				},
			] as Preference[],
		};
	}
}
