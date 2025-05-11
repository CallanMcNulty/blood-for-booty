const skill = {
	swashbucklin: { name: 'Swashbucklin’', description: 'Stabbin’, Tauntin’ and Swingin’ on ropes all included.' },
	swaggerin: { name: 'Swaggerin’', description:'Wearing impressive hats, shouting loudly and inspiring fear in others.' },
	stealin: { name: 'Stealin’', description:'Finding and claiming Booty.' },
	shootin: { name: 'Shootin’', description:'Firing cannons and pistols.' },
};

const flaw = {
	scummy: { name: 'Scummy', description:'This pirate is so repulsive that any non-Scummy pirates will refuse to work with them on jobs.' },
	scaredy: { name: 'Scaredy', description:'Whenever there is any sort of Event that would affect this pirate there is a 1 in 2 chance that they hide somewhere and take no part in the event.' },
	seasick: { name: 'Seasick', description:'Each week there is a 1 in 3 chance that this pirate can do nothing but vomit and sleep until the next week, but consumes grog as normal.' },
	swigger: { name: 'Swigger', description:'Each week, this pirate may drink extra Grog.' },
	scrapper: { name: 'Scrapper', description:'Whenever this pirate is set on a job, there is a 1 in 6 chance that they get into a brawl with another pirate on that job, preventing both of them from doing any work.' },
};

const legend = {
	terrible: { name: 'Terrible', skills: [ skill.swaggerin, skill.swashbucklin ], description:'Any pirates put on a job with this pirate ignore the effects of Seasick and Scrapper Flaws.' },
	backstabber: { name: 'Backstabber', skills: [ skill.stealin, skill.swashbucklin ], description:'Whenever this pirate returns to port they will murder a few people and gain 1-6 Booty. However, there is a 1 in 6 chance they get thrown in jail until the next time the ship returns to port.' },
	bloody: { name: 'Bloody', skills: [ skill.shootin, skill.swashbucklin ], description:'Whenever this pirate would be killed, there is a 1 in 2 chance that they manage to claw themselves out of the situation somehow and are unharmed.' },
	bastard: { name: 'Bastard', skills: [ skill.swaggerin, skill.stealin ], description:'This pirate has an enemy in every port. Upon arriving in port they get in a few brawls and may be killed or may beat up an enemy so badly they join the crew out of admiration.' },
	killer: { name: 'Killer', skills: [ skill.swaggerin, skill.shootin ], description:'Whenever you wish you may pause the game and have this pirate shoot another crew member dead.' },
	plunderer: { name: 'Plunderer', skills: [ skill.stealin, skill.shootin ], description:'Whenever the crew gain any Booty with this pirate present they gain an additional 1-6 Booty.' },
};

const feature = {
	noNose: { name: 'No Nose', description:'No nose? Then how do they smell? Terrible.' },
	blind: { name: 'Blind', description:'Sometimes an eyepatch doesn’t cut it anymore.' },
	parrot: { name: 'Parrot', description:'Better stay stocked up on crackers.' },
	toothless: { name: 'Toothless', description:'No good dentists on a pirate ship.' },
	eyepatch: { name: 'Eyepatch', description:'Classic.' },
	beard: { name: 'Beard', description:'Be it black, red, or brown, a beard is the mark of a true pirate.' },
	earrings: { name: 'Earrings', description:'Every stylish pirate sports a pair of golden hoops.' },
	pegLeg: { name: 'Peg Leg', description:'Your leg’s off, but don’t worry—we put on a table leg instead!' },
	hook: { name: 'Hook', description:'They’ve got us all hooked.' },
	tattoos: { name: 'Tattoos', description:'All inked up.' },
	monkey: { name: 'Monkey', description:'"Eeeee eeeee oooooo ooo aaaaha eeee aaaaah!"' },
	leftHook: { name: 'Lefty Hook', description:'Like a normal hook, but for left-handed pirates.' },
	rat: { name: 'Rat', description:'An unexpected friend.' },
	crab: { name: 'Crab', description:'A pet crab? Oh, how… cute.' },
	prettyDress: { name: 'Pretty Dress', description:'How chic!' },
	crocophobia: { name: 'Crocophobia', description:'If the crew ever comes across crocs again, this pirate will keel over and die from fear.' },
};

