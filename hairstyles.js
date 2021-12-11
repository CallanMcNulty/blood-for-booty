const hairstyles = [
	{
		tag: 'bald',
		parts: [],
	},
	{
		tag: 'bald-bandanna',
		parts: ['bandanna'],
	},
	{
		tag: 'bandanna',
		parts: ['hair-base', 'bandanna'],
	},
	{
		tag: 'short',
		parts: ['hair-base'],
	},
	{
		tag: 'crown-line',
		parts: ['hair-crown-line'],
	},
	{
		tag: 'poofy-crown-line',
		parts: ['hair-crown-line', 'hair-curly-back'],
	},
	{
		tag: 'balding',
		parts: ['hair-crown-line', 'hair-top-bit'],
	},
	{
		tag: 'single-curl',
		parts: ['hair-top-bit'],
	},
	{
		tag: 'top-knot',
		parts: ['hair-top-bit', 'hair-curly-bangs'],
	},
	{
		tag: 'pointy',
		parts: ['hair-base', 'hair-top-bit', 'hair-curly-bangs', 'hair-curly-back'],
	},
	{
		tag: 'curly-bandanna',
		parts: ['hair-base', 'bandanna', 'hair-curly-back'],
	},
	{
		tag: 'curly',
		parts: ['hair-base', 'hair-poof', 'hair-curly-back'],
	},
	{
		tag: 'curly-top',
		parts: ['hair-base', 'hair-poof'],
	},
	{
		tag: 'curly-top',
		parts: ['hair-base', 'hair-poof'],
	},
	{
		tag: 'curly-top-shaved-sides',
		parts: ['hair-poof'],
	},
	{
		tag: 'bald-long-sides',
		parts: ['hair-crown-line', 'hair-long'],
	},
	{
		tag: 'long-balding',
		parts: ['hair-crown-line', 'hair-long', 'hair-top-bit'],
	},
	{
		tag: 'long-back',
		parts: ['hair-base', 'hair-long'],
	},
	{
		tag: 'long-bandanna',
		parts: ['hair-base', 'hair-long', 'bandanna'],
	},
	{
		tag: 'long-with-bangs',
		parts: ['hair-base', 'hair-long', 'hair-straight-bangs'],
	},
	{
		tag: 'long',
		parts: ['hair-base', 'hair-long', 'hair-middle-parted'],
	},
	{
		tag: 'middle-parted',
		parts: ['hair-base', 'hair-middle-parted'],
	},
	{
		tag: 'bun',
		parts: ['hair-base', 'hair-middle-parted', 'hair-top-bit'],
	},
	{
		tag: 'bun-curly',
		parts: ['hair-base', 'hair-curly-bangs', 'hair-top-bit'],
	},
	{
		tag: 'curly-short',
		parts: ['hair-base', 'hair-curly-bangs'],
	},
];
const hairParts = [
	'bandanna',
	'hair-base',
	'hair-crown-line',
	'hair-curly-back',
	'hair-top-bit',
	'hair-curly-bangs',
	'hair-poof',
	'hair-long',
	'hair-straight-bangs',
	'hair-middle-parted',
];
const hairIds = [
	'eyebrow',
	'left-eyebrow',
	'beard',
	'hair-curly-back-left',
	'hair-curly-back-right',
	'hair-base',
	'hair-long-left',
	'hair-long-right',
	'hair-crown-line-left',
	'hair-crown-line-right',
	'hair-curly-bangs',
	'hair-straight-bangs',
	'hair-middle-parted',
	'hair-top-bit',
	'hair-poof',
];