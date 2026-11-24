// Adapted from https://github.com/wikimedia-gadgets/xfdcloser/blob/master/bin/deploy.js
// (MIT Licence)
/**
 * This script is used to deploy files to the wiki.
 * You must have interface-admin rights to deploy as gadget.
 *
 * ----------------------------------------------------------------------------
 *    Set up:
 * ----------------------------------------------------------------------------
 * 1) Use [[Special:BotPasswords]] to get credentials. Make sure you enable
 *    sufficient permissions.
 * 2) Create a JSON file to store the username and password. This should be
 *    a plain JSON object with keys "username" and "password", see README
 *    file for an example. Save it here in the "scripts" directory with file
 *    name "credentials.json".
 *
 * ---------------------------------------------------------------------------
 *    Pre-deployment checklist:
 * ---------------------------------------------------------------------------
 * 1) Changes committed and merged to master branch on GitHub repo
 * 2) Currently on master branch, and synced with GitHub repo
 * 3) Run a full build using "grunt build"
 * When all of the above are done ==> you are ready to proceed with deployment
 *
 * --------------------------------------------------------------------------
 *    Usage:
 * --------------------------------------------------------------------------
 * Ensure the pre-deployment steps above are completed, unless you are only
 * deploying to the testwiki (test.wikipedia.org). Then, run this script:
 * In the terminal, enter
 *     node deploy.js
 * and supply the requested details.
 * Notes:
 * - The default summary if not specified is "Updated from repository"
 * - Edit summaries will be prepended with the version number from
 *   the package.json file
 * - Changes to gadget definitions need to be done manually
 *
 */
const fs = require('fs/promises');
const { mwn } = require('mwn');
const { execSync } = require('child_process');
const prompts = require('prompts');
const chalk = require('chalk');
const minimist = require('minimist');

const USER_PREFIX = 'User:Hamish';

const loaderScript = `/* <nowiki> */
mw.loader.using([
	'mediawiki.user', 'mediawiki.util', 'mediawiki.Title', 'mediawiki.api',
	'mediawiki.storage', 'mediawiki.libs.pluralruleparser'
]).then(function () {
	function loadJs(pageName) {
		return mw.loader.getScript(
			'/w/index.php?title=${USER_PREFIX}/' + pageName + '&action=raw&ctype=text/javascript'
		);
	}
	function loadCss(pageName) {
		mw.loader.load(
			'/w/index.php?title=${USER_PREFIX}/' + pageName + '&action=raw&ctype=text/css',
			'text/css'
		);
	}
	mw.loader.load('jquery.ui');

	// Morebits needs to be available for twinkle.js to parse
	loadJs('twinkle/morebits.js').then(function () {
		loadJs('twinkle/twinkle.js');
	});
	loadJs('twinkle/select2.js');
	loadCss('twinkle/twinkle.css');
	loadCss('twinkle/morebits.css');
	loadCss('twinkle/select2.css');
});
/* </nowiki> */
`;

// Adjust target file names if necessary
// All file paths are with respect to repository root
// Remove twinkle-pagestyles.css if deploying as user script
const deployTargets = [
	{ file: 'build/twinkle.js', target: `${USER_PREFIX}/twinkle/twinkle.js` },
	{ file: 'build/twinkle.css', target: `${USER_PREFIX}/twinkle/twinkle.css` },
	{ file: 'build/morebits.js', target: `${USER_PREFIX}/twinkle/morebits.js` },
	{ file: 'build/morebits.css', target: `${USER_PREFIX}/twinkle/morebits.css` },
	{ file: 'node_modules/twinkle-core/lib/select2.min.js', target: `${USER_PREFIX}/twinkle/select2.js` },
	{ file: 'node_modules/twinkle-core/lib/select2.min.css', target: `${USER_PREFIX}/twinkle/select2.css` },
	{ content: loaderScript, target: `${USER_PREFIX}/twinkle.js` },
];

class Deploy {
	async deploy() {
		if (!isGitWorkDirClean()) {
			log('red', '[WARN] Git working directory is not clean.');
		}
		const config = this.loadConfig();
		await this.getApi(config);
		await this.login();
		await this.makeEditSummary();
		await this.savePages();
	}

	loadConfig() {
		try {
			return require(__dirname + '/credentials.json');
		} catch (e) {
			log('red', 'No credentials.json file found.');
			return {};
		}
	}

	async getApi(config) {
		this.api = new mwn(config);
		try {
			this.api.initOAuth();
			this.usingOAuth = true;
		} catch (e) {
			if (!config.username) {
				config.username = await input('> Enter username');
			}
			if (!config.password) {
				config.password = await input('> Enter bot password', 'password');
			}
		}
		if (args.testwiki) {
			config.apiUrl = `https://test.wikipedia.org/w/api.php`;
		} else if (!config.apiUrl) {
			config.apiUrl = `https://meta.wikimedia.org/w/api.php`;
		}
		this.api.setOptions(config);
	}

	async login() {
		this.siteName = this.api.options.apiUrl.replace(/^https:\/\//, '').replace(/\/.*/, '');
		log('yellow', '--- Logging in ...');
		if (this.usingOAuth) {
			await this.api.getTokensAndSiteInfo();
		} else {
			await this.api.login();
		}
	}

	// TODO: read last saved commit hash and use that to construct a meaningful summary
	async makeEditSummary() {
		const sha = execSync('git rev-parse --short HEAD').toString('utf8').trim();
		const message = await input('> Edit summary message (optional): ');
		this.editSummary = `Commit ${sha}: ${message || 'Updated from repository'}`;
		console.log(`Edit summary is: "${this.editSummary}"`);
	}

	async readFile(filepath) {
		return (await fs.readFile(__dirname + '/../' + filepath)).toString();
	}

	async savePages() {
		await input(`> Press [Enter] to start deploying to ${this.siteName} or [ctrl + C] to cancel`);

		log('yellow', '--- starting deployment ---');

		for await (let { file, content, target } of deployTargets) {
			const label = file || 'generated loader';
			let fileText = content !== undefined ? content : await this.readFile(file);
			try {
				const response = await this.api.save(target, fileText, this.editSummary);
				if (response && response.nochange) {
					log('yellow', `━ No change saving ${label} to ${target} on ${this.siteName}`);
				} else {
					log('green', `✔ Successfully saved ${label} to ${target} on ${this.siteName}`);
				}
			} catch (error) {
				log('red', `✘ Failed to save ${label} to ${target} on ${this.siteName}`);
				logError(error);
			}
		}
		log('yellow', '--- end of deployment ---');
	}
}

function isGitWorkDirClean() {
	try {
		execSync('git diff-index --quiet HEAD --');
		return true;
	} catch (e) {
		return false;
	}
}

async function input(message, type = 'text', initial = '') {
	let name = String(Math.random());
	return (await prompts({ type, name, message, initial }))[name];
}

function logError(error) {
	error = error || {};
	console.log((error.info || 'Unknown error') + '\n', error.response || error);
}

function log(color, ...args) {
	console.log(chalk[color](...args));
}

const args = minimist(process.argv.slice(2));
new Deploy().deploy();
