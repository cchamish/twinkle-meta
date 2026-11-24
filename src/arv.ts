import { Dialog, Page, Twinkle, TwinkleModule } from './core';

const REPORT_PAGE = 'Meta:Requests for help from a sysop or bureaucrat';

const PRESET_REASONS = [
	{ label: 'Vandalism', value: 'Vandalism' },
	{ label: 'Spam or promotional editing', value: 'Spam / promotional editing' },
	{ label: 'Cross-wiki abuse / spambot', value: 'Cross-wiki abuse / spambot' },
	{ label: 'Personal attacks or harassment', value: 'Personal attacks / harassment' },
	{ label: 'Recreating deleted content', value: 'Recreating deleted content' },
	{ label: 'Block evasion / sockpuppetry', value: 'Block evasion / sockpuppetry' },
];

export class Arv extends TwinkleModule {
	static moduleName = 'ARV';
	moduleName = 'ARV';

	portletName = 'ARV';
	portletId = 'twinkle-arv';
	portletTooltip = 'Report user to Meta administrators (WM:RFH)';

	footerlinks = {
		'Meta:RFH': REPORT_PAGE,
	};

	constructor() {
		super();
		if (mw.config.exists('wgRelevantUserName')) {
			this.addMenu();
		}
	}

	static buildDuplicateRegex(username: string): RegExp {
		const escaped = Morebits.string.escapeRegExp(username.trim());
		return new RegExp(
			`==\\s*Report concerning User:${escaped}\\s*==|\\{\\{\\s*[Vv]andal\\s*\\|\\s*(?:1\\s*=\\s*)?${escaped}\\s*\\}\\}`
		);
	}

	static formatReport(username: string, reason: string): string {
		const uid = username.trim();
		return `== Report concerning User:${uid} ==\n{{vandal|1=${uid}}} &mdash; '''Reasons:''' ${reason.trim()} ~~~~`;
	}

	static buildReason(selectedReasons: string[], comment: string): string {
		const parts = [...selectedReasons];
		const trimmed = comment.trim();
		if (trimmed) {
			parts.push(trimmed);
		}
		return parts.join('; ');
	}

	makeWindow() {
		const uid = mw.config.get('wgRelevantUserName') || '';
		if (
			uid === mw.config.get('wgUserName') &&
			!confirm('You are about to report yourself. Continue?')
		) {
			return;
		}

		const dialog = new Dialog(600, 420);
		dialog.setTitle('Report user to Meta administrators');
		dialog.setFooterLinks(this.footerlinks);

		const form = new Morebits.quickForm((e) => this.evaluate(e));
		const field = form.append({
			type: 'field',
			label: `Report to ${REPORT_PAGE}`,
		});

		field.append({
			type: 'input',
			name: 'uid',
			label: 'Username or IP:',
			value: uid,
			size: 40,
		});

		field.append({
			type: 'checkbox',
			name: 'reasons',
			label: 'Reasons:',
			list: PRESET_REASONS,
		});

		field.append({
			type: 'textarea',
			name: 'comment',
			label: 'Additional details / links:',
			tooltip: 'Optional if a preset reason is selected.',
		});

		const previewLink = document.createElement('a');
		previewLink.textContent = 'Preview';
		previewLink.style.cursor = 'pointer';
		$(previewLink).on('click', () => this.preview(result));
		form.append({ type: 'div', id: 'arvpreview', label: [previewLink] });
		form.append({ type: 'div', id: 'twinklearv-previewbox', style: 'display: none' });

		form.append({ type: 'submit', label: 'Submit report' });

		const result = form.render();
		dialog.setContent(result);
		dialog.display();
		result.previewer = new Morebits.wiki.preview(document.getElementById('twinklearv-previewbox'));
	}

	preview(form: HTMLFormElement) {
		const input = Morebits.quickForm.getInputData(form);
		const uid = ((input.uid as string) || '').trim();
		const reason = Arv.buildReason(
			(input.reasons as string[]) || [],
			(input.comment as string) || ''
		);
		if (!uid || !reason) {
			return alert('Please enter a username and at least one reason.');
		}
		form.previewer.beginRender(Arv.formatReport(uid, reason), REPORT_PAGE);
	}

	evaluate(e: Event) {
		const form = e.target as HTMLFormElement;
		const input = Morebits.quickForm.getInputData(form);
		const uid = ((input.uid as string) || '').trim();
		const reason = Arv.buildReason(
			(input.reasons as string[]) || [],
			(input.comment as string) || ''
		);

		if (!uid) {
			return alert('You must specify a username or IP.');
		}
		if (!reason) {
			return alert('You must select or enter a reason.');
		}

		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(form);

		const reportPage = new Page(REPORT_PAGE, 'Checking existing reports on Meta:RFH');
		reportPage.setFollowRedirect(true);
		reportPage.load().then(() => {
			const text = reportPage.getPageText();
			if (Arv.buildDuplicateRegex(uid).test(text)) {
				reportPage.getStatusElement().error(`${uid} is already reported on ${REPORT_PAGE}.`);
				return;
			}

			const reportText = Arv.formatReport(uid, reason);
			reportPage.setPageText(`${text.trimEnd()}\n\n${reportText}`);
			reportPage.setEditSummary(`Reporting [[Special:Contributions/${uid}|${uid}]]`);
			reportPage.setChangeTags(Twinkle.changeTags);
			reportPage.setCreateOption('recreate');
			return reportPage.save().then(() => {
				Morebits.status.actionCompleted(`Report submitted to ${REPORT_PAGE}.`);
			});
		});
	}
}