const pirateFlagText = {
	hook_club: { name:'Hook Club Member', description:'Members of the Hook Club insist on working together on any jobs.' },
	hurt_hand: { name:'Hurt Hand', description:'They get the week off to recover from their injury.' },
	cursed: { name:'The Black Spot', description:'This pirate has been cursed with exceptionally bad luck.' },
	blessed: { name:'Blessed', description:'This pirate has exceptionally good luck.' },
	whale_obsession: { name:'White Whale Obsession', description:'While captaining the ship, will chase the white whale without stopping anywhere else until it is caught.' },
	caver: { name:'Caver', description:'On islands they prefer to wander around in caves instead of exploring.' },
	fated: { name:'Drank from Fate Fountain', description:'They have the power to alter fate.' },
	glimpsed_hell: { name:'Glimpsed Hell', description:'Found religion after glimpsing Pirate Hell.' },
	scurvy: { name:'Scurvy', description:'This pirate has a vitamin deficiency and will die if their scurvy flares up again.' },
	beard_lice: { name:'Beard Lice', description:'Nobody wants to work with a lousy pirate.' },
	boxed: { name:'In a Box', description:'They are trapped in a box and can’t do anything.' },
	gangrenous: { name:'Gangrenous', description:'They are in too much pain to do anything.' },
	homesick: { name:'Homesick', description:'While captain, this pirate will head directly to port and spend Booty on luxuries.' },
	ate_bad_fruit: { name:'Ate Bad Fruit', description:'This pirate will be sickly for a time.' },
	no_heading_change: { name:'Unwilling to Change Heading', description:'This pirate has a goal and will not change heading while they are the captain.' },
	as_seasick: { name:'Sickly', description:'May be too sick to work some weeks.' },
};

const shipFlagText = {
	bad_grog: { name:'Bad Grog', description:'Our stores of grog are bad and making the pirates sick.' },
	rats: { name:'Rats', description:'This ship is infested with rats. They may damage the supplies.' },
	haunted: { name:'Haunted', description:'A ghost was sighted on the ship, and the crew are scared.' },
	scurvy: { name:'Scurvy', description:'A lack of fresh fruit is making the crew sick.' },
	bad_compass: { name:'Indecisive Compass', description:'Something’s not right with the compass.' },
	barnacles: { name:'Barnacles', description:'There are more barnacles than usual. We have to get these removed.' },
	uncertain_navigation: { name:'Navigating Blind', description:'We’re in a section of the ocean that is to misty to navigate properly.' },
	curse: { name:'Cursed Booty', description:'Some of our Booty was taken from a cursed ship.' },
	dolphin_guides: { name:'Dolphin Guides', description:'Dolphins are helping us avoid danger.' },
	carrying_high_value_goods: { name:'High Value Cargo', description:'Hopefully this can be sold for a profit.' },
	carrying_messenger: { name:'Messenger', description:'We are carrying a passenger with a message to deliver.' },
	broken_mast: { name:'Broken Mast', description:'The ship will not function until the crew repair the mast.' },
	mast_rot: { name:'Collapsed Mast', description:'Sails will be less effective until the mast can be repaired at a port.' },
	hull_damage: { name:'Hull Damage', description:'The ship needs 10 Booty worth of repairs.' },
	treasure_map: { name:'Treasure Map', description:'The ship is carrying a treasure map that will help leap us to the most profitable location.' },
	becalmed: { name:'Becalmed', description:'We are in the doldrums and cannot proceed until the wind picks up.' },
	waiting_castaway: { name:'Waiting Castaway', description:'We received a message from a castaway who is now waiting to be rescued.' },
};

const featureTable = [
	feature.beard,
	feature.noNose,
	feature.blind,
	feature.parrot,
	feature.toothless,
	feature.eyepatch,
	feature.pegLeg,
	feature.hook,
	feature.tattoos,
	feature.monkey,
	feature.leftHook,
];

async function mutiny(pirate) {
	if(!pirate || crew.length < 2) {
		return { continueText:'Maintain status quo', description:'No mutiny is possible for this crew.' };
	}
	if(pirate.captain) {
		await kill(randomResult(crew, [pirate]), 'walked the plank', true);
		return { continueText:'Acknowledge Captain’s authority', description:`${getPirateName(pirate)} kills a crew member to show everyone who’s boos.` };
	}
	let result = roll() + skillValue([pirate], skill.swashbucklin);
	if(result < 6) {
		await kill(pirate, 'walked the plank', true);
		return { description: `The Captain defeats ${getPirateName(pirate)}, who is forced to walk the plank.`, continueText: 'Don’t cross the Captain' };
	} else {
		let oldCaptain = getCaptain();
		await assignCaptain(pirate);
		await kill(oldCaptain, 'was killed in a mutiny', true);
		return { continueText:'Hail to the new Captain', description:`${getPirateName(pirate)} kills the old Captain and takes control of the ship.` };
	}
}

