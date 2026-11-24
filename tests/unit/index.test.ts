import fs from 'fs';
import path from 'path';
import { Arv } from '../../src/arv';
import { Block } from '../../src/block';
import { setDefaultConfig } from '../../src/core';
import { Protect } from '../../src/protect';
import { Speedy } from '../../src/speedy';
import { MetaPageTagMode } from '../../src/tag';
import { Warn } from '../../src/warn';
import { MetaRfdMode } from '../../src/xfd';

describe('ARV (Meta:RFH formatting)', () => {
	it('formats user report matching XReport metawiki format', () => {
		expect(Arv.formatReport('Example', 'Vandalism; Cross-wiki abuse')).toBe(
			"== Report concerning User:Example ==\n{{vandal|1=Example}} &mdash; '''Reasons:''' Vandalism; Cross-wiki abuse ~~~~"
		);
	});

	it('detects existing reports by heading or {{vandal}} template', () => {
		const re = Arv.buildDuplicateRegex('User.Name+1');
		expect(re.test('== Report concerning User:User.Name+1 ==')).toBe(true);
		expect(re.test('{{vandal|1=User.Name+1}}')).toBe(true);
		expect(re.test('{{Vandal|User.Name+1}}')).toBe(true);
		expect(re.test('{{vandal|1=OtherUser}}')).toBe(false);
	});

	it('combines preset reasons and optional comment', () => {
		expect(Arv.buildReason(['Vandalism'], 'blanking pages')).toBe('Vandalism; blanking pages');
		expect(Arv.buildReason(['Vandalism'], '   ')).toBe('Vandalism');
	});
});

describe('Speedy (Meta CSD)', () => {
	const makeSpeedy = (params: Record<string, any>) => {
		const s = Object.create(Speedy.prototype) as Speedy;
		Object.assign(s, {
			normalizeHash: {
				'reason': 'db',
				'g1-vandalism': 'g1',
				'g5': 'g5',
				'g8': 'g8',
				'g9': 'g9',
			},
			reasonLabels: {
				'g1-vandalism': 'G1: Vandalism',
				'g5': 'G5: Copyright infringement',
				'g8': 'G8: Advertising or other inappropriate promotion',
				'g9': 'G9: Attack page',
			},
			params,
		});
		return s;
	};

	it('formats single, multiple, detail, and custom {{delete}} tags', () => {
		expect(makeSpeedy({ csd: ['g1-vandalism'], templateParams: [{}] }).getTaggingCode()).toBe(
			'{{delete|G1: Vandalism}}'
		);
		expect(
			makeSpeedy({ csd: ['g1-vandalism', 'g8'], templateParams: [{}, {}] }).getTaggingCode()
		).toBe('{{delete|G1: Vandalism; G8: Advertising or other inappropriate promotion}}');
		expect(
			makeSpeedy({
				csd: ['g5'],
				templateParams: [{ detail: 'https://example.org' }],
			}).getTaggingCode()
		).toBe('{{delete|G5: Copyright infringement (https://example.org)}}');
		expect(
			makeSpeedy({
				csd: ['reason'],
				templateParams: [{ '1': 'Duplicate sandbox' }],
			}).getTaggingCode()
		).toBe('{{delete|Duplicate sandbox}}');
	});

	it('redacts page title in creator notification for G9 attack pages', () => {
		const notice = makeSpeedy({
			csd: ['g9'],
			templateParams: [{}],
			redactContents: true,
			warnUser: false,
		}).getUserNotificationText();
		expect(notice).toContain('an attack page');
		expect(notice).not.toContain('Test page');

		const welcomedNotice = makeSpeedy({
			csd: ['g1-vandalism'],
			templateParams: [{}],
			redactContents: false,
			warnUser: false,
			welcomeuser: true,
		}).getUserNotificationText();
		expect(welcomedNotice).toContain('Welcome to Meta-Wiki!');
	});

	it('registers default CSD preferences so preprocessParams works for nominations and deletions', () => {
		const prefs = Speedy.userPreferences();
		setDefaultConfig(prefs.preferences.map((pref) => ({ name: pref.name, value: pref.default })));

		const runPreprocess = (isSysop: boolean) => {
			const s = Object.create(Speedy.prototype) as Speedy;
			s.flatObject = {
				'g1-vandalism': { label: 'G1: Vandalism', value: 'g1-vandalism', code: 'g1' },
			};
			s.mode = {
				isSysop,
				isMultiple: false,
				isRadioClick: false,
			};
			s.getMode = () => s.mode;
			s.params = { csd: ['g1-vandalism'], notify: true, warnusertalk: true };
			s.preprocessParams();
			return s.params;
		};

		const nomParams = runPreprocess(false);
		expect(nomParams.notifyUser).toBe(true);
		expect(nomParams.welcomeuser).toBe(false);

		const delParams = runPreprocess(true);
		expect(delParams.promptForSummary).toBe(true);
		expect(delParams.warnUser).toBe(true);

		setDefaultConfig([
			{ name: 'warnUserOnSpeedyDelete', value: ['g6'] },
			{ name: 'notifyUserOnSpeedyDeletionNomination', value: ['g6'] },
		]);
		const runG6 = (isSysop: boolean) => {
			const s = Object.create(Speedy.prototype) as Speedy;
			s.flatObject = {
				g6: { label: "G6: Author's request", value: 'g6', code: 'g6' },
			};
			s.mode = { isSysop, isMultiple: false, isRadioClick: false };
			s.getMode = () => s.mode;
			s.params = { csd: ['g6'], notify: true, warnusertalk: true };
			s.preprocessParams();
			return s.params;
		};
		expect(runG6(true).warnUser).toBe(true);
		expect(runG6(false).notifyUser).toBe(true);

		const g9Del = Object.create(Speedy.prototype) as Speedy;
		g9Del.flatObject = {
			g9: { label: 'G9: Attack page', value: 'g9', code: 'g9', redactContents: true },
		};
		g9Del.mode = { isSysop: true, isMultiple: false, isRadioClick: false };
		g9Del.getMode = () => g9Del.mode;
		g9Del.params = { csd: ['g9'], warnusertalk: true };
		g9Del.preprocessParams();
		expect(g9Del.params.redactContents).toBe(true);
	});
});

