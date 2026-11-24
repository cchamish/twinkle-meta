const path = require('path');

module.exports = function (source) {
	const file = path.basename(this.resourcePath);
	if (file === 'Page.ts' || file === 'User.ts') {
		return source;
	}

	const isSubdir = /[\\/]twinkle-core[\\/]src[\\/]modules[\\/]/.test(this.resourcePath);
	const rel = isSubdir ? '..' : '.';
	let out = source;
	let imports = '';

	if (out.includes('new Morebits.wiki.page(')) {
		imports += `import { Page as __TwinklePage } from '${rel}/Page';\n`;
		out = out
			.replace(/new Morebits\.wiki\.page\(/g, 'new __TwinklePage(')
			.replace('input.protectReason + Twinkle.summaryAd', 'input.protectReason');
	}

	if (out.includes('new Morebits.wiki.user(')) {
		imports += `import { User as __TwinkleUser } from '${rel}/User';\n`;
		out = out.replace(/new Morebits\.wiki\.user\(/g, 'new __TwinkleUser(');
	}

	if (out.includes('usl.log(')) {
		out = out.replace(
			/usl\.log\(([^,]+),\s*([^)]+)\)/g,
			"usl.log($1, ($2) + (Twinkle.changeTags.length ? '' : Twinkle.summaryAd))"
		);
	}

	if (file === 'speedyCore.ts') {
		out = out
			.replace(
				'[[WP:CSD#G8|G8]]: Talk page of deleted page ',
				'[[Meta:Deletion policy#M3|M3]]: Talk page of deleted page '
			)
			.replace(
				'[[WP:CSD#G8|G8]]: Redirect to deleted page ',
				'[[Meta:Deletion policy#M2|M2]]: Redirect to deleted page '
			);
	}

	return imports + out;
};
