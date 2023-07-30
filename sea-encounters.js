const seaEncounterTable = [
	{
		name: 'Giant Squid',
		description: 'A squid tries to drag you down to the abyss.',
		continueText: 'Fight it',
		handler: async () => {
			let fighters = await filterDangerousEventActors(crew);
			while(crew.length) {
				let result = roll() + skillValue(fighters, skill.swashbucklin);
				if(result < 4) {
					await kill(randomResult(crew), 'was dragged into the icy depths by a giant squid', true);
				} else {
					if(result > 6) {
						incrementBooty(10);
						return { description:'The squid is killed and we manage to salvage valuable trophies worth 10 Booty.' };
					} else {
						return { continueText:'Sail away', description:'The squid is defeated.' };
					}
				}
			}
			return { continueText:'Oh no!', description:'The squid kills every member of the crew.' };
		}
	},
	{
		name: 'Iceberg',
		description: 'The ship is torn open by an iceberg.',
		continueText: 'Save what we can',
		handler: async () => {
			let choice = await getChoice('What should be lost in the iceberg collision?', [
				{ value: 0, text: 'All your booty' },
				{ value: 1, text: 'All your grog' },
				{ value: 2, text: '1-6 crew members' },
			]);
			switch(choice) {
				case 0:
					incrementBooty(-booty);
					break;
				case 1:
					incrementGrog(-grog);
					break;
				case 2:
					let deathCount = roll();
					let availableCrew = await filterNonScared(crew);
					await killRandomPirates(availableCrew, 'died when the ship struck an iceberg', deathCount);
					return { description:`The crash claims the lives of ${deathCount} pirate(s).` };
			}
		}
	},
	{
		name: 'Helpless Ship',
		description: 'You board a ship with no guards at all.',
		continueText: 'Raid it for Booty',
		handler: async () => { incrementBooty((roll() + skillValue(crew, skill.stealin)) * 5); }
	},
	{
		name: 'Navy Attack',
		description: 'The Navy have got you in an ambush.',
		continueText: 'Fighting retreat',
		handler: async () => {
			let fighters = await filterNonScared(crew);
			let result = roll() + skillValue(fighters, skill.shootin);
			if(result < 5) {
				await addToLog('The Navy pounded the ship to bits');
				let loseCrew = await getChoice('What should be lost in the navy attack?', [
					{ value: false, text: '2-12 grog and 2-12 booty' },
					{ value: true, text: '2 crew members' }
				]);
				if(loseCrew) {
					for(let i=0; i<2; i++) {
						let lost = randomResult(crew);
						if(lost) {
							await kill(lost, 'was killed fighting the Navy', true);
						}
					}
				} else {
					incrementBooty(-roll()-roll());
					incrementGrog(-roll()-roll());
					return { continueText:'Flee', description:'The ship manages to escape the Navy.' };
				}
			} else if(result > 6) {
				let gains = roll()+roll()+roll()+roll();
				incrementBooty(gains);
				return { continueText:'Flee', description:`The crew shoots down the Navy ship and salvages it for ${gains} Booty.` };
			}
		}
	},
	{
		name: 'Pirate Trap',
		description: 'Some fellow pirates are trying to beat you at your own game.',
		continueText: 'Show them some real pirating',
		handler: async () => {
			let availableCrew = filterAvailable(crew);
			let result = roll() + skillValue(availableCrew, skill.shootin);
			if(result < 3) {
				let stolen = incrementBooty(-10);
				return { continueText:'Drive them off', description:`The other pirates managed to board the ship and steal ${-stolen} Booty.` };
			} else if(result > 4) {
				let gainedBooty = incrementBooty(result * 2, availableCrew);
				return { continueText:'Jeer at them while sailing away with their stuff', description:`Our crew raided their ships for ${gainedBooty} Booty.` };
			}
			return { description:'The crew just manage to fight the other pirates off.' };
		}
	},
	{
		name: 'Triangle of Doom',
		description: 'Thousands of ships have gone missing in this part of the ocean.',
		continueText: 'Pray for safe passage',
		handler: async () => {
			let rolls = [roll(), roll(), roll()];
			if(rolls[0] == rolls[1] && rolls[2] == rolls[1]) {
				for(let pirate of crew) {
					await kill(pirate, 'vanished in the Triangle of Doom', false);
				}
				return { continueText:'Oh no!', description:'The ship vanishes and is never seen again.' };
			}
			return { continueText:'Thank God for that', description:'The ship passes through the triangle safely.' };
		}
	},
	{
		name: 'Doldrum',
		description: 'The sails fall limp and the ship cannot move from the middle of the ocean.',
		continueText: 'Wait for the wind to pick up',
		handler: async () => shipPermanentFlags.add('becalmed')
	},
	{
		name: 'Black Water',
		description: 'The water turns dark and daunting, as if something bad is about to happen. The captain immediately becomes scared and turns the bearing to Port.',
		continueText: 'Sail for Port',
		handler: async () => {
			headingToIsland = false;
			getCaptain().voyageFlags.add('no_heading_change');
		}
	},
	{
		name: 'Islander Canoes',
		description: 'Some islanders have sailed up to the ship in their canoes offering to trade.',
		continueText: 'See what they have',
		handler: async () => {
			let availableCrew = filterAvailable(crew);
			let options = [ { value:0, text:'Raid them for Booty (they will fight back)' } ];
			let grogSellPrice = 1;
			if(skillValue(availableCrew, skill.stealin) > 0) {
				options.unshift({ value:2, text:'Buy Grog at 1 Booty for 2 barrels' });
			}
			options.unshift({ value:1, text:`Sell Grog for ${grogSellPrice} Booty a barrel` });
			let action = await getChoice('How should we respond to their offer?', options);
			switch(action) {
				case 0:
					availableCrew = await filterNonScared(availableCrew);
					let killedCount = roll() - skillValue(availableCrew, skill.swashbucklin);
					await killRandomPirates(availableCrew, 'was shot by poisoned darts', killedCount);
					let gained = incrementBooty(roll()+roll(), availableCrew);
					return { description:`The crew plunder ${gained} Booty, and the islanders’ poison darts claim the lives of ${killedCount} pirate(s).` };
				case 1: {
					let amount = await getNumberInput('Sell Grog', 'How much Grog should be sold?', 'Sell', 0, grog);
					incrementGrog(-amount);
					incrementBooty(amount * grogSellPrice, availableCrew);
					break;
				}
				case 2: {
					let amount = await getNumberInput('Buy Grog', 'How much Grog should be bought?', 'Buy', 0, booty*2);
					incrementBooty(-Math.ceil(amount/2));
					let devilsFistsSpent = 0;
					if(devilsFist == 1) {
						devilsFistsSpent = await getChoice('Should we spend the Devil’s Fist on Grog?', [
							{ value: 1, text: 'Yes' }, { value: 0, text: 'No' },
						]);
					} else if(devilsFist > 1) {
						devilsFistsSpent = await getNumberInput('Buy Grog', 'How many Devil’s Fists should we spend on Grog?', 'Spend', 0, devilsFist);
					}
					if(devilsFistsSpent) {
						amount += devilsFistsSpent * 100;
						devilsFist -= devilsFistsSpent;
					}
					incrementGrog(amount);
					break;
				}
			}
		}
	},
	{
		name: 'Sea Volcano',
		description: 'A gush of superheated water hits the ship.',
		continueText: 'Save what we can',
		handler: async () => {
			let choices = await getChoice('What 2 things should be lost to the volcano?', [
				{ value: 0, text: 'a crew member' },
				{ value: 1, text: '1-6 grog' },
				{ value: 2, text: '1-6 booty' },
			], 2, 2);
			for(let choice of choices) {
				switch(choice) {
					case 0:
						let lost = randomResult(await filterNonScared(crew));
						if(lost) {
							await kill(lost, 'got steamed', true);
						}
						break;
					case 1:
						incrementGrog(-roll());
						break;
					case 2:
						incrementBooty(-roll());
						break;
				}
			}
		}
	},
	{
		name: 'Hurricane',
		description: 'The ship is caught up in a gale.',
		continueText: 'Batten down the hatches',
		handler: async () => {
			let result = roll();
			if(result < 3) {
				let loss = incrementBooty(-roll()-roll()-roll());
				return { description:`The ship is damaged and ${-loss ?? 'no'} Booty is lost.` };
			} else {
				shipWeeklyFlags.add('early_arrival');
				headingToIsland = result < 5;
				return { continueText:'Disembark', description:`The wind blows the ship to ${headingToIsland ? 'an island' : 'a Port'}.` };
			}
		}
	},
	{
		name: 'Whirlpool',
		description: 'The ship encounters a legendary hungry whirlpool that will only let the ship past if it’s fed!',
		continueText: 'Feed it',
		handler: async () => {
			let availableCrew = await filterNonScared(crew);
			while(availableCrew.length) {
				let choice = await getChoice('What will be sacrificed to the whirlpool?', [
					{ value: 0, text: 'A crew member' },
					{ value: 1, text: '1 grog' },
					{ value: 2, text: '1 booty' },
				]);
				switch(choice) {
					case 0:
						let sacrifice = await getChoice('Which crew member will be sacrificed?', pirateOptions(availableCrew));
						await kill(sacrifice, 'was sucked down a whirlpool', true);
						availableCrew = availableCrew.filter(c => c.alive);
						break;
					case 1:
						incrementGrog(-1);
						break;
					case 2:
						incrementBooty(-1);
						break;
				}
				if(roll() > 4) {
					break;
				}
				await addToLog('The whirlpool demanded more and held the ship in place');
			}
			return { continueText:'Leave as fast as possible', description:'The whirlpool seems content and lets us pass.' };
		}
	},
	{
		name: 'Big Wave',
		description: 'A big wave is coming.',
		continueText: 'Surf’s up',
		handler: async () => {
			let avoid = await getChoice('Should the ship try to avoid the wave?', [
				{ value: true, text: 'Yes (lose 1-6 booty)' },
				{ value: false, text: 'No (will either lose all booty or arrive early at destination)' },
			]);
			if(avoid) {
				let loss = incrementBooty(-roll());
				return { description:`The ship is tossed and loses ${-loss ?? 'no'} Booty.` };
			} else {
				let result = roll();
				if(result < 3) {
					incrementBooty(-booty);
					return { continueText:'Bogus!', description:'The ship is almost crushed and all Booty is lost.' };
				} else if(result > 4) {
					shipWeeklyFlags.add('early_arrival');
					return { continueText:'Cowabunga!', description:'The ship rides the wave and ends up at its destination immediately.' };
				}
				return { description:'The ship rides the wave without making any real progress, but it looked pretty impressive.' };
			}
		}
	},
	{
		name: 'Heatwave',
		description: 'It’s so hot that every pirate will drink an extra barrel of Grog this week, or else suffer the effects of being sober as if they had drunk none.',
		continueText: 'Try to stay out of the sun',
		handler: async () => { shipWeeklyFlags.add('heatwave'); }
	},
	{
		name: 'Sharks',
		description: 'The ship enters shark-infested waters.',
		continueText: 'Throw them a snack',
		handler: async () => {
			let potentialSacrifices = await filterNonScared(crew);
			if(potentialSacrifices.length == 0) {
				return;
			}
			let sharkBait = await getChoice('Which pirate will be sacrificed to the sharks?', pirateOptions(potentialSacrifices));
			let capProns = getPronouns(sharkBait, true);
			let result = roll(sharkBait) + skillValue([sharkBait], skill.swashbucklin);
			if(result < 3) {
				await kill(sharkBait, 'was eaten by sharks', true);
				return { continueText:`${capProns.poss} sacrifice will not be forgotten`, description:`${getPirateName(sharkBait)} is thrown to the sharks, keeping them busy while the ship and the rest of the crew escape.` };
			} else {
				await addAttribute(sharkBait, skill.swaggerin);
				if(result > 4) {
					let haul = roll();
					incrementBooty(haul);
					return { continueText:'Get that pirate a hat', description:`${getPirateName(sharkBait)} kills some sharks and hauls up a trophy catch worth ${haul} Booty. ${capProns.nom} gains Swaggerin’ for being so impressive.` };
				}
				return { continueText:'Get that pirate a hat', description:`${getPirateName(sharkBait)} fights off a shark and gains Swaggerin’ for being so impressive.` };
			}
		}
	},
	{
		name: 'Crocs',
		description: 'The crew have a run-in with some crocs.',
		continueText: 'Try to run',
		handler: async () => {
			let availableCrew = await filterNonScared(crew);
			let scaredToDeath = filterByAttr(availableCrew, feature.crocophobia);
			for(let pirate of scaredToDeath) {
				await kill(pirate, 'died of fright', true);
			}
			let crocBait = await getChoice(`${scaredToDeath.length ? `The sight of the crocs scares ${scaredToDeath.length} pirate(s) to death. ` : ''}Which pirate are the beasts after?`, pirateOptions(availableCrew));
			if(crocBait) {
				await addAttribute(crocBait, feature.crocophobia);
				return { continueText:'Try to avoid crocs in the future', description:`${getPirateName(crocBait)} gains a fatal fear of crocodiles, and if the crew ever come across crocs again this pirate will keel over and die from fear.` };
			}
			return { description:'The ship gets away from the crocs.' };
		}
	},
	{
		name: 'White Whale',
		description: 'A whale tauntingly nudges the ship before disappearing into the depths. The captain vows to catch it and refuses to return to port until it is caught.',
		continueText: 'Set bearing for the White Whale',
		handler: async () => {
			getCaptain().permanentFlags.add('whale_obsession');
		}
	},
	{
		name: 'Mermaids',
		description: 'The crew spots a group of mermaids on a rocky shore.',
		continueText: 'Check them out',
		handler: async () => {
			let tempted = (await filterDangerousEventActors(crew)).filter(pirate => roll(pirate) < 3);
			for(let pirate of tempted) {
				let result = roll(pirate) + skillValue([pirate], skill.swashbucklin);
				if(result < 4) {
					await kill(pirate, 'was torn to shreds by sea hags', true);
				}
			}
			return { continueText:'Poor saps', description:`${tempted.length} pirates head off to frolic with the mermaids, but they turn out to be sea hags after the grog-vision has cleared!` };
		}
	},
	{
		name: 'Message in a Bottle',
		description: 'Someone is calling for help.',
		continueText: 'Look for them at the next island',
		handler: async () => { shipPermanentFlags.add('waiting_castaway'); }
	},
	{
		name: 'Pirate in a Barrel',
		description: 'A barrel is floating in the sea. When the crew haul it up, they find a pirate inside.',
		continueText: 'Greet the fellow pirate',
		handler: async () => {
			let accept = await getChoice('Should the barrel pirate be taken on as crew?', [
				{ value: true, text: 'Yes (the pirate may go crazy and kill someone)' },
				{ value: false, text: 'No (no effect)' },
			]);
			if(accept) {
				let result = roll();
				if(result < 3) {
					let victim = randomResult(await filterNonScared(crew));
					if(victim) {
						await kill(victim, 'was killed by a mad stranger', true);
					}
					return { continueText:'They seemed so nice', description:'The stranger is in fact riddled with Sea Madness and kills one crew member before diving back into the sea.' };
				} else {
					await rollPirate();
				}
			}
		}
	},
	{
		name: 'Ghost Ship',
		description: 'A ghost ship! Honestly! Didn’t you just see that?',
		continueText: 'Gawk like an idiot',
		handler: async () => {
			let availableCrew = await filterNonScared(crew);
			let result = roll();
			if(result < 4) {
				await killRandomPirates(availableCrew, 'was torn to pieces by ghosts', 3);
				return { continueText:'Run and scream', description:'Some ghosts fly over from the other ship and start tearing crew members to pieces.' };
			} else if(result > 6) {
				incrementBooty(20, filterAvailable(crew));
				return { continueText:'Take the pearl', description:'The ghost ship is brought down and the legendary pearl of Deadface worth 20 Booty floats in the wreckage!' };
			}
			return { continueText:'What an experience', description:'The ship vanishes into thin air.' };
		}
	},
	{
		name: 'Sea Rats',
		description: 'Some dirty pirates have left a sinking ship.',
		continueText: 'Greet the fellow pirates',
		handler: async () => {
			let accept = await getChoice('What should be done with the pirates?', [
				{ value: true, text: 'Take them on as crew' },
				{ value: false, text: 'Kill them for their stuff (2-12 booty and 1-6 grog)' },
			]);
			if(accept) {
				await rollPirate();
				await rollPirate();
			} else {
				incrementBooty(roll()+roll(), filterAvailable(crew));
				incrementGrog(roll());
			}
		}
	},
	{
		name: 'Sirens',
		description: 'A haunting song floats through the air.',
		continueText: 'Sails towards the song',
		handler: async () => {
			incrementBooty(-roll()-roll());
			incrementGrog(-roll()-roll());
			return { continueText:'Cover our ears and carry on', description:'The ship is lured onto some rocks, losing Booty and Grog.' };
		}
	},
	{
		name: 'Leviathan',
		description: 'The legendary colossus of the sea rises and tries to swallow the ship!',
		continueText: 'To the guns!',
		handler: async () => {
			let result = roll() + skillValue(filterAvailable(crew), skill.shootin);
			if(result < 6) {
				headingToIsland = false;
				shipWeeklyFlags.add('early_arrival');
				incrementBooty(-booty);
				incrementGrog(-grog);
				incrementGrog(roll());
				return { continueText:'Wipe off the digestive juices and return to pirating', description:'The ship is swallowed whole! Months later the crew and what’s left of the ship are vomited out into a Port but they have lost all their Booty and Grog. A generous stranger at Port donates some Grog.' };
			}
			return { continueText:'Put the beast behind us', description:'The ship manages to escape.' };
		}
	},
	{
		name: 'Treasure Hunters',
		description: 'A group of treasure hunters want the pirates’ help.',
		continueText: 'Approach them',
		handler: async () => {
			let accept = await getChoice('What should be done about the treasure hunters?', [
				{ value: true, text: 'Let them guide the ship to an island and take half of anything found' },
				{ value: false, text: 'Raid them for Booty, they will fight back' },
			]);
			if(accept) {
				headingToIsland = true;
				shipWeeklyFlags.add('early_arrival');
				shipWeeklyFlags.add('treasure_hunter_iou');
			} else {
				let availableCrew = await filterDangerousEventActors(crew);
				let result = roll() + skillValue(availableCrew, skill.swashbucklin);
				if(result < 4) {
					let victim = randomResult(availableCrew);
					if(victim) {
						await kill(victim, 'was killed in a feud with treasure hunters', true);
					}
					return { continueText:'Search for our own treasure', description:'The crew are fought off and one pirate dies.' };
				}
				if(result > 6) {
					incrementBooty(roll()+roll(), availableCrew);
				} else {
					incrementBooty(roll(), availableCrew);
				}
				return { continueText:'Bring back our spoils', description:'The crew boards them and steals their Booty.' };
			}
		}
	},
	{
		name: 'Bounty Hunters',
		description: 'Someone’s put a price on the Captain’s head and tries to take it!',
		continueText: 'Defend the captain',
		handler: async () => {
			let availableCrew = filterAvailable(crew);
			let result = roll() + skillValue(availableCrew, skill.swashbucklin);
			if(result < 4) {
				await kill(getCaptain(), 'was caught by a bounty hunter', true);
				return { continueText:'Carry on with a new captain', description:'The captain is killed.' };
			} else if(result > 5) {
				incrementBooty(roll(), availableCrew);
				return { continueText:'Nobody messes with our captain', description:'The attackers are fended off and the crew manage to salvage some Booty from them in the process.' };
			}
			return { continueText:'Nobody messes with our captain', description:'The attackers are fended off.' };
		}
	},
	{
		name: 'Explorers',
		description: 'A group of explorers approach the ship.',
		continueText: 'Greet them',
		handler: async () => {
			let accept = await getChoice('What should be done about the explorers?', [
				...(booty >= 5 ? [ { value: 1, text: 'Let them guide the ship to an island at the cost of 5 Booty' } ] : []),
				{ value: 0, text: 'Raid them for Booty' },
				...(devilsFist ? [ { value: 2, text: 'Let them guide the ship in exchange for Devil’s Fist' } ] : []),
			]);
			if(accept) {
				if(accept == 1) {
					incrementBooty(-5);
				} else {
					devilsFist--;
					updateTopBar();
				}
				headingToIsland = true;
				shipWeeklyFlags.add('early_arrival');
			} else {
				let availableCrew = filterAvailable(crew);
				let result = roll() + skillValue(availableCrew, skill.swashbucklin);
				if(result > 6) {
					incrementBooty(result * 2, availableCrew);
				} else if(result > 4) {
					incrementBooty(roll()+roll(), availableCrew);
				} else if(result > 2) {
					return { continueText:'We’ll get the next time', description:'The explorers held onto their Booty, but the pirates got away unharmed.' };
				}
			}
		}
	},
	{
		name: 'Merchant Convoy',
		description: 'These ships are helpless without their escort.',
		continueText: 'Plunder them',
		handler: async () => {
			let availableCrew = await filterNonScared(crew);
			let actors = await filterDangerousEventActors(availableCrew);
			let result = roll() + skillValue(actors, skill.shootin);
			if(result < 5) {
				let victim = randomResult(availableCrew);
				if(victim) {
					await kill(victim, 'was killed while plundering', true);
				}
				return { continueText:'They were tougher than they looked', description:'The ship is fought off and a pirate dies.' };
			} else {
				let recovered = roll() + skillValue(actors, skill.stealin);
				incrementBooty(recovered, availableCrew);
				return { continueText:'Textbook pirating', description:`The escort is destroyed and ${recovered} Booty is recovered.` };
			}
		}
	},
	{
		name: 'Ship Graveyard',
		description: 'Wrecked ships abound in this part of the sea.',
		continueText: 'Salvage what we can',
		handler: async () => {
			let availableCrew = await filterDangerousEventActors(crew);
			let result = roll() + skillValue(availableCrew, skill.stealin);
			incrementBooty(result, availableCrew);
			if(result == 1) {
				let victim = randomResult(availableCrew);
				if(victim) {
					await kill(victim, 'drowned', true);
					return { description:`${result} Booty was salvaged. ${getPirateName(victim)} got too greedy and drowned.` };
				}
			}
			return { description:`${result} Booty was salvaged.` };
		}
	},
	{
		name: 'Rising Island',
		description: 'Out of nowhere an island springs up out of the ocean.',
		continueText: 'Send out a group to explore it',
		handler: async () => {
			headingToIsland = true;
			shipWeeklyFlags.add('early_arrival');
		}
	},
	{
		name: 'The Mist',
		description: 'Navigation is impossible. We may not end up where we expect.',
		continueText: 'Sail blind for a while',
		handler: async () => { shipVoyageFlags.add('uncertain_navigation'); }
	},
	{
		name: 'Flagship',
		description: 'The huge Navy flagship appears.',
		continueText: 'We can’t take this one',
		handler: async () => {
			let availableCrew = await filterNonScared(crew);
			while(availableCrew.length) {
				let actors = filterAvailable(availableCrew);
				let result = roll() + skillValue(actors, skill.shootin);
				if(result < 4) {
					await addToLog('The ship was pounded by cannons');
					incrementBooty(-roll());
					await kill(randomResult(availableCrew), 'was caught by cannon fire', true);
					availableCrew = availableCrew.filter(c => c.alive);
				} else {
					if(result > 5) {
						incrementBooty(roll()+roll(), actors);
						incrementGrog(roll()+roll());
						return { continueText:'We will be legends among pirates', description:'Against the odds, our guns manage to sink the flagship! The crew salvage Booty and Grog.'}
					}
					return { continueText:'What a close call', description:'We manage to just escape from the huge ship.' };
				}
			}
		}
	},
	{
		name: 'Cursed Ship',
		description: 'We spot a completely helpless ship.',
		continueText: 'Steal some Booty',
		handler: async () => {
			incrementBooty(roll()+roll(), filterAvailable(crew));
			shipVoyageFlags.add('curse');
			return { continueText:'Damn our greedy pirate ways!', description:'The Booty is cursed and may cause trouble.' };
		}
	},
	{
		name: 'Dolphins',
		description: 'Some dolphins decide to accompany the ship.',
		continueText: 'Let them guide our way',
		handler: async () => {
			shipVoyageFlags.add('dolphin_guides');
		}
	},
	{
		name: 'Spice Vessel',
		description: 'The crew spot a helpless ship filled with valuable cargo!',
		continueText: 'What a score!',
		handler: async () => {
			let availableCrew = filterAvailable(crew);
			incrementBooty((roll() + skillValue(availableCrew, skill.stealin))*5, availableCrew);
		}
	},
	{
		name: 'Stirring Deep',
		description: 'Shadows and shapes grasp at the ship from below. They speak in a deep voice, demanding the Captain make a sacrifice.',
		continueText: 'Give them something',
		handler: async () => {
			let choice = await getChoice('What should be handed over to the shadow creatures?', [
				{ value: 0, text: 'All crew that can be found but one, apart from the Captain' },
				{ value: 1, text: 'All booty and grog' },
				{ value: 2, text: 'Nothing (they will destroy the ship)' },
			]);
			switch(choice) {
				case 0:
					let salvageable = (await filterNonScared(crew)).filter(pirate => !pirate.captain);
					let saved = null;
					if(salvageable.length) {
						saved = await getChoice('Which crew member should be saved?', pirateOptions(salvageable));
					}
					let sacrifice = salvageable.filter(p => p != saved);
					for(let pirate of sacrifice) {
						await kill(pirate, 'was sacrificed to the shadow monsters', false);
					}
					break;
				case 1:
					incrementBooty(-booty);
					incrementGrog(-grog);
					break;
				case 2:
					for(let pirate of crew) {
						await kill(pirate, 'was destroyed by shadow monsters', true);
					}
					break;
			}
		}
	},
];