describe('Protect (Meta:RFH requests)', () => {
	it('formats protection request heading and summary', () => {
		mw.config.set('wgArticleId', 123);
		const protect = Object.create(Protect.prototype) as Protect;
		protect.protectionPresetsInfo = {
			'semi-vandalism': {
				edit: 'autoconfirmed',
				reason: 'Persistent vandalism',
				expiry: '1 week',
				template: 'Vprotected',
			},
		} as any;
		const [text, summary] = protect.getRequestTextAndSummary({
			category: 'semi-vandalism',
			reason: 'Ongoing IP edits',
			expiry: '1 week',
		});
		expect(text).toContain('== Page protection request: [[:Test page]] ==');
		expect(text).toContain(
			"'''1 week semi-protection:''' Persistent vandalism \u2013 Ongoing IP edits. ~~~~"
		);
		expect(summary).toBe('Requesting semi-protection of [[:Test page]].');
	});

	it('preserves distinct action labels for missing-page creation and unprotection requests', () => {
		mw.config.set('wgArticleId', 0);
		const protect = Object.create(Protect.prototype) as Protect;
		protect.protectionPresetsInfo = {
			'unprotect': { edit: 'all', move: 'all', create: 'all' },
			'create-salt': { create: 'sysop', reason: 'Repeatedly recreated deleted page' },
			'create-semi': {
				create: 'autoconfirmed',
				reason: 'Repeatedly recreated by new/anonymous accounts',
			},
		} as any;

		const [unprotText, unprotSummary] = protect.getRequestTextAndSummary({
			category: 'unprotect',
			reason: 'Ready to recreate',
			expiry: '',
		});
		expect(unprotText).toContain("'''Unprotection:''' Ready to recreate. ~~~~");
		expect(unprotSummary).toBe('Requesting unprotection of [[:Test page]].');

		const [saltText, saltSummary] = protect.getRequestTextAndSummary({
			category: 'create-salt',
			reason: '',
			expiry: 'indefinite',
		});
		expect(saltText).toContain("'''Indefinite sysop creation protection (salt):'''");
		expect(saltSummary).toBe('Requesting sysop creation protection (salt) of [[:Test page]].');

		const [semiText, semiSummary] = protect.getRequestTextAndSummary({
			category: 'create-semi',
			reason: '',
			expiry: '1 month',
		});
		expect(semiText).toContain("'''1 month semi creation protection:'''");
		expect(semiSummary).toBe('Requesting semi creation protection of [[:Test page]].');

		const createPresets = protect.getCreateProtectionPresets();
		expect(createPresets[0].list[0].value).toBe('create-salt');
	});

	it('redirects non-sysop initial protect radio change to the checked request radio', () => {
		const protect = Object.create(Protect.prototype) as Protect;
		const superSpy = jest
			.spyOn(Object.getPrototypeOf(Protect.prototype), 'changeAction')
			.mockImplementation(() => {});
		const protectRadio = { values: 'protect', checked: false } as any;
		const requestRadio = { values: 'request', checked: true } as any;
		protectRadio.form = { actiontype: [protectRadio, requestRadio] };
		requestRadio.form = protectRadio.form;

		(Morebits as any).userIsSysop = false;
		protect.changeAction({ target: protectRadio });
		expect(superSpy).toHaveBeenCalledWith({ target: requestRadio });

		superSpy.mockClear();
		(Morebits as any).userIsSysop = true;
		protect.changeAction({ target: protectRadio });
		expect(superSpy).toHaveBeenCalledWith({ target: protectRadio });

		(Morebits as any).userIsSysop = false;
		superSpy.mockRestore();
	});
});

