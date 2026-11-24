import { XfdCore, XfdMode, Page, Twinkle, getPref, NS_FILE, NS_TEMPLATE } from './core';

const RFD_PAGE = 'Meta:Requests for deletion';

export class MetaRfdMode extends XfdMode {
	static venueCode = 'RfD';
	static venueLabel = 'Requests for deletion (WM:RFD)';

	static isDefaultChoice(): boolean {
		return true;
	}

	getFieldsetLabel() {
		return 'Requests for deletion (Meta:RfD)';
	}

	getMenuTooltip() {
		return 'Nominate page for deletion at Meta:Requests for deletion';
	}

	static defaultSection(): string {
		if (mw.config.get('wgNamespaceNumber') === NS_FILE) {
			return 'Files';
		}
		if (mw.config.get('wgIsRedirect')) {
			return 'Redirects';
		}
		return 'Pages';
	}

	generateFieldset() {
		super.generateFieldset();
		const defaultSec = MetaRfdMode.defaultSection();
		this.fieldset.append({
			type: 'select',
			name: 'rfdsection',
			label: 'Section on Meta:Requests for deletion:',
			list: [
				{ label: 'Pages', value: 'Pages', selected: defaultSec === 'Pages' },
				{ label: 'Files', value: 'Files', selected: defaultSec === 'Files' },
				{ label: 'Redirects', value: 'Redirects', selected: defaultSec === 'Redirects' },
			],
		});
		this.appendReasonArea();
		return this.fieldset;
	}

	validateInput(): boolean {
		if (!this.params.reason || !this.params.reason.trim()) {
			alert('You must provide a reason for deletion.');
			return false;
		}
		return true;
	}

	getDiscussionWikitext(): string {
		const reason = Morebits.string.formatReasonText(this.params.reason || '');
		return `{{subst:RFD2|${Morebits.pageNameNorm}|${reason} --~~~~}}`;
	}

	getNotifyText(): string {
		return `{{subst:RfD notice|${Morebits.pageNameNorm}}} ~~~~`;
	}

	getNotifyEditSummary(): string {
		return `Notification: [[${RFD_PAGE}#${Morebits.pageNameNorm}|listing]] of [[:${Morebits.pageNameNorm}]] at [[WM:RFD]].`;
	}

	evaluate() {
		super.evaluate();
		if (!this.tm) {
			return;
		}

		this.params.discussionpage = `${RFD_PAGE}#${Morebits.pageNameNorm}`;
		this.params.logpage = RFD_PAGE;

		this.tm.add(this.tagPage, []);
		this.tm.add(this.addToRfd, [], this.printReasonText);
		this.tm.add(this.lookupCreation, []);
		this.tm.add(this.notifyCreator, [this.lookupCreation, this.addToRfd]);
		this.tm.add(this.addToLog, [this.notifyCreator]);
		this.tm.execute().then(() => this.redirectToDiscussion());
	}

	static getTagPrefix(contentModel: string, namespaceNumber: number): string | null {
		if (contentModel === 'wikitext') {
			return namespaceNumber === NS_TEMPLATE ? '<noinclude>{{RFD}}</noinclude>' : '{{RFD}}\n';
		}
		if (['javascript', 'css', 'sanitized-css'].includes(contentModel)) {
			return '/* {{RFD}} */\n';
		}
		return null;
	}

	tagPage() {
		if (mw.config.get('wgIsProbablyEditable') === false) {
			Morebits.status.warn(
				'Tagging page',
				'Page is protected and cannot be edited by you; continuing to list nomination at Meta:Requests for deletion.'
			);
			return $.Deferred().resolve();
		}

		const contentModel = mw.config.get('wgPageContentModel') || 'wikitext';
		const tag = MetaRfdMode.getTagPrefix(contentModel, mw.config.get('wgNamespaceNumber'));
		if (!tag) {
			Morebits.status.warn(
				'Tagging page',
				`Skipped adding {{RFD}} on ${contentModel} page to avoid breaking code; tag its documentation or talk page manually if needed.`
			);
			return $.Deferred().resolve();
		}

		const page = new Page(mw.config.get('wgPageName'), 'Tagging page with {{RFD}}');
		page.setFollowRedirect(false);
		return page.load().then(() => {
			const text = tag + page.getPageText();
			page.setPageText(text);
			page.setEditSummary(`Nominated for deletion; see [[${RFD_PAGE}#${Morebits.pageNameNorm}]].`);
			page.setWatchlist(getPref('xfdWatchPage'));
			page.setChangeTags(Twinkle.changeTags);
			page.setCreateOption('nocreate');
			return page.save();
		});
	}

	addToRfd() {
		const section = this.params.rfdsection || 'Pages';
		const rfdPage = new Page(RFD_PAGE, `Adding nomination to ${RFD_PAGE}`);
		return rfdPage.load().then(() => {
			const text = rfdPage.getPageText();
			const entry = this.getDiscussionWikitext();
			const headingRe = new RegExp(
				`(^==\\s*${Morebits.string.escapeRegExp(section)}\\s*==[\\s\\S]*?)(?=\\n==[^=]|$)`,
				'm'
			);

			let newText: string;
			if (headingRe.test(text)) {
				newText = text.replace(headingRe, (match) => `${match.trimEnd()}\n\n${entry}\n`);
			} else {
				newText = `${text.trimEnd()}\n\n== ${section} ==\n${entry}\n`;
			}

			rfdPage.setPageText(newText);
			rfdPage.setEditSummary(
				`/* ${section} */ Listing [[:${Morebits.pageNameNorm}]] for deletion.`
			);
			rfdPage.setWatchlist(getPref('xfdWatchDiscussion'));
			rfdPage.setChangeTags(Twinkle.changeTags);
			rfdPage.setCreateOption('recreate');
			return rfdPage.save();
		});
	}

	lookupCreation() {
		if (!this.params.notifycreator) {
			return $.Deferred().resolve();
		}
		const page = new Page(Morebits.pageNameNorm, 'Finding page creator');
		return page.lookupCreation().then(() => {
			this.params.initialContrib = page.getCreator();
		});
	}
}

XfdCore.modeList = [MetaRfdMode];

export class Xfd extends XfdCore {
	footerlinks = {
		'Meta:RfD': RFD_PAGE,
		'Meta:Deletion policy': 'Meta:Deletion policy',
	};
}
