/**
 * Allow global access for certain objects for debugging and console-based testing
 */

import { msg, Twinkle, registerModule, Api, Page } from './core';

// @ts-ignore
window.Twinkle = Twinkle;

$.extend(Twinkle, {
	registerModule,
	msg,
	Page,
	Api,
});