describe('Block (Meta block notices)', () => {
	it('formats {{Blocked}} and standalone block templates', () => {
		const block = Object.create(Block.prototype) as Block;
		block.defaultBlockTemplate = 'Blocked';
		block.blockPresetsInfo = {
			Blocked: { reason: '[[Meta:Vandalism|Vandalism]]' },
			Proxy: { reason: '[[No open proxies|Open proxy]]' },
		};

		const [timed] = block.getBlockNoticeWikitextAndSummary({
			template: 'Blocked',
			expiry: '31 hours',
			reason: 'Vandalism',
			disabletalk: true,
		});
		expect(timed).toBe('{{subst:Blocked|31 hours|Vandalism|notalk}} ~~~~');

		const [indef] = block.getBlockNoticeWikitextAndSummary({
			template: 'Blocked',
			indefinite: true,
			reason: 'Spam',
		});
		expect(indef).toBe('{{subst:Blocked|indef|Spam}} ~~~~');

		const [indefPreview] = block.getBlockNoticeWikitextAndSummary({
			template: 'Blocked',
			template_expiry: 'indefinite',
			block_reason: 'Spam',
		});
		expect(indefPreview).toBe('{{subst:Blocked|indef|Spam}} ~~~~');

		const [proxy] = block.getBlockNoticeWikitextAndSummary({ template: 'Proxy' });
		expect(proxy).toBe('{{subst:Proxy}} ~~~~');
	});

	it('formats partial block notices with specific restrictions instead of sitewide {{Blocked}}', () => {
		mw.config.set('wgFormattedNamespaces', { 0: '', 4: 'Meta' });
		const block = Object.create(Block.prototype) as Block;
		block.defaultBlockTemplate = 'Blocked';
		block.blockPresetsInfo = {
			Blocked: { reason: '[[Meta:Vandalism|Vandalism]]' },
		};

		const [partialText, partialSummary] = block.getBlockNoticeWikitextAndSummary({
			template: 'Blocked',
			partial: true,
			expiry: '1 week',
			reason: 'Disruptive editing',
			pagerestrictions: ['Meta:Sandbox'],
			namespacerestrictions: ['4'],
		});
		expect(partialText).not.toContain('{{subst:Blocked');
		expect(partialText).toContain("'''partially blocked''' for 1 week");
		expect(partialText).toContain('[[:Meta:Sandbox]]');
		expect(partialText).toContain('Meta namespace');
		expect(partialText).toContain('Disruptive editing');
		expect(partialSummary).toBe('Partial block notice: Disruptive editing');

		const [previewText] = block.getBlockNoticeWikitextAndSummary({
			template: 'Blocked',
			partial: true,
			template_expiry: '3 days',
			block_reason: 'Harassment by email',
			noemail_template: true,
			nocreate_template: true,
		});
		expect(previewText).toContain("'''partially blocked''' for 3 days");
		expect(previewText).toContain('sending email');
		expect(previewText).toContain('creating accounts');
		expect(previewText).toContain('Harassment by email');
	});
});

