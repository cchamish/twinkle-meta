import { Preference, UnlinkCore } from './core';

export class Unlink extends UnlinkCore {
	isUsable(): boolean {
		return (
			mw.config.get('wgNamespaceNumber') >= 0 &&
			mw.config.get('wgPageName') !== 'Meta:Sandbox' &&
			(Morebits.userIsInGroup('patroller') || Morebits.userIsSysop)
		);
	}

	static userPreferences() {
		return {
			title: 'Unlink',
			preferences: ([
				{
					name: 'unlinkNamespaces',
					label: 'Remove links from pages in these namespaces',
					type: 'set',
					setValues: {
						0: '(Main)',
						1: 'Talk',
						2: 'User',
						3: 'User talk',
						4: 'Meta',
						5: 'Meta talk',
						6: 'File',
						7: 'File talk',
						8: 'MediaWiki',
						9: 'MediaWiki talk',
						10: 'Template',
						11: 'Template talk',
						12: 'Help',
						13: 'Help talk',
						14: 'Category',
						15: 'Category talk',
						828: 'Module',
						829: 'Module talk',
					},
					default: ['0'],
				},
			] as unknown) as Preference[],
		};
	}
}
