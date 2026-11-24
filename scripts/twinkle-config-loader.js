module.exports = function (source) {
	return source
		.replace(/twinkleoptions/g, 'twinklemetaoptions')
		.replace(
			/mw\.config\.get\('wgNamespaceNumber'\) === mw\.config\.get\('wgNamespaceIds'\)\.project &&\r?\n\t\t\tmw\.config\.get\('wgTitle'\) === 'Twinkle\/Preferences'/,
			"mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user &&\n\t\t\tmw.config.get('wgTitle') === 'Hamish/twinkle/Preferences'"
		)
		.replace(
			/mw\.config\.get\('wgFormattedNamespaces'\)\[mw\.config\.get\('wgNamespaceIds'\)\.project\] \+ ':Twinkle\/Preferences'/g,
			"'User:Hamish/twinkle/Preferences'"
		);
};