describe('Warn (Meta signature handling)', () => {
	it('avoids double signatures on auto-signed Meta templates', () => {
		const warn = Object.create(Warn.prototype) as Warn;
		expect(warn.getWarningWikitext('Test1', 'Meta:Sandbox', '', false)).toBe(
			'{{subst:Test1|1=Meta:Sandbox}}'
		);
		expect(warn.getWarningWikitext('Uw-delete1', 'Test page', '', false)).toBe(
			'{{subst:Uw-delete1|1=Test page}} ~~~~'
		);
	});
});

describe('Xfd (Meta:RfD)', () => {
	it('picks default RfD section from namespace and redirect status', () => {
		mw.config.set({ wgNamespaceNumber: 6, wgIsRedirect: false });
		expect(MetaRfdMode.defaultSection()).toBe('Files');

		mw.config.set({ wgNamespaceNumber: 0, wgIsRedirect: true });
		expect(MetaRfdMode.defaultSection()).toBe('Redirects');

		mw.config.set({ wgNamespaceNumber: 0, wgIsRedirect: false });
		expect(MetaRfdMode.defaultSection()).toBe('Pages');
	});

	it('formats {{subst:RFD2}} discussion entry', () => {
		const mode = new MetaRfdMode();
		mode.params = { reason: 'Out of scope' };
		expect(mode.getDiscussionWikitext()).toBe('{{subst:RFD2|Test page|Out of scope --~~~~}}');
	});

	it('avoids raw wikitext tags on executable/structured content models', () => {
		expect(MetaRfdMode.getTagPrefix('wikitext', 0)).toBe('{{RFD}}\n');
		expect(MetaRfdMode.getTagPrefix('wikitext', 10)).toBe('<noinclude>{{RFD}}</noinclude>');
		expect(MetaRfdMode.getTagPrefix('javascript', 2)).toBe('/* {{RFD}} */\n');
		expect(MetaRfdMode.getTagPrefix('css', 8)).toBe('/* {{RFD}} */\n');
		expect(MetaRfdMode.getTagPrefix('Scribunto', 828)).toBeNull();
		expect(MetaRfdMode.getTagPrefix('json', 8)).toBeNull();

		mw.config.set({ wgNamespaceNumber: 0, wgArticleId: 123, wgPageContentModel: 'wikitext' });
		expect(MetaPageTagMode.isActive()).toBe(true);
		mw.config.set({ wgNamespaceNumber: 828, wgArticleId: 123, wgPageContentModel: 'Scribunto' });
		expect(MetaPageTagMode.isActive()).toBe(false);
		mw.config.set({ wgNamespaceNumber: 2, wgArticleId: 123, wgPageContentModel: 'javascript' });
		expect(MetaPageTagMode.isActive()).toBe(false);
	});

	it('skips tagging protected pages without blocking RfD listing', () => {
		mw.config.set({
			wgIsProbablyEditable: false,
			wgPageContentModel: 'wikitext',
			wgNamespaceNumber: 0,
		});
		const warnSpy = jest.spyOn(Morebits.status, 'warn').mockImplementation(() => undefined as any);
		const mode = new MetaRfdMode();
		const res = mode.tagPage();
		expect(warnSpy).toHaveBeenCalled();
		expect(res.state()).toBe('resolved');
		warnSpy.mockRestore();
		mw.config.set({ wgIsProbablyEditable: true });
	});
});

describe('Build config (Meta preferences isolation)', () => {
	it('bundles twinklemetaoptions.js instead of twinkleoptions.js', () => {
		const bundle = fs.readFileSync(path.resolve(__dirname, '../../build/twinkle.js'), 'utf8');
		expect(bundle).toContain('/twinklemetaoptions.js');
		expect(bundle).not.toContain('/twinkleoptions.js');
	});
});