const soberPirateTable = [
	{
		name: 'Abandon Ship',
		description: 'A pirate can take no more of this ship.',
		continue: 'Make a break for freedom',
		handler: async (pirate) => {
			if(doesNotDoAnything(pirate)) {
				return { continueText:'Stick around after all', description:'The pirate tries to jump into the sea but is unable.' };
			}
			await kill(pirate, 'swam into the horizon', false);
			return { continueText:'Wish them luck', description:`${getPirateName(pirate)} jumps into the sea and swims into the horizon.` };
		}
	},
	{
		name: 'Mutiny',
		description: 'A pirate decides they could do a better job of running the ship.',
		continue: 'Commence mutiny',
		handler: mutiny
	},
	{
		name: 'Go Berserk',
		description: 'A pirate goes murderously mad.',
		continueText: 'Blow up',
		handler: async (pirate) => {
			let victim = null;
			if(crew.length > 1) {
				victim = randomResult(crew, [pirate]);
				await kill(victim, `was killed by ${getPirateName(pirate)} in a berserk rage`, true);
			}
			await kill(pirate, 'died in a berserk rage', true);
			return { continueText:'It’s always the quiet ones', description:`${getPirateName(pirate)} goes mad,${victim ? ` murders ${getPirateName(victim)},` : ''} and dies of shock.` };
		}
	},
];

const captainsMadnessTable = [
	{
		name: 'Traitor Hunt!',
		description: 'The Captain is becoming paranoid, searching for traitors to force off the ship.',
		continueText: 'Commence hunt',
		handler: async () => {
			let cap = getCaptain();
			if(!doesNotDoAnything(cap)) {
				let availableCrew = await filterNonScared(crew);
				let killCount = 0;
				for(let pirate of availableCrew) {
					if(pirate == cap || !crew.includes(pirate)) {
						continue;
					}
					let result = roll(pirate);
					if(result == 1) {
						await kill(pirate, 'walked the plank', true);
						killCount++;
					}
				}
				if(killCount) {
					return { continueText:'Pray the witch-hunt ends', description:`The Captain executes ${killCount} "traitors".` };
				}
			}
			return { description:'But no traitors are found.' };
		}
	},
	{
		name: 'Drink!',
		description: 'The Captain decides getting drunk is more entertaining than working.',
		continueText: 'Bottoms up',
		handler: async () => { incrementGrog(-roll()); }
	},
	{
		name: 'Deterioration',
		description: 'The Captain’s physical and mental heath is waning.',
		continueText: 'Be strong',
		handler: async () => {
			let captain = getCaptain();
			let startingAttributes = [...captain.attributes];
			let rolledFlaw = await rollFlaw(captain);
			if(startingAttributes.includes(rolledFlaw)) {
				await kill(captain, 'died of scurvy', true);
				return { continueText:'Give them a proper burial at sea', description:'The Captain succumbed to poor health.' };
			}
		}
	},
	{
		name: 'Homesick',
		description: 'The Captain has had enough of the sea.',
		continueText: 'Set bearing for Port',
		handler: async () => {
			let cap = getCaptain();
			if(doesNotDoAnything(cap)) {
				return { continueText:'Keep original heading', description:'The Captain is unable to change the heading.' };
			}
			headingToIsland = false;
			cap.voyageFlags.add('homesick');
			cap.voyageFlags.add('no_heading_change');
			return { continueText:'Continue to Port', description:'Now heading to Port. Upon arrival the Captain will spend 2-12 Booty on luxuries before realising that life on land is expensive and returning to the crew.' };
		}
	},
	{
		name: 'Put on a Show!',
		description: 'This week the crew must all work the Helm as the Captain forces them to be entertaining.',
		continueText: 'The show must go on',
		handler: async () => {
			crew.forEach(pirate => pirate.job = 'helm');
		}
	},
	{
		name: 'Change of Heart',
		description: 'The Captain decides to change the ship’s bearing to the opposite of what it currently is, on a whim.',
		continueText: 'Change course',
		handler: async () => {
			let cap = getCaptain();
			if(doesNotDoAnything(cap)) {
				return { continueText:'Keep original heading', description:'The Captain is unable to change the heading.' };
			}
			headingToIsland = !headingToIsland;
			cap.voyageFlags.add('no_heading_change');
		}
	},
];
