import { UnlinkCore } from './core';

export class Unlink extends UnlinkCore {
	isUsable(): boolean {
		return (
			mw.config.get('wgNamespaceNumber') >= 0 &&
			mw.config.get('wgPageName') !== 'Meta:Sandbox' &&
			(Morebits.userIsInGroup('patroller') || Morebits.userIsSysop)
		);
	}
}
