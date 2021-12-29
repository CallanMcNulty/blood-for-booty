const skill = {
	swashbucklin: { name: 'Swashbucklin’' },
	swaggerin: { name: 'Swaggerin’' },
	stealin: { name: 'Stealin’' },
	shootin: { name: 'Shootin’' },
};

const flaw = {
	scummy: { name: 'Scummy' },
	scaredy: { name: 'Scaredy' },
	seasick: { name: 'Seasick' },
	swigger: { name: 'Swigger' },
	scrapper: { name: 'Scrapper' },
};

const legend = {
	terrible: { name: 'The Terrible', skills: [ skill.swaggerin, skill.swashbucklin ] },
	backstabber: { name: 'The Backstabber', skills: [ skill.stealin, skill.swashbucklin ] },
	bloody: { name: 'The Bloody', skills: [ skill.shootin, skill.swashbucklin ] },
	bastard: { name: 'The Bastard', skills: [ skill.swaggerin, skill.stealin ] },
	killer: { name: 'The Killer', skills: [ skill.swaggerin, skill.shootin ] },
	plunderer: { name: 'The Plunderer', skills: [ skill.stealin, skill.shootin ] },
};

const feature = {
	noNose: { name: 'No Nose' },
	blind: { name: 'Blind' },
	parrot: { name: 'Parrot' },
	toothless: { name: 'Toothless' },
	eyepatch: { name: 'Eyepatch' },
	beard: { name: 'Beard' },
	pegLeg: { name: 'Peg Leg' },
	hook: { name: 'Hook' },
	tattoos: { name: 'Tattoos' },
	monkey: { name: 'Monkey' },
	leftHook: { name: 'Lefty Hook' },
	rat: { name: 'Rat' },
	crab: { name: 'Crab' },
	prettyDress: { name: 'Pretty Dress' },
	crocophobia: { name: 'Crocophobia' },
};

const featureTable = [
	feature.noNose,
	feature.blind,
	feature.parrot,
	feature.toothless,
	feature.eyepatch,
	feature.beard,
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
		return { continueText:'Acknowledge captain’s authority', description:`${getPirateName(pirate)} kills a crew member to show everyone who’s boos.` };
	}
	let result = roll() + skillValue([pirate], skill.swashbucklin);
	if(result < 6) {
		await kill(pirate, 'walked the plank', true);
		return { description: `The captain defeats ${getPirateName(pirate)}, who is forced to walk the plank.`, continueText: 'Don’t cross the captain' };
	} else {
		let oldCaptain = getCaptain();
		await assignCaptain(pirate);
		await kill(oldCaptain, 'was killed in a mutiny', true);
		return { continueText:'Hail to the new captain', description:`${getPirateName(pirate)} killed the old captain and took control of this ship.` };
	}
}

const soberPirateTable = [
	{
		name: 'Abandon Ship',
		description: 'The pirate can take no more of this ship.',
		continue: 'Make a break for freedom',
		handler: async (pirate) => {
			if(doesNotDoAnything(pirate)) {
				return { continueText:'Stick around after all', description:'The pirate tries to jump into the sea but is unable.' };
			}
			await kill(pirate, 'swam into the horizon', false);
		}
	},
	{
		name: 'Mutiny',
		description: 'The pirate decides they could do a better job of running the ship.',
		continue: 'Commence mutiny',
		handler: mutiny
	},
	{
		name: 'Go Berserk',
		description: 'The pirate goes murderously mad.',
		continueText: 'Blow up',
		handler: async (pirate) => {
			if(crew.length > 1) {
				let victim = randomResult(crew, [pirate]);
				await kill(victim, `was killed by ${getPirateName(pirate)} in a berserk rage`, true);
			}
			await kill(pirate, 'died in a berserk rage', true);
		}
	},
];

const captainsMadnessTable = [
	{
		name: 'Traitor Hunt!',
		description: 'The captain is becoming paranoid, searching for traitors to force off the ship.',
		continueText: 'Commence hunt',
		handler: async () => {
			let cap = getCaptain();
			if(doesNotDoAnything(cap)) {
				return;
			}
			let availableCrew = filterEventTargets(crew);
			for(let pirate of availableCrew) {
				if(pirate == cap || !crew.includes(pirate)) {
					continue;
				}
				let result = roll(pirate);
				if(result == 1) {
					await kill(pirate, 'walked the plank', true);
				}
			}
		}
	},
	{
		name: 'Drink!',
		description: 'The captain decides getting drunk is more entertaining than working.',
		continueText: 'Bottoms up',
		handler: async () => { incrementGrog(-roll()); }
	},
	{
		name: 'Deterioration',
		description: 'The captain’s physical and mental heath is waning.',
		continueText: 'Be strong',
		handler: async () => {
			let captain = getCaptain();
			let startingAttributes = [...captain.attributes];
			let rolledFlaw = await rollFlaw(captain);
			if(startingAttributes.includes(rolledFlaw)) {
				await kill(captain, 'died of scurvy', true);
			}
		}
	},
	{
		name: 'Homesick',
		description: 'The captain has had enough of the sea.',
		continueText: 'Set bearing for Port',
		handler: async () => {
			let cap = getCaptain();
			if(doesNotDoAnything(cap)) {
				return { continueText:'Keep original heading', description:'The captain is unable to change the heading.' };
			}
			headingToIsland = false;
			cap.voyageFlags.add('homesick');
			cap.voyageFlags.add('no_heading_change');
			return { continueText:'Continue to Port', description:'Now heading to Port. Upon arrival the captain will spend 2-12 Booty on luxuries before realising that life on land is expensive and returning to the crew.' };
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
		description: 'The captain decides to change the ship’s bearing to the opposite of what it currently is, on a whim.',
		continueText: 'Change course',
		handler: async () => {
			let cap = getCaptain();
			if(doesNotDoAnything(cap)) {
				return { continueText:'Keep original heading', description:'The captain is unable to change the heading.' };
			}
			headingToIsland = !headingToIsland;
			cap.voyageFlags.add('no_heading_change');
		}
	},
];