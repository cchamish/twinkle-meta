/**
 * This file combines Jest's expect with chai's expect.
 * Chai-as-promised is also smashed in.
 *
 * Adapted from https://gist.github.com/0xR/9232db946e3198ef619168a33a92232d
 *
 */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

// Make sure chai and jest ".not" play nice together
const originalNot = Object.getOwnPropertyDescriptor(chai.Assertion.prototype, 'not').get;
Object.defineProperty(chai.Assertion.prototype, 'not', {
	get() {
		Object.assign(this, this.assignedNot);
		return originalNot.apply(this);
	},
	set(newNot) {
		this.assignedNot = newNot;
	},
});

// Combine both jest and chai matchers on expect
// @ts-ignore
const originalExpect = global.expect;
// @ts-ignore
global.expect = (actual) => {
	const originalMatchers = originalExpect(actual);
	const chaiMatchers = chai.expect(actual);
	return Object.assign(chaiMatchers, originalMatchers);
};

// Now fix the types
declare global {
	namespace jest {
		interface Matchers<R, T = {}> extends Chai.LanguageChains {}
	}
}

if (typeof (global as any).Morebits === 'undefined') {
	(global as any).Morebits = {
		userIsSysop: false,
		userIsInGroup: () => false,
		pageNameNorm: 'Test page',
		ip: { isRange: () => false, validCIDR: () => false },
		string: {
			escapeRegExp: (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
			toUpperCaseFirstChar: (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : ''),
			formatReasonText: (s: string) => s.trim(),
			isInfinity: (s: string) => ['infinity', 'indefinite', 'infinite', 'never'].includes(s),
		},
		wiki: {
			api: class {},
			page: class {},
			user: class {},
		},
		simpleWindow: class {},
		quickForm: class {},
		status: {
			init: () => {},
			info: () => {},
			warn: () => {},
			error: () => {},
			actionCompleted: () => {},
		},
	};
}

// Need to export something for the declare global to work
export {};
