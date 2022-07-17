const portHappeningTable = [
	{
		name: 'We have no Grog today',
		description: 'This port has no grog for sale! None at all!',
		continueText: 'Get by on water',
		handler: async () => {
			shipWeeklyFlags.add('no_grog_sale');
			updatePort();
		}
	},
	{
		name: 'The Black Spot',
		description: 'A hunched stranger gives one pirate the Black Spot! From now on whenever an event could negatively affect this pirate, it does.',
		continueText: 'Not the Black Spot!',
		handler: async () => {
			let cursedPirate = randomResult(crew);
			cursedPirate.permanentFlags.add('cursed');
			await addToLog(`${getPirateName(cursedPirate)} was cursed with exceptionally bad luck`);
		}
	},
	{
		name: 'The Governor’s Spouse',
		description: 'The Governor’s spouse is making eyes at a pirate.',
		continueText: 'Go for it',
		handler: async () => {
			let available = filterByAttr(filterEventTargets(crew), skill.swaggerin);
			if(available.length == 0) {
				return { continueText:'There are other fish in the sea', description:'It looks like they weren’t interested after all.' };
			}
			let seducer = randomResult(available);
			let result = roll();
			if(result < 3) {
				await kill(seducer, 'was hung for seducing the wrong person', true);
			} else if(result < 5) {
				let stolen = roll();
				incrementBooty(stolen);
				return { continueText:'Congratulate our mate', description:`${getPirateName(seducer)} finishes their business and steals ${stolen} Booty on the way out.` };
			} else {
				await rollPirate();
				return { continueText:'Welcome to the crew', description:'The spouse gives up their life of luxury and joins the crew as a new pirate.' };
			}
		}
	},
	{
		name: 'Attack the Mansion',
		description: 'Some pirates are raiding the Governor’s mansion.',
		continueText: 'Join in',
		handler: async () => {
			let available = filterEventTargets(filterEventActors(crew));
			let joined = await getChoice('Up to 4 pirates can join the raid. Which ones will go?', pirateOptions(available), 0, 4);
			if(joined.length == 0) {
				await addToLog('Did not participate in the mansion attack');
				return;
			}
			let result = roll() + joined.length;
			if(result < 5) {
				let stolen = roll()
				incrementBooty(stolen);
				let deaths = roll();
				await killRandomPirates(joined, 'was killed while raiding', deaths);
				return { continueText:'Anything for Booty', description:`The crew manages to grab ${stolen} Booty, but ${deaths} pirate(s) died.` };
			} else if(result < 7) {
				let killed = randomResult(joined);
				await kill(killed, 'was killed while raiding', true);
				var desc = `but ${getPirateName(killed)} was killed.`;
			} else {
				await rollPirate();
				var desc = `and a new pirate joins the crew.`;
			}
			let totalStolen = 0;
			for(let p of joined) {
				if(crew.includes(p)) {
					totalStolen += roll() * hasAttribute(p, skill.stealin);
				}
			}
			incrementBooty(totalStolen);
			return { continueText:'Anything for Booty', description: `The crew manages to grab ${totalStolen} Booty, ${desc}` };
		}
	},
	{
		name: 'Exceptional Service',
		description: 'Each Pirate will spend an additional Booty on the essentials at this port, due to the quality of goods being particularly high.',
		continueText: 'Pay up',
		handler: async () => {
			shipWeeklyFlags.add('double_port_cost');
		}
	},
	{
		name: 'Under Siege',
		description: 'The port is being bombarded by a rival.',
		continueText: 'Brave the cannon fire',
		handler: async () => {
			let result = roll();
			if(result < 3) {
				let piratesKilled = roll();
				await killRandomPirates(filterEventTargets(crew), 'was hit by cannon fire', piratesKilled);
				return { continueText:'Make port', description:`The ship is hit by cannon fire and ${piratesKilled} pirates are killed.` };
			} else if(result < 5) {
				incrementGrog(-grog);
				return { continueText:'Not the grog!', description:`The fire hits the store and all grog is lost.` };
			} else {
				return { description:`The ship makes it to port safely and may trade as normal.` };
			}
		}
	},
	{
		name: 'Grog Sale',
		description: 'Grog is half price here! 2 Grog may be bought for 1 Booty.',
		continueText: 'Start saving',
		handler: async () => {
			shipWeeklyFlags.add('half_grog_cost');
		}
	},
	{
		name: 'Old Enemy',
		description: 'One pirate must fight an old foe.',
		continueText: 'Do what you must',
		handler: async () => {
			let availableCrew = filterEventTargets(filterEventActors(crew));
			if(availableCrew.length == 0) {
				return { description:`It turns out to have been a case of mistaken identity. Nobody has to fight after all.` };
			}
			let fighter = availableCrew[0];
			let result = roll(fighter) + skillValue([fighter], skill.swashbucklin) + skillValue([fighter], skill.shootin);
			if(result < 4) {
				await kill(fighter, 'was killed in a duel', true);
				return { continueText:'An honorable death', description:`${getPirateName(fighter)} loses the duel.` };
			} else {
				incrementBooty(1);
				return { description:`${getPirateName(fighter)} wins the duel and steals 1 Booty.` };
			}
		}
	},
	{
		name: 'Fire',
		description: 'This port is ruined by a recent fire. Only a limited amount of trading is possible, but the crew will not spend any Booty on the essentials, as the required establishments are burnt down.',
		continueText: 'Trade what we can',
		handler: async () => {
			shipWeeklyFlags.add('no_port_cost');
			let result = roll()+roll();
			tradableBooty = result;
			updatePort();
			await addToLog(`Transactions are limited to ${result} Booty at this port`);
		}
	},
	{
		name: 'Business Opportunity',
		description: 'There’s a chance to make some serious Booty on a risky purchase. The goods cost 10 Booty and are apparently in high demand at a nearby port. If the crew buy the goods they may try to sell them next time they arrive at a port.',
		continueText: 'Consider the offer',
		handler: async () => {
			if(booty < 10) {
				return { continueText:'Maybe next time', description:`We do not have enough Booty for this business.` };
			}
			let doIt = await getChoice('Should 10 Booty be spent on the goods?', [
				{ value: true, text: 'Yes.' },
				{ value: false, text: 'No, it’s too risky.' },
			]);
			if(doIt) {
				incrementBooty(-10);
				shipVoyageFlags.add('carrying_high_value_goods');
				await addToLog('High value goods purchased');
			}
		}
	},
	{
		name: 'Settling Down',
		description: 'This place is nice! Pirates may decide to give up the pirate life and settle down here.',
		continueText: 'Wish them luck',
		handler: async () => {
			let availableCrew = [...crew];
			for(let pirate of availableCrew) {
				if(roll(pirate) == 1) {
					await kill(pirate, 'left the pirate life', false);
				}
			}
		}
	},
	{
		name: 'Scum and Villainy',
		description: 'This place isn’t so nice.',
		continueText: 'Try to stay out of trouble',
		handler: async () => {
			let availableCrew = filterEventTargets(crew);
			for(let pirate of availableCrew) {
				let result = roll(pirate);
				if(result == 1) {
					await kill(pirate, 'was killed by a brigand', true);
				} else if(result == 2) {
					incrementBooty(-1);
					await addToLog(`${getPirateName(pirate)} was robbed of 1 Booty`);
				} else if(result == 3) {
					await addToLog(`${getPirateName(pirate)} got into a few scraps and ate some bad food`);
				}
			}
		}
	},
	{
		name: 'High Demand',
		description: 'There is a certain piece of Booty that is of great value to the residents here.',
		continueText: 'Search our hold',
		handler: async () => {
			if(booty == 0) {
				return { continueText:'Keep an eye out', description:'We do not have the Booty they want.' };
			}
			incrementBooty(14);
			return { continueText:'We’ll take it', description:'We are able to trade 1 Booty for 15!' };
		}
	},
	{
		name: 'Special Offer',
		description: 'There’s an offer on Grog here.',
		continueText: 'Ask about it',
		handler: async () => {
			if(booty < 19) {
				return { continueText:'We’ll take it', description:'They’re selling 20 Grog for just 19 Booty, but we can’t afford it.' };
			}
			let doIt = await getChoice('Should we buy 20 Grog for just 19 Booty?', [
				{ value: true, text: 'Yes!' },
				{ value: false, text: 'No, it tastes strange.' },
			]);
			if(doIt) {
				incrementBooty(-19);
				incrementGrog(20);
			}
		}
	},
	{
		name: 'Legendary Sea Dog',
		description: 'Rumor has it a legendary pirate is in town.',
		continueText: 'Find out who it is',
		handler: async () => {
			let legendOptions = Object.values(legend)
				.filter(l => pirates.find(p => !(hasAttribute(p, legend) && p.alive)))
				.map(l => ({ value:l, text:l.name }))
			;
			if(legendOptions.length == 0) {
				return { continueText:'Our crew is already legendary', description:'It turns out the rumors were about our own crew!' };
			}
			let chosenLegend = await getChoice('What is this legendary pirate famous for?', legendOptions);
			let newPirate = await rollPirate(false);
			await addAttribute(newPirate, chosenLegend.skills[0]);
			await addAttribute(newPirate, chosenLegend.skills[1]);
			return { continueText:'Welcome our new mate', description:`${getPirateName(newPirate)} agreed to join our crew!` };
		}
	},
	{
		name: 'Disease Hole',
		description: 'It appears a pox reached this port before we did.',
		continueText: 'Don’t get too close to anyone',
		handler: async () => {
			let availableCrew = filterEventTargets(crew);
			for(let pirate of availableCrew) {
				if(roll(pirate) < 3) {
					pirate.voyageFlags.add('as_seasick');
					await addToLog(`${getPirateName(pirate)} became sick`);
				}
			}
		}
	},
	{
		name: 'Burning Love',
		description: 'There’s a nasty infection going around Port.',
		continueText: 'Keep your distance',
		handler: async () => {
			let availableCrew = filterEventTargets(crew);
			for(let pirate of availableCrew) {
				if(roll(pirate) == 1) {
					await addAttribute(pirate, flaw.scummy);
					await addToLog(`${getPirateName(pirate)} caught the infection and became Scummy`);
				}
			}
		}
	},
	{
		name: 'Witch Hunt',
		description: 'The captain is accused of being a witch!',
		handler: async () => {
			let availableCrew = filterEventTargets(crew);
			let rescue = await getChoice('Should the crew intervene?', [
				{ value: true, text: 'Rescue the captain, no matter the risk' },
				{ value: false, text: 'Let them burn' },
			]);
			let captainKilled = !rescue;
			if(rescue) {
				let result = roll() + skillValue(availableCrew, skill.shootin) + skillValue(availableCrew, skill.swashbucklin);
				if(result < 6) {
					await killRandomPirates(availableCrew, 'was killed in an attempt to rescue their captain', roll());
				} else {
					return { continueText:'Back to the ship', description:'The rescue attempt works and the crew all escape!' };
				}
			}
			if(captainKilled) {
				await kill(getCaptain(), 'was burned at the stake for witchcraft', true);
			}
		}
	},
	{
		name: 'I’m Commandeering this Ship',
		description: 'An insane navy officer demands to take control of the ship.',
		handler: async () => {
			let allow = await getChoice('Should the crew give in?', [
				{ value: true, text: 'Yes, let them become the new captain' },
				{ value: false, text: 'No, make them fight for it' },
			]);
			if(!allow) {
				let currentCaptain = getCaptain();
				let result = roll(currentCaptain) + skillValue([currentCaptain], skill.swashbucklin);
				if(result < 4) {
					await assignCaptain(await rollPirate());
					await kill(currentCaptain, 'was killed in a duel for control of the ship', true);
				} else {
					shipWeeklyFlags.add('skip_port_actions');
				}
			} else {
				await assignCaptain(await rollPirate());
			}
		}
	},
	{
		name: 'Docking Fee',
		description: 'If the crew wants to stay docked here it will cost them.',
		handler: async () => {
			if(booty < 5) {
				shipWeeklyFlags.add('skip_port_actions');
				return { continueText:'Keep sailing', description:'We do not have enough Booty to pay.' };
			}
			let pay = await getChoice('Pay the 5 Booty?', [
				{ value: true, text: 'Yes' },
				{ value: false, text: 'No, just keep sailing' },
			]);
			if(pay) {
				incrementBooty(-5);
			} else {
				shipWeeklyFlags.add('skip_port_actions');
			}
		}
	},
	{
		name: 'Labour Strike',
		description: 'The workers at this port are striking.',
		continueText: 'Check it out',
		handler: async () => {
			let joined = false;
			for(let pirate of crew) {
				if(roll(pirate) == 6) {
					joined = true;
					pirate.weeklyFlags.add('striking');
					await addToLog(`${getPirateName(pirate)} joined the strike`);
				}
			}
			if(joined) {
				return { continueText:'Power to the people', description: 'Moved by the plight of the workers, some pirates join in the labour strikes rather than spending their Booty in the normal way' };
			}
		}
	},
	{
		name: 'Gambling Den',
		description: 'The captain heads into this den.',
		continueText: 'Place a bet',
		handler: async () => {
			let amount = await getNumberInput('They may gamble any amount of Booty', 'What should the initial stake be?', 'Bet', 0, booty);
			incrementBooty(-amount);
			do {
				let result = roll();
				if(result < 3) {
					return { continueText:'Swear off gambling', description:'The captain looses all the Booty and is thrown out of the den.' };
				} else if(result < 5) {
					incrementBooty(amount);
					return { continueText:'Leave the den', description:'After a while the captain gets bored and quits, taking their winnings with them.' };
				} else {
					amount *= 2;
					await addToLog(`The captain doubled their stake and continued gambling with ${amount} Booty`);
				}
			} while(true);
		}
	},
	{
		name: 'Fancy Ball',
		description: 'The captain is invited to a fancy ball.',
		continueText: 'Get dressed',
		handler: async () => {
			let outfitCost = roll();
			await addToLog(`${outfitCost} spent on a new outfit`);
			let result = roll();
			if(result < 3) {
				shipWeeklyFlags.add('skip_port_actions');
				return { continueText:'Get out of here', description:'The captain accidentally shoots the governor in the back, and the ship flees port immediately.' };
			} else if(result < 5) {
				let stolen = roll();
				incrementBooty(stolen);
				return { continueText:'Appreciate the free meal', description:`The captain pockets ${stolen} Booty, eats some food and then leaves.` };
			} else {
				await addAttribute(getCaptain(), skill.swaggerin);
				await rollPirate();
				return { continueText:'Blow a kiss goodbye', description:`The captain is the toast of the ball! They gain Swaggerin', and a young noble decides to join the crew as a new pirate.` };
			}
		}
	},
	{
		name: 'Port Romance',
		description: 'One pirate is particularly taken by one of the locals.',
		continueText: 'Could it be love?',
		handler: async () => {
			let availableCrew = filterEventTargets(crew);
			let lover = randomResult(availableCrew);
			let result = roll();
			incrementBooty(-result);
			await addToLog(`${getPirateName(lover)} spent ${result} extra Booty on their new sweetheart`);
			if(result == 1) {
				await kill(lover, 'left the pirate life', false);
			}
		}
	},
	{
		name: 'Pet Shop',
		description: 'There are many unusual pets for sale here.',
		continueText: 'Take a look',
		handler: async () => {
			let buyer = randomResult(crew);
			let petFeatures = [ feature.parrot, feature.monkey, feature.rat, feature.crab ];
			let desiredPet = randomResult(petFeatures.filter(a => !buyer.attributes.includes(a)));
			if(desiredPet) {
				incrementBooty(-5);
				await addAttribute(buyer, desiredPet);
				return { continueText:'How cute!', description:`${getPirateName(buyer)} decides to spend 5 Booty on a new ${desiredPet.name}.` };
			}
		}
	},
	{
		name: 'Quality Prosthetics',
		description: 'There are fancy replacements for hooks, eyepatches and peg-legs for sale here.',
		continueText: 'Get all the dismembered crew hooked up',
		handler: async () => {
			let dismembered = crew.filter(p => hasAttribute(p, feature.pegLeg) || hasAttribute(p, feature.eyepatch) || hasAttribute(p, feature.hook) || hasAttribute(p, feature.leftHook));
			let price = 0;
			for(let p of dismembered) {
				price += roll();
			}
			incrementBooty(-price);
		}
	},
	{
		name: 'Con Artist',
		description: 'The captain is conned out of 10 Booty!',
		continueText: 'Try to recover it',
		handler: async () => {
			let result = roll();
			if(result < 5) {
				incrementBooty(-10);
				return { continueText:'Don’t get fooled again', description:'The con artist gets away.' };
			} else if(result < 6) {
				return { continueText:'Good riddance', description:'The captain kills the con artist and takes the Booty back.' };
			} else {
				let newPirate = await rollPirate(false);
				await addAttribute(newPirate, skill.stealin);
				return { continueText:'Get grifting with our new mate', description:'The captain catches the con artist and they returns the Booty and offers to join the crew.' };
			}
		}
	},
	{
		name: 'Wanted Sign',
		description: 'One pirate is a wanted man here. If the crew leave immediately, without spending any Booty, nothing will come of it.',
		handler: async () => {
			let leave = await getChoice('Should the ship leave immediately?', [
				{ value: true, text: 'Yes, it’s too risky' },
				{ value: false, text: 'No, we’ll keep a low profile' },
			]);
			if(leave) {
				shipWeeklyFlags.add('skip_port_actions');
			} else {
				let pirate = randomResult(crew);
				if(roll(pirate) < 5) {
					await kill(pirate, 'was permanently jailed', false);
					return { continueText:'Let the law have its way', description:`${getPirateName(pirate)} is caught and hauled into jail for years.` };
				}
			}
		}
	},
	{
		name: 'Pirate Attack',
		description: 'While the crew are in town their ship is mercilessly raided by other pirates! The repairs will cost 10 Booty, and without them the ship may sink!',
		handler: async () => { shipPermanentFlags.add('hull_damage'); }
	},
	{
		name: 'False Advertisement',
		description: 'The captain misunderstands an offer at the grog shop and trades in all their Booty for Grog.',
		continueText: 'Leave immediately in shame',
		handler: async () => {
			let count = booty;
			incrementBooty(-count);
			incrementGrog(count);
		}
	},
	{
		name: 'Parrots Wanted',
		description: 'The governor’s young daughter has lost her precious parrot.',
		continueText: 'Look for a replacement',
		handler: async () => {
			let parrotOwner = randomResult(filterByAttr(crew, feature.parrot));
			if(!parrotOwner) {
				return { description:'We have no parrot to sell.' };
			}
			let sell = await getChoice(`Should ${getPirateName(parrotOwner)} sell their parrot for 30 Booty?`, [
				{ value: true, text: 'Yes, that deal is too good to pass up' },
				{ value: false, text: 'No, the parrot has more emotional value' },
			]);
			if(sell) {
				incrementBooty(30);
				removeAttribute(parrotOwner, feature.parrot);
			}
		}
	},
	{
		name: 'Treasure Map',
		description: 'Rumor has it that there’s an old sailor in town with a map that leads to a vast hoard.',
		continueText: 'Seek him out',
		handler: async () => {
			if(booty < 10) {
				return { continueText:'Thanks anyway', description:'He is selling the map for 10 Booty, but we don’t have enough' };
			}
			let buy = await getChoice('Should we buy the map for 10 Booty?', [
				{ value: true, text: 'Yes, we can make that much back' },
				{ value: false, text: 'No, 10 is too much' },
			]);
			if(buy) {
				incrementBooty(-10);
				shipPermanentFlags.add('treasure_map');
				await addToLog('Acquired treasure map');
			}
		}
	},
	{
		name: 'Smouldering Ruin',
		description: 'This port is little more than a pile of burnt wreckage.',
		continueText: 'Keep on sailing',
		handler: async () => {
			shipWeeklyFlags.add('skip_port_actions');
		}
	},
	{
		name: 'Messenger',
		description: 'If the crew take this messenger to another Port they will pay them 10 Booty.',
		continueText: 'Welcome our passenger aboard',
		handler: async () => {
			shipVoyageFlags.add('carrying_messenger');
		}
	},
	{
		name: 'Powderstore Explosion',
		description: 'While the crew are in town there’s a huge explosion!',
		continueText: 'Duck and cover',
		handler: async () => {
			let availableCrew = filterEventTargets(crew);
			for(let pirate of availableCrew) {
				if(roll(pirate) < 3) {
					await kill(pirate, 'blew up', true);
				}
			}
		}
	},
	{
		name: 'Fortune Teller',
		description: 'The fortune teller proclaims one pirate will have exceptional luck!',
		continueText: 'We could use some luck',
		handler: async () => {
			let blessedPirate = randomResult(crew);
			blessedPirate.permanentFlags.add('blessed');
			addToLog(`${getPirateName(blessedPirate)} was blessed with exceptional luck`);
		}
	},
];