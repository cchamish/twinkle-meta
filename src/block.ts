import { BlockCore, BlockPresetInfo } from './core';

export class Block extends BlockCore {
	defaultBlockTemplate = 'Blocked';
	defaultAnonBlockTemplate = 'Anonblock';
	defaultIndefBlockTemplate = 'Indefblocked';
	defaultPartialBlockTemplate = 'Blocked';
	defaultIndefPartialBlockTemplate = 'Blocked';
	disablePartialBlockNamespaces = [];
	ipBlockExpiryDefault = '31 hours';

	footerlinks = {
		'Meta:Blocking policy': 'Meta:Blocking policy',
	};

	blockPresetsInfo: Record<string, BlockPresetInfo> = {
		'Blocked': {
			expiry: '31 hours',
			nocreate: true,
			reason: '[[Meta:Vandalism|Vandalism]]',
			reasonParam: true,
		},
		'Blocked-spam': {
			expiry: '1 week',
			nocreate: true,
			reason: 'Spam / advertising',
			templateName: 'Blocked',
			reasonParam: true,
		},
		'Blocked-attack': {
			expiry: '1 week',
			nocreate: true,
			reason: 'Personal attacks or harassment',
			templateName: 'Blocked',
			reasonParam: true,
		},
		'Indefblocked': {
			expiry: 'infinity',
			forRegisteredOnly: true,
			nocreate: true,
			reason: '[[Meta:Vandalism|Vandalism-only account]]',
			reasonParam: true,
		},
		'Anonblock': {
			expiry: '31 hours',
			forAnonOnly: true,
			nocreate: true,
			reason: '[[Meta:Vandalism|Anonymous vandalism]]',
			reasonParam: true,
		},
		'Proxy': {
			expiry: '1 year',
			forAnonOnly: true,
			nocreate: true,
			hardblock: true,
			reason: '[[No open proxies|Open proxy]]',
			summary: 'Blocked as an open proxy',
		},
		'Spambot': {
			expiry: 'infinity',
			nocreate: true,
			reason: '[[Vandalbot#Spambots|Spambot]]',
			summary: 'Blocked for operating a spambot',
		},
		'Checkuserblock': {
			expiry: 'infinity',
			nocreate: true,
			reason: 'Abusing multiple accounts',
			reasonParam: true,
		},
	};

	blockGroups: quickFormElementData[] = [
		{
			label: 'Common blocks',
			list: [
				{ label: 'Generic block ({{Blocked}})', value: 'Blocked', selected: true },
				{ label: 'Spam / advertising ({{Blocked}})', value: 'Blocked-spam' },
				{ label: 'Personal attacks ({{Blocked}})', value: 'Blocked-attack' },
				{ label: 'Indefinite block ({{Indefblocked}})', value: 'Indefblocked' },
			],
		},
		{
			label: 'IP & abuse blocks',
			list: [
				{ label: 'Anonymous block ({{Anonblock}})', value: 'Anonblock' },
				{ label: 'Open proxy ({{Proxy}})', value: 'Proxy' },
				{ label: 'Spambot ({{Spambot}})', value: 'Spambot' },
				{ label: 'CheckUser block ({{Checkuserblock}})', value: 'Checkuserblock' },
			],
		},
	];

	blockGroupsPartial: quickFormElementData[] = [
		{
			label: 'Partial blocks',
			list: [{ label: 'Partial block ({{Blocked}})', value: 'Blocked', selected: true }],
		},
	];

	formatPartialBlockScope(params: Record<string, any>): string {
		const parts: string[] = [];
		const pages: string[] = Array.isArray(params.pagerestrictions)
			? params.pagerestrictions.filter(Boolean)
			: [];
		if (pages.length) {
			parts.push(`editing ${pages.map((p) => `[[:${p}]]`).join(', ')}`);
		}

		const namespaces: string[] = Array.isArray(params.namespacerestrictions)
			? params.namespacerestrictions.filter(
					(ns: unknown) => ns !== '' && ns !== null && ns !== undefined
			  )
			: [];
		if (namespaces.length) {
			const nsMap: Record<string, string> = mw.config.get('wgFormattedNamespaces') || {};
			const nsLabels = namespaces.map((ns) => {
				const key = String(ns);
				if (key === '0') {
					return 'Main namespace';
				}
				return nsMap[key] ? `${nsMap[key]} namespace` : `namespace ${key}`;
			});
			parts.push(`editing the ${nsLabels.join(', ')}`);
		}

		if (params.area && params.area.trim()) {
			parts.push(`editing ${params.area.trim()}`);
		}
		if (params.noemail || params.noemail_template) {
			parts.push('sending email');
		}
		if (params.nocreate || params.nocreate_template) {
			parts.push('creating accounts');
		}
		if (params.disabletalk) {
			parts.push('editing your own talk page');
		}
		return parts.length ? parts.join('; ') : 'certain pages or actions on Meta-Wiki';
	}

	getBlockNoticeWikitextAndSummary(params: Record<string, any>): [string, string] {
		const preset = this.blockPresetsInfo[params.template] || {};
		const templateName = preset.templateName || params.template || this.defaultBlockTemplate;
		const reason = (params.reason || params.block_reason || preset.reason || '').trim();
		const rawExpiry =
			typeof params.template_expiry !== 'undefined' ? params.template_expiry : params.expiry;
		const isIndef = params.indefinite || (rawExpiry && Morebits.string.isInfinity(rawExpiry));

		if (params.partial) {
			const duration = params.blank_duration
				? ''
				: isIndef
				? ' indefinitely'
				: rawExpiry
				? ` for ${rawExpiry}`
				: '';
			const scope = this.formatPartialBlockScope(params);
			const reasonClause = reason ? ` for the following reason: ${reason}` : '';
			const wikitext = `You have been '''partially blocked'''${duration} from ${scope}${reasonClause}. You are still able to edit other pages on Meta-Wiki. ~~~~`;
			const summary = reason ? `Partial block notice: ${reason}` : 'Partial block notice';
			return [wikitext, summary];
		}

		let wikitext: string;
		if (templateName === 'Blocked') {
			const expiry = params.blank_duration ? '' : isIndef ? 'indef' : rawExpiry || '';
			const parts = [`subst:Blocked`, expiry, reason];
			if (params.disabletalk) {
				parts.push('notalk');
			}
			wikitext = `{{${parts.join('|')}}} ~~~~`;
		} else {
			wikitext = `{{subst:${templateName}}} ~~~~`;
		}

		const summary = reason ? `Blocked notice: ${reason}` : `Blocked notice ({{${templateName}}})`;
		return [wikitext, summary];
	}
}
