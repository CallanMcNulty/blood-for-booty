const islandExplorationTable = [
	{
		name: 'Skull Island',
		description: 'A giant ape attacks the explorers!',
		continueText: 'Fight it',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let result = roll() + skillValue(explorers, skill.shootin);
			if(result < 5) {
				await killRandomPirates(explorers, 'was eaten by an ape', result);
				return { continueText:'Leave empty-handed', description:`The ape kills some of the explorers.` };
			} else {
				let foundBooty = roll()+roll()+roll();
				incrementBooty(foundBooty);
				return { continueText:'Dodge the giant spiders on the way back to the ship', description:`The ape is killed and ${foundBooty} booty is found in its stomach.` };
			}
		}
	},
	{
		name: 'Paradise',
		description: 'Although there is no booty on this island, as such, it’s a truly beautiful place.',
		continueText: 'Stay a while',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let tempted = explorers.filter(p => roll(p) < 4);
			for(let pirate of tempted) {
				await kill(pirate, 'left the crew to live in paradise', false);
			}
			return { continueText:'Leave empty-handed', description:tempted.length ? 'Some explorers decide to stay forever.' : 'The explorers stay for a while.' };
		}
	},
	{
		name: 'Kingdom of Booty',
		description: 'This island hosts an abandoned city filled with Booty!',
		continueText: 'Grab that booty',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let killed = [];
			let rewarded = [];
			for(let pirate of explorers) {
				let result = roll(pirate) + skillValue([pirate], skill.stealin);
				if(result == 1) {
					await kill(pirate, 'was torn apart by ancient forces', true);
					killed.push(pirate);
				} else if(result < 6) {
					incrementBooty(result);
					rewarded.push(pirate);
				} else {
					incrementBooty(result*2);
					rewarded.push(pirate);
				}
			}
			return { description:`${rewarded.length} pirate(s) returned with booty. We experienced ${killed.length} casualties.` };
		}
	},
	{
		name: 'Raider Attack',
		description: 'Islanders attack our explorers!',
		continueText: 'Fight back',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let result = roll() + skillValue(explorers, skill.stealin);
			if(result < 4) {
				await killRandomPirates(explorers, 'was killed by raiders', result);
				return { continueText:'Leave empty-handed', description:'We lose the fight with the raiders.' };
			} else if(result < 7) {
				incrementBooty(explorers.map(p => roll()).reduce((acc,curr) => acc+curr, 0));
				return { description:'The raiders are fought off and booty is salvaged.' };
			} else {
				let newPirate = await rollPirate();
				newPirate.explorer = true;
				explorers.push(newPirate);
				incrementBooty(explorers.map(p => roll()+roll()).reduce((acc,curr) => acc+curr, 0));
				return { continueText:'How fortunate', description:'One of the islanders agrees to join the crew, and everyone gathers some booty.' };
			}
		}
	},
	{
		name: 'Castaway',
		description: 'This island has no booty but a single Castaway!',
		continueText: 'Ask them to join the crew',
		handler: async (explorers) => { await rollPirate(); }
	},
	{
		name: 'Navy Outpost',
		description: 'The exploration team cannot be sent out, and the Navy attacks our ship!',
		continueText: 'Man the cannons',
		handler: async (explorers) => {
			let result = roll() + skillValue(crew, skill.shootin);
			if(result < 3) {
				incrementBooty(-5);
				return { continueText:'Fall back', description:'The ship is shot to bits, losing 5 Booty.' };
			} else if(result < 5) {
				return { continueText:'We’ll get them next time', description:'The ship fights off the Navy for a while but has to flee undamaged.'};
			} else {
				incrementBooty((roll() + skillValue(crew, skill.stealin)) * 10);
				return { continueText:'Celebrate our great victory', description:'The crew defeat the Navy, claiming massive Booty.' };
			}
		}
	},
	{
		name: 'Volcano Island',
		description: 'This volcano is covered in lost Booty and dangerous lava!',
		continueText: 'Try our luck',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let penalty = 0;
			do {
				for(let pirate of explorers) {
					let result = roll(pirate) - penalty;
					if(result < 2) {
						await kill(pirate, 'burned up in lava', true);
						explorers = crew.filter(p => explorers.includes(p));
						if(explorers.length == 0) {
							return { description:'The whole exploration team burnt up.' };
						}
					} else {
						incrementBooty(result);
						await addToLog(`Collected ${result} Booty. Continuing will have a ${5 - penalty} in 6 chance of success.`)
					}
				}
				var stay = await getChoice('Should the team stay?', [
					{ value: true, text: 'Yes, collect more Booty.' },
					{ value: false, text: 'No, the lava is too dangerous.' },
				]);
				penalty ++;
			} while(stay);
		}
	},
	{
		name: 'Amazons',
		description: 'The amazons attack!',
		continueText: 'Fight them off',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let result = roll() + skillValue(explorers, skill.swashbucklin);
			if(result < 6) {
				for(let pirate of explorers) {
					await kill(pirate, 'was ceremonially executed by Amazons', true);
				}
				return { continueText:'What a disaster', description:'The explorers are dragged off by the mighty islanders and ceremonially killed.' };
			} else {
				incrementBooty(5*explorers.length);
				return { continueText:'And what fine Booty it is', description:'The attackers are fought off, and we claim their Booty.' };
			}
		}
	},
	{
		name: 'Main Course',
		description: 'The team explores the island’s caves.',
		continueText: 'See what they find',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			incrementBooty(explorers.length*2);
			await kill(randomResult(explorers), 'was fed to a monster', true);
			return { description:'The explorers find 2 Booty each in the caves, but one is fed to a local monster by islanders.' };
		}
	},
	{
		name: 'Treasure Cave',
		description: 'The explorers find a cave filled with 50 Booty!',
		continueText: 'Grab as much as we can',
		handler: async (explorers) => {
			let collected = Math.min(50, explorers.map(p => hasAttribute(p, skill.stealin) ? 10 : 5).reduce((acc,curr) => acc+curr, 0));
			incrementBooty(collected);
			return { description:`The team are able to carry back ${collected} Booty.` };
		}
	},
	{
		name: 'Abandoned Temple',
		description: 'The explorers find a temple filled with Booty',
		continueText: 'Grab as much as we can',
		handler: async (explorers) => {
			let collected = explorers.map(p => roll(p) + skillValue([p], skill.stealin)).reduce((acc,curr) => acc+curr, 0);
			incrementBooty(collected);
			return { description:`The team are able to carry back ${collected} Booty.` };
		}
	},
	{
		name: 'Ape Island',
		description: 'This island is inhabited exclusively by apes.',
		continueText: 'Approach them cautiously',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			if(explorers.some(p => hasAttribute(p, feature.monkey))) {
				incrementBooty(10);
				return { continueText:'Attempt to thank them in ape language', description:'The apes see our pet monkey and are convinced that we are friends to simians. They give us a gift of 10 Booty.' };
			}
			let result = roll() + skillValue(explorers, skill.swashbucklin);
			if(result < 4) {
				await killRandomPirates(explorers, 'was killed by apes', result);
				return { continueText:'Leave empty-handed', description:'The apes attack, killing some explorers.' };
			} else if(result < 7) {
				return { continueText:'Leave empty-handed', description:'The pirates fight back against the apes but cannot defeat them.' };
			} else {
				incrementBooty(30);
				return { description:'The apes are killed and the pirates raid their treetop city for 30 Booty!' };
			}
		}
	},
	{
		name: 'Docked Ship',
		description: 'Some idiot has left a ship here!',
		continueText: 'Raid it',
		handler: async (explorers) => {
			incrementBooty(20);
			incrementGrog(20);
			return { description:'The explorers raid the ship for 20 Booty and 20 Grog before fleeing.' };
		}
	},
	{
		name: 'Crab Island',
		description: 'This island is full of regular sized, friendly crabs.',
		continueText: 'Explore among the crabs',
		handler: async (explorers) => {
			incrementBooty(explorers.map(p => roll()).reduce((acc,curr) => acc+curr, 0));
			let crabMaster = randomResult(explorers, filterByAttr(explorers, feature.crab));
			if(crabMaster) {
				await addAttribute(crabMaster, feature.crab);
			}
			return { description:'Each explorer manages to gather some Booty and one takes a crab as a pet.' };
		}
	},
	{
		name: 'Venom Island',
		description: 'Hostile islanders begin shooting at the team.',
		continueText: 'Try to gather Booty anyway',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			do {
				let result = roll();
				if(result < 3) {
					explorers = await killRandomPirates(explorers, 'was shot and dragged off by islanders', 1);
				} else {
					await addToLog('Booty recovered');
					incrementBooty(result);
				}
				var stay = await getChoice('Should the team stay?', [
					{ value: true, text: 'Yes, collect more Booty.' },
					{ value: false, text: 'No, the islanders are too dangerous.' },
				]);
			} while(stay);
		}
	},
	{
		name: 'Monster Island',
		description: 'Don’t worry, it’s just a name.',
		continueText: 'Sounds legit',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			incrementBooty(20);
			await killRandomPirates(explorers, 'was killed by a monster', 1);
			return { description:'The team finds a cave filled with 20 Booty. Also, one explorer is killed by a monster.' };
		}
	},
	{
		name: 'Bones',
		description: 'Nothing but bones here.',
		continueText: 'Move along',
		handler: async (explorers) => {}
	},
	{
		name: 'Shipwreck',
		description: 'The crew see something in a ship wrecked in the coral around this island.',
		continueText: 'Haul it up',
		handler: async (explorers) => {
			let result = roll();
			if(result < 4) {
				incrementBooty(10);
			} else {
				incrementGrog(10);
			}
			let proceed = await getChoice('Should the team attempt to approach the coral-surrounded island?', [
				{ value: true, text: 'Yes, Booty awaits.' },
				{ value: false, text: 'No, the coral could damage the ship.' },
			]);
			if(!proceed) {
				result = roll();
				if(result < 5) {
					incrementBooty(-roll()-roll());
					incrementGrog(-roll()-roll());
					return { continueText:'Sail away empty-handed', description:'The ship is torn apart, and some Booty and Grog is lost.' };
				} else {
					incrementBooty(20);
					return { description:'The ship just makes it to the island and claims 20 Booty.' };
				}
			}
		}
	},
	{
		name: 'The Cave',
		description: 'The explorers check all the caves nearby, but no Booty is found.',
		continueText: 'Does anything else happen?',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let cavers = explorers.filter(p => roll(p) < 3);
			for(let p of cavers) {
				p.permanentFlags.add('caver');
				await addToLog(`${getPirateName(p)} became a caver`);
			}
			if(cavers.length) {
				return { continueText:'Leave empty-handed', description:`${cavers.length} pirate(s) become obsessed with caves. Whenever the ship lands on an island again any "cavers" will wander off into caves by themselves rather than help with exploring. They will return to the ship as it leaves.` };
			} else {
				return { continueText:'Leave empty-handed', description:'Nothing else notable occurs.' };
			}
		}
	},
	{
		name: 'Native Wildlife',
		description: 'The island is teaming with diverse fauna.',
		continueText: 'Check it out',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			incrementBooty(explorers.map(p => roll()).reduce((acc,curr) => acc+curr, 0));
			let tamer = randomResult(explorers);
			let petOptions = [
				{ value: feature.parrot, text: 'Parrot' },
				{ value: feature.monkey, text: 'Monkey' },
				{ value: feature.rat, text: 'Rat' },
				{ value: feature.crab, text: 'Crab' },
			].filter(opt => !hasAttribute(tamer, opt.value));
			let petChoice = await getChoice(`Which pet should ${getPirateName(tamer)} claim?`, petOptions);
			await addAttribute(tamer, petChoice);
			return { description:'One pirate claims a pet! In addition every explorer brings some Booty back to the ship.' };
		}
	},
	{
		name: 'Endless Jungle',
		description: 'The explorers find 20 Booty but become lost',
		continueText: 'Look for a way back to the ship',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let bootyCount = 20;
			do {
				await addToLog('Explorers try to find their way to the ship.');
				let result = roll();
				if(result < 3) {
					explorers = await killRandomPirates(explorers, 'was bitten by a snake', 1);
				} else if(result < 5) {
					let lostBooty = roll();
					bootyCount -= lostBooty;
					await addToLog(`${lostBooty} Booty was lost in the jungle.`);
				} else {
					break;
				}
			} while(explorers.length);
			bootyCount = Math.max(bootyCount, 0);
			incrementBooty(bootyCount);
			return { description:`The team manages to find the ship while hanging on to ${bootyCount} Booty.` }
		}
	},
	{
		name: 'Civilisation',
		description: 'We’re not just at any island, we’re at Port!',
		continueText: 'Everybody to shore',
		handler: async (explorers) => {
			headingToIsland = false;
		}
	},
	{
		name: 'Coral Reef',
		description: 'The ship is surrounded by precious coral.',
		continueText: 'Grab some',
		handler: async (explorers) => {
			incrementBooty(20);
			let lostGrog = roll()+roll();
			incrementGrog(-lostGrog);
			return { description:`We gather coral worth 20 Booty, but ${lostGrog} Grog is lost fom the stores as the coral tears the ship open.` };
		}
	},
	{
		name: 'Giant Turtle',
		description: 'This island is a giant turtle!',
		continueText: 'Ask it to carry our ship for a while',
		handler: async (explorers) => {
			let collectedBooty = explorers.map(p => roll()).reduce((acc,curr) => acc+curr, 0);
			incrementBooty(collectedBooty);
			let result = roll();
			let description = `The explorers gather ${collectedBooty} Booty and return to the ship, which is immediately dropped off at `;
			if(result < 4) {
				headingToIsland = false;
				description += 'a Port.';
			} else {
				shipWeeklyFlags.add('turtle_transport');
				description += 'another island.';
			}
			return { continueText:'Thank the turtle for its help', description:description };
		}
	},
	{
		name: 'Mirage',
		description: 'The island is a mirage… better luck next time.',
		continueText: 'Leave empty-handed',
		handler: async (explorers) => {}
	},
	{
		name: 'Tropical Fruit',
		description: 'The explorers gather some delicious fruit, but it doesn’t agree with them. All explorers gain the Seasick Flaw until they next return to port and spend 1 Booty on some leeches.',
		continueText: 'Leave empty-handed',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			explorers.forEach(p => p.voyageFlags.add('ate_bad_fruit'));
		}
	},
	{
		name: 'Thirsty Islanders',
		description: 'The locals here are desperate for Grog.',
		continueText: 'Help them out for a price',
		handler: async (explorers) => {
			let sellAmount = await getNumberInput('They will buy Grog for 5 Booty a barrel', 'How much Grog should be sold?', 'Sell', 0, grog);
			incrementGrog(-sellAmount);
			incrementBooty(sellAmount*5);
		}
	},
	{
		name: 'Isle of the Dead',
		description: 'Ghosts, Zombies and Skeletons attack the explorers!',
		continueText: 'Fight them',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let result = roll() + skillValue(explorers, skill.swashbucklin);
			if(result < 3) {
				for(let p of explorers) {
					await kill(p, 'was killed by the necrotic touch of the undead', true);
				}
				return { continueText:'Leave empty-handed', description:'Explorers are killed by the undead.' };
			} else if(result < 5) {
				return { continueText:'Leave empty-handed', description:'Explorers flee back to the ship.' };
			} else {
				incrementBooty(5);
				return { description:'Explorers kill some walking dead, claiming 5 Booty before returning.' };
			}
		}
	},
	{
		name: 'Parrot Island',
		description: 'Parrots are plentiful here.',
		continueText: 'Search for Booty',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let nonParrotOwners = explorers.filter(p => !hasAttribute(p, feature.parrot));
			let result = roll();
			for(let i=0; i<result && nonParrotOwners.length; i++) {
				let pirate = randomResult(nonParrotOwners);
				nonParrotOwners.splice(nonParrotOwners.indexOf(pirate), 1);
				await addAttribute(pirate, feature.parrot);
			}
			return { description:'Some parrots were tamed. No Booty though.' };
		}
	},
	{
		name: 'Dread Lair',
		description: 'A narrow cave has the distinct lure of a Booty-Hoard. Explorers may enter one at a time, rolling. They may not return, but if they do they will bring back any explorers that previously entered, each carrying 10 Booty.',
		continueText: 'Into the cave',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let inCave = [];
			let waiting = [...explorers];
			do {
				var next = await getChoice('Which pirate should enter the cave next?', pirateOptions(waiting), 0, 1);
				waiting = waiting.filter(p => p != nextPirate);
				if(next.length) {
					let nextPirate = next[0];
					inCave.push(nextPirate);
					if(roll(nextPirate) < 5) {
						await addToLog(`${getPirateName(nextPirate)} did not return from the cave`);
					} else {
						let haul = inCave.length * 10;
						incrementBooty(haul);
						await addToLog(`Pirate(s) returned with ${haul} Booty`);
						inCave = [];
					}
				}
			} while(nextPirate && waiting.length);
		}
	},
	{
		name: 'Booty Bay',
		description: 'Another pirate has hidden their hoard in the caves of this island!',
		continueText: 'Start searching',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			do {
				var cont = false;
				if(roll() + skillValue(explorers, skill.stealin) < 4) {
					await addToLog(`The Booty is trapped and a pirate dies!`);
					explorers = await killRandomPirates(explorers, 'died in a cave chasing booty', 1);
					if(explorers.length == 0) {
						return { continueText:'Leave empty-handed', description:'Exploration cannot continue.' };
					}
					cont = await getChoice('Continue searching the caves?', [
						{ value: true, text: 'Yes, the Booty must be found!' },
						{ value: false, text: 'No, these caves are too dangerous.' }
					]);
				} else {
					incrementBooty(30);
					return { description:'The pirates gather up 30 Booty and return to the ship.' };
				}
			} while(cont);
		}
	},
	{
		name: 'Fountain of Fate',
		description: 'Explorers discover a mysterious fountain. One pirate may drink from this fountain if they wish.',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let drink = await getChoice('Will a pirate drink from the fountain?', [
				{ value: true, text: 'Yes' }, { value: false, text: 'No' }
			]);
			if(drink) {
				let drinker = randomResult(explorers);
				drinker.permanentFlags.add('fated');
				return { continueText:'How fortunate', description:`${getPirateName(drinker)} drinks from the fountain. The next time they go out to explore an island, the island can be retried once.` };
			}
		}
	},
	{
		name: 'Hole to Hades',
		description: 'No Booty here, just strange holes.',
		continueText: 'Check them out',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let pirate = randomResult(explorers);
			pirate.permanentFlags.add('glimpsed_hell');
			return { continueText:'Wish them luck', description:`${getPirateName(pirate)} catches a glimpse of Pirate Hell itself! As soon as they next return to port he’ll give up the pirate life and become a priest.` };
		}
	},
	{
		name: 'Glittering Hoard',
		description: 'No catch, just treasure!',
		continueText: 'Grab it',
		handler: async (explorers) => {
			incrementBooty(explorers.length * 10);
			return { description:'Each explorer takes 10 Booty back to the ship.' };
		}
	},
	{
		name: 'Buried Treasure',
		description: 'There’s a huge X in the middle of this island.',
		continueText: 'Head to the spot',
		handler: async (explorers) => {
			explorers = filterEventTargets(explorers);
			let cont = undefined;
			while(cont || cont === undefined) {
				cont = await getChoice(cont === undefined ? 'Dig?' : 'Continue digging?', [
					{ value: true, text: 'Yes, the treasure must be found!' },
					{ value: false, text: 'No, those giant birds look hungry.' }
				]);
				if(cont) {
					let result = roll();
					if(result < 2) {
						await killRandomPirates(explorers, 'was eaten by a giant bird', 1);
					} else if(result < 6) {
						await addToLog('No treasure was found');
					} else {
						incrementBooty(explorers.length*15);
						return { description:'The pirates strike the treasure! Each explorer takes 15 Booty back to the ship.' };
					}
				}
			}
		}
	},
	{
		name: 'The Devil’s Fist',
		description: 'As well as finding some Booty, the pirates find the legendary ruby known as the Devil’s Fist. This is worth 50 Booty but must be spent in one transaction.',
		continueText: 'Grab it',
		handler: async (explorers) => {
			incrementBooty(explorers.map(p => roll()).reduce((acc,curr) => acc+curr), 0);
			shipPermanentFlags.add('devils_fist');
		}
	},
]