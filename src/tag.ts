import { TagCore, TagMode, tagListType } from './core';

export class MetaPageTagMode extends TagMode {
	name = 'page';
	removalSupported = true;

	static isActive(): boolean {
		return (
			mw.config.get('wgNamespaceNumber') >= 0 &&
			!!mw.config.get('wgArticleId') &&
			mw.config.get('wgPageContentModel') === 'wikitext'
		);
	}

	tagList: tagListType = {
		'General maintenance': [
			{
				tag: 'Cleanup',
				description: 'Page may require cleanup to meet quality standards',
				subgroup: {
					name: 'cleanup_reason',
					type: 'input',
					label: 'Reason (optional):',
					size: 50,
					parameter: 'reason',
				},
			},
			{
				tag: 'Historical',
				description: 'Page is retained for historical interest and no longer actively maintained',
			},
			{
				tag: 'Outdated',
				description: 'Page contains outdated information',
			},
			{
				tag: 'Looks useless',
				description: 'Candidate for 60-day deletion under Meta:Deletion policy (M5)',
				subgroup: {
					name: 'looks_useless_reason',
					type: 'input',
					label: 'Reason:',
					size: 50,
					parameter: '1',
					required: true,
				},
			},
			{
				tag: 'Possible copyright infringement',
				description: 'Possible copyright violation (7-day review before G10)',
				subgroup: {
					name: 'copyvio_url',
					type: 'input',
					label: 'Source URL (optional):',
					size: 60,
					parameter: 'url',
				},
			},
		],
		'Merge & move': [
			{
				tag: 'Merge',
				description: 'Propose merging this page with another page',
				subgroup: {
					name: 'merge_target',
					type: 'input',
					label: 'Target page:',
					size: 50,
					parameter: '1',
					required: true,
				},
			},
			{
				tag: 'Move',
				description: 'Propose moving this page to another title',
				subgroup: {
					name: 'move_target',
					type: 'input',
					label: 'Proposed new title:',
					size: 50,
					parameter: '1',
					required: true,
				},
			},
		],
		'File maintenance': [
			{
				tag: 'No source',
				description: 'File is missing source information (eligible for I2 after 1 week)',
			},
			{
				tag: 'No license',
				description: 'File is missing licence information (eligible for I2 after 1 week)',
			},
			{
				tag: 'Orphan file',
				description: 'Unused file on Meta-Wiki',
			},
		],
	};
}

TagCore.modeList = [MetaPageTagMode];

export class Tag extends TagCore {
	footerlinks = {
		'Meta:Maintenance templates': 'Category:Maintenance templates',
	};
}
