import { Config, FluffCore, Preference } from './core';

export class Fluff extends FluffCore {
	trustedBots = [];

	hiddenName = 'an unknown user';

	static userPreferences() {
		return {
			title: 'Reverting and rollback',
			preferences: ([
				{
					name: 'autoMenuAfterRollback',
					label: 'Automatically open the Twinkle warn menu after Twinkle rollback',
					type: 'boolean',
					default: false,
				},
				{
					name: 'openTalkPage',
					label: 'Open user talk page when using these types of reversion',
					type: 'set',
					setValues: {
						agf: 'Good-faith rollback',
						norm: 'Normal rollback',
						vand: 'Vandalism rollback',
					},
					default: ['agf', 'norm', 'vand'],
				},
				{
					name: 'openTalkPageOnAutoRevert',
					label:
						'Open user talk page when invoking rollback from user contributions or recent changes',
					type: 'boolean',
					default: false,
				},
				{
					name: 'rollbackInPlace',
					label: "Don't reload the page when rolling back from contributions or recent changes",
					type: 'boolean',
					default: false,
				},
				{
					name: 'markRevertedPagesAsMinor',
					label: 'Mark as minor edit for these types of reversion',
					type: 'set',
					setValues: {
						agf: 'Good-faith rollback',
						norm: 'Normal rollback',
						vand: 'Vandalism rollback',
						torev: '"Restore this version"',
					},
					default: ['vand'],
				},
				{
					name: 'watchRevertedPages',
					label: 'Add pages to watchlist when using these types of reversion',
					type: 'set',
					setValues: {
						agf: 'Good-faith rollback',
						norm: 'Normal rollback',
						vand: 'Vandalism rollback',
						torev: '"Restore this version"',
					},
					default: ['agf', 'norm', 'vand', 'torev'],
				},
				{
					name: 'watchRevertedExpiry',
					label: 'When reverting a page, how long to watch it for',
					type: 'enum',
					enumValues: Config.watchlistEnums,
					default: '1 month',
				},
				{
					name: 'offerReasonOnNormalRevert',
					label: 'Prompt for reason for normal rollback',
					type: 'boolean',
					default: true,
				},
				{
					name: 'confirmOnFluff',
					label: 'Provide a confirmation message before reverting (all devices)',
					type: 'boolean',
					default: false,
				},
				{
					name: 'confirmOnMobileFluff',
					label: 'Provide a confirmation message before reverting (mobile devices only)',
					type: 'boolean',
					default: true,
				},
				{
					name: 'showRollbackLinks',
					label: 'Show rollback links on these pages',
					type: 'set',
					setValues: {
						diff: 'Diff pages',
						others: 'Contributions pages of other users',
						mine: 'My contributions page',
						recent: 'Recent changes and related changes special pages',
						history: 'History pages',
					},
					default: ['diff', 'others'],
				},
			] as unknown) as Preference[],
		};
	}
}
