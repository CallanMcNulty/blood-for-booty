async function brawl(actors) {
	let available = actors.filter(pirate => roll(pirate) + skillValue([pirate], skill.swashbucklin));
	let killCount = 0;
	while(available.length > 1) {
		let killer = randomResult(available);
		available.splice(available.indexOf(killer), 1);
		let victim = randomResult(available, [killer]);
		await kill(victim, `was killed by ${getPirateName(killer)} in a brawl`, true);
		killCount++;
		available = available.filter(p => crew.includes(p));
	}
	return killCount;
}

async function rollScurvy() {
	let contracted = crew.filter(
		pirate => (hasAttribute(pirate, flaw.scummy) && pirate.voyageFlags.has('scurvy')) || roll(pirate) == 1
	);
	for(let pirate of contracted) {
		if(pirate.voyageFlags.has('scurvy')) {
			await kill(pirate, 'died of scurvy', true);
		} else {
			pirate.voyageFlags.add('scurvy');
		}
	}
}

const crewEventTable = [
	{
		name: 'Thrown Overboard',
		description: 'The crew is brawling! Some may be thrown overboard to their probable deaths.',
		continueText: 'Let them fight it out',
		handler: async () => {
			let overboard = (await filterNonScared(crew)).filter(pirate => roll(pirate) + skillValue([pirate], skill.swaggerin) == 1);
			let killCount = 0;
			for(let pirate of overboard) {
				await kill(pirate, 'was thrown overboard', true);
				killCount++;
			}
			if(!overboard.length) {
				return { continueText:'How fortunate', description:'Everyone avoids being thrown overboard.' };
			} else {
				return { continueText:'Such a pity', description:`The sea claims ${killCount} pirate(s).` };
			}
		}
	},
	{
		name: 'Beard Lice',
		description: 'Some pirates are getting Beard Lice and will count as having the Scummy Flaw until they next return to Port and have their beard washed.',
		continueText: 'Inspect the beards',
		handler: async () => {
			let lousy = (await filterNonScared(crew)).filter(pirate => roll(pirate) < 3);
			for(let pirate of lousy) {
				pirate.voyageFlags.add('beard_lice');
				if(crew.includes(pirate)) {
					await addToLog(`${getPirateName(pirate)} caught beard lice`);
				}
			}
			if(!lousy.length) {
				return { continueText:'Praise the crew’s hygiene', description:'Everyone avoids the lice.' };
			} else {
				return { continueText:'Curse those lousy beards!', description:`The lice infest ${lousy.length} member(s) of the crew.` };
			}
		}
	},
	{
		name: 'Dice Cheat',
		description: 'A Stealin’ pirate is suspected of cheating?',
		continueText: 'Find the cheater',
		handler: async () => {
			let stealers = await filterNonScared(filterByAttr((crew), skill.stealin));
			if(stealers.length) {
				let boxedPirate = randomResult(stealers);
				boxedPirate.voyageFlags.add('boxed');
				return { continueText:`Make do without ${getPronouns(boxedPirate).poss} help`, description: `${getPirateName(boxedPirate)} is accused of cheating and locked in a chest to be released when we return to port. ${getPronouns(boxedPirate, true).nom} is unable to do anything but swear loudly from the chest but also require no Grog, being forced to drink seawater.` };
			}
			return { continueText:'Keep playing fair', description: 'No cheater is found.' };
		}
	},
	{
		name: 'Booty Call',
		description: 'Some Booty is missing, we’re sure of it! This calls for a recount.',
		continueText: 'Recount',
		handler: async () => {
			let result = roll() + skillValue(filterAvailable(crew), skill.stealin);
			let delta = roll();
			if(result < 4) {
				incrementBooty(delta);
				return { continueText:'Celebrate this discovery', description: 'There is actually more Booty than we thought!' };
			} else if(result >= 6) {
				incrementBooty(-delta);
				return { continueText:'Curse our inability to count!', description:'Some Booty is missing!' };
			}
			return { description:'It seems the original amount is correct.' };
		}
	},
	{
		name: 'Bad Grog',
		description: 'The Grog has gone bad. Anyone that drinks Grog will feel Seasick. When the ship returns we will swap the bad Grog for good Grog from an unguarded ship.',
		continueText: 'Prepare stomachs',
		handler: async () => { shipVoyageFlags.add('bad_grog'); }
	},
	{
		name: 'Brawl',
		description: 'Pirates are brawling!',
		continueText: 'Let them fight it out',
		handler: async () => {
			let killCount = await brawl(await filterDangerousEventActors(crew));
			if(killCount) {
				return { description:`The free-for-all claims the lives of ${killCount} pirate(s).` };
			} else {
				return { continueText:'Make amends and move on', description:'The fight ends with nobody too badly hurt.' };
			}
		}
	},
	{
		name: 'Jig Fest',
		description: 'The crew decided to have a jig contest.',
		continueText: 'Jig away',
		handler: async () => {
			let availableCrew = await filterDangerousEventActors(crew);
			if(availableCrew.length == 0) {
				return { continueText:'What party poopers', description:'Nobody participates.' };
			}
			let sortedByJigSkill = availableCrew.map(
				pirate => ({ result: roll(pirate) + skillValue([pirate], skill.swaggerin), pirate: pirate })
			).sort((a,b) => b.result - a.result);
			if(sortedByJigSkill.length > 1 && sortedByJigSkill[0].result == sortedByJigSkill[1].result) {
				let killCount = await brawl(availableCrew);
				return { continueText:'Avoid future jig contests', description:`The contest ends in a draw. The crew start brawling over the unsatisfactory result, resulting in ${killCount} death(s).` };
			} else {
				let winner = sortedByJigSkill[0].pirate;
				winner.weeklyFlags.add('deserves_extra_grog');
				winner.voyageFlags.add('jig_king');
				updateCrewList();
				return { continueText:'Long live the Jig King', description:'A Jig King is crowned, to reign until we return to port. The king is entitled to extra Grog this week.' };
			}
		}
	},
	{
		name: 'Cabin Fever',
		description: 'The crew are feeling dissatisfied with the long voyage. Some may go a bit crazy.',
		continueText: 'Check their condition',
		handler: async () => {
			let all = await filterDangerousEventActors(crew);
			let crazyCount = 0;
			for(let pirate of all) {
				if(roll(pirate) < 3 && crew.includes(pirate)) {
					await addToLog(`${getPirateName(pirate)} went mad`);
					await rollOnSobrietyTable(pirate);
					crazyCount++;
				}
			}
			if(crazyCount) {
				return { continueText:'Hold out for the next Port', description:`The boredom drives ${crazyCount} crew member(s) past the brink.` };
			} else {
				return { continueText:'Bask in serenity', description:'Everyone is tolerating the voyage.' };
			}
		}
	},
	{
		name: 'Singsong',
		description: 'The crew are having a singsong.',
		continueText: 'Belt it out',
		handler: async () => {
			if(roll() + skillValue(filterAvailable(crew), skill.swaggerin) > 3) {
				shipWeeklyFlags.add('singsong');
				return { continueText:'Try to enjoy the music', description:'The group is singing a shanty so catchy it will prevent any pirates from working this week.' };
			} else {
				return { continueText:'Yo Ho Ho!', description:'The crew sing a merry song as they work.' };
			}
		}
	},
	{
		name: 'Flying Fish',
		description: 'The pirates invent a new game involving throwing a freshly caught fish around the deck. The crew will be distracted by this game instead of working this week.',
		continueText: 'Play along',
		handler: async () => { shipWeeklyFlags.add('fish_game'); }
	},
	{
		name: 'Out of Grog',
		description: 'There must be some mistake. All of the ship’s Grog has gone! A catastrophe indeed.',
		continueText: 'Sober up',
		handler: async () => { incrementGrog(-grog); }
	},
	{
		name: 'Broken Mast',
		description: 'The ship cannot sail anywhere until the broken mast is repaired. Attempting repairs will take the whole crew a week, during which they cannot work on other jobs. The Captain is not subject to Captain’s Madness while the mast is being repaired, being focused on the task at hand.',
		continueText: 'Attempt repairs until we fix it',
		handler: async () => { shipPermanentFlags.add('broken_mast'); }
	},
	{
		name: 'Hook Club',
		description: 'The hook-handed are banding together.',
		continueText: 'See what they’re up to',
		handler: async () => {
			let hookies = crew.filter(pirate => hasAttribute(pirate, feature.hook) || hasAttribute(pirate, feature.leftHook));
			let newMembers = [];
			if(hookies.length) {
				let existingHookClub = crew.filter(pirate => pirate.permanentFlags.has('hook_club'));
				if(!existingHookClub.length) {
					newMembers = hookies;
					let founder = randomResult(hookies);
					await addToLog(`${getPirateName(founder)} founded Hook Club`);
				}
				for(let pirate of crew) {
					if(!pirate.permanentFlags.has('hook_club') && !newMembers.includes(pirate) && roll(pirate) == 6) {
						newMembers.push(pirate);
					}
				}
			}
			if(newMembers.length) {
				for(let member of newMembers) {
					member.permanentFlags.add('hook_club');
					await addToLog(`${getPirateName(member)} joined Hook Club`);
					newMembersJoined = true;
					if(!hookies.includes(member)) {
						await addAttribute(member, feature.hook);
					}
				}
				updateCrewList();
				return { continueText:'Try to trust this shadowy organization', description:'The Hook Club has expanded. Members of the Hook Club insist on working together on any jobs, and any new pirates with hooks that join the crew immediately join the club. The club only stops existing if its members are wiped out.' };
			} else {
				return { continueText:'For the best', description:'The Hook Club has not expanded.' };
			}
		}
	},
	{
		name: 'Rats',
		description: 'The ship has even more rats than usual. They may damage our Grog or Booty, but they will leave at the next Port.',
		continueText: 'Try to tolerate the vermin',
		handler: async () => { shipVoyageFlags.add('rats'); }
	},
	{
		name: 'Ghost',
		description: 'A ghost has been sighted on the ship. Any pirates without Swaggerin’ count as having the Scaredy Flaw until the ship next returns to Port.',
		continueText: 'Try to keep it together',
		handler: async () => { shipVoyageFlags.add('haunted'); }
	},
	{
		name: 'Stolen Hat',
		description: 'Is there a hat thief on the loose?',
		continueText: 'Hold on to your hat',
		handler: async () => {
			let stealers = filterByAttr(filterAvailable(crew), skill.stealin);
			let swaggerers = filterByAttr(crew, skill.swaggerin);
			stealers = await filterDangerousEventActors(stealers);
			swaggerers = await filterNonScared(swaggerers);
			let thiefOptions = pirateOptions(stealers.filter(s => swaggerers.some(swag => swag != s)));
			if(thiefOptions.length == 0) {
				return { continueText:'Enjoy this time of hat safety', description:'There is no hat thief. All hats are safe.' };
			}
			let thief = await getChoice('Who is the hat thief?', thiefOptions);
			let victimOptions = pirateOptions(swaggerers.filter(s => s != thief));
			let victim = await getChoice('Who is the victim?', victimOptions);
			await addToLog(`${getPirateName(thief)} tried to steal the hat of ${getPirateName(victim)}`);
			if(victim) {
				if(roll(victim) < 4) {
					await removeAttribute(victim, skill.swaggerin);
					await addAttribute(thief, skill.swaggerin);
					return { continueText:'Commend the successful hat heist', description:`The bravery of ${getPirateName(thief)} shocks ${getPirateName(victim)}, who loses ${getPronouns(victim).poss} Swaggerin’ Skill. However, ${getPirateName(thief)} gains the Swaggerin’ Skill along with the hat.` };
				} else {
					await kill(thief, `${getPirateName(thief)} was shot by ${getPirateName(victim)} in retaliation for hat theft`, true);
					return { continueText:'Leave that hat alone', description:`${getPirateName(victim)} will not stand for such disrespect and shoots ${getPirateName(thief)} dead!` };
				}
			}
		}
	},
	{
		name: 'Scurvy',
		description: 'The ship has run out of limes. The crew will soon begin contracting Scurvy until the crew return to Port, where they can steal some limes. If the same Pirate gets Scurvy twice they die and earn themselves a burial at sea.',
		continueText: 'Tough it out',
		handler: async () => {
			shipVoyageFlags.add('scurvy');
			await rollScurvy();
		}
	},
	{
		name: 'The Box',
		description: 'There has been a general ruckus on the deck of the ship, and the Captain feels some pirates need some time in The Box, until the ship next reaches port.',
		continueText: 'Get boxing',
		handler: async () => {
			let boxed = (await filterNonScared(crew)).filter(pirate => roll(pirate) == 1);
			for(let pirate of boxed) {
				pirate.voyageFlags.add('boxed');
				await addToLog(`${getPirateName(pirate)} was locked in a box`);
			}
			if(!boxed.length) {
				return { continueText:'How fortunate', description:'Everyone manages to escape being boxed.' };
			} else {
				return { continueText:'Ignore the incessant knocking', description:`The Captain boxes ${boxed.length} pirate(s). For this time they require no Grog, only water but cannot do anything other than stay in the box.` };
			}
		}
	},
	{
		name: 'Bird Flu',
		description: 'A we have heard word of a plague being spread by parrots.',
		continueText: 'Curse those birds',
		handler: async () => {
			let parrotKeepers = filterByAttr(crew, feature.parrot);
			let deaths = crew.filter(pirate => roll(pirate) <= parrotKeepers.length);
			for(let pirate of deaths) {
				await kill(pirate, 'died of bird flu', true);
			}
			await Promise.all(parrotKeepers.map(pirate => removeAttribute(pirate, feature.parrot)));
			if(parrotKeepers.length) {
				return { continueText:'Good riddance', description:'All parrots are killed and burned.' };
			} else {
				return { continueText:'How fortunate', description:'With no parrots on board, we are not harmed by the flu.' };
			}
		}
	},
	{
		name: 'Murder',
		description: 'Rumor has it that a murderer is on the ship.',
		continueText: 'Be on guard',
		handler: async () => {
			do {
				var availableCrew = await filterDangerousEventActors(crew);
				if(availableCrew.length) {
					await kill(await getChoice('Which pirate will be murdered?', pirateOptions(availableCrew)), 'was murdered', true);
				} else {
					break;
				}
			} while(roll() > 2)
		}
	},
	{
		name: 'Indecisive Compass',
		description: 'Something’s not right with the compass. We may not arrive where we expect to.',
		continueText: 'Try to navigate anyway',
		handler: async () => { shipVoyageFlags.add('bad_compass'); }
	},
	{
		name: 'A Plan',
		description: 'A crew member has come up with a cunning plan, which is incredibly secret.',
		continueText: 'Commence plan',
		handler: async () => {
			let availableCrew = (await filterDangerousEventActors(crew)).filter(c => !c.captain);
			if(availableCrew.length == 0) {
				return { continueText:'Who needs secret plans anyway?', description:'But nobody is available to execute the plan.' };
			}
			let progenitor = await getChoice('Which pirate is hatching a plan?', pirateOptions(availableCrew));
			let conspirators = [progenitor];
			let conspiratorCount = roll();
			for(let i=0; i<conspiratorCount; i++) {
				let conspirator = randomResult(availableCrew, conspirators);
				if(conspirator) {
					conspirators.push(conspirator);
				}
			}
			for(let pirate of conspirators) {
				pirate.permanentFlags.add('away_on_plan');
				await kill(pirate, 'left the ship to execute a plan', false);
			}
			return { continueText:'Keep an eye out for them', description:`${conspirators.length} pirate(s) leave the ship to execute their plan.` };
		}
	},
	{
		name: 'A New Name',
		description: 'A pirate wants a new name',
		continueText: 'Humor them',
		handler: async () => {
			let pirate = await getChoice('Which pirate gets the new name?', pirateOptions(crew));
			pirate.permanentFlags.add('name-change');
			updatePirateView(pirate);
			await waitForPirateView();
		}
	},
	{
		name: 'Termites',
		description: 'The ship is infested with termites!',
		continueText: 'Yuck!',
		handler: async () => {
			let result = roll();
			if(result < 5) {
				incrementBooty(-result);
				return { continueText:'Aren’t they supposed to eat wood?', description:`${result} Booty is eaten!` };
			}
			return { continueText:'How fortunate', description:'Luckily, the termites do no damage.' };
		}
	},
	{
		name: 'Gangrene',
		description: 'Could anyone on our crew be at risk of contracting gangrene?',
		continueText: 'Let’s see',
		handler: async () => {
			let dismembered = crew.filter(pirate =>
				hasAttribute(pirate, feature.pegLeg) ||
				hasAttribute(pirate, feature.hook) ||
				hasAttribute(pirate, feature.leftHook)
			);
			if(!dismembered.length) {
				let result = incrementBooty(-roll()-roll());
				return { continueText:'Such an incompetent crew!', description:`Nobody is gangrenous`+(result ? `, but ${-result} Booty is lost in a loading accident.` : '.') };
			} else {
				let choice = await getChoice('Which pirate contracted gangrene?', pirateOptions(dismembered));
				choice.voyageFlags.add('gangrenous');
				return { continueText:`Suffer ${getPronouns(choice).poss} complaining`, description:`${getPirateName(choice)} has a stump which became gangrenous. ${getPronouns(choice, true).nom} cannot do anything but complain about it until we return to Port.` };
			}
		}
	},
	{
		name: 'Stowaway',
		description: 'Someone else is on the ship.',
		continueText: 'Ask them to join the crew',
		handler: async () => { await rollPirate() },
	},
	{
		name: 'Ocean Madness',
		description: 'The sea is getting to our crew. They’ve all gone a bit mad.',
		continueText: 'We’re all mad here',
		handler: async () => {
			var soberPirates = filterAvailable(crew).filter(pirate => !pirate.captain);
			while(soberPirates.length) {
				let pirate = soberPirates.shift();
				await rollOnSobrietyTable(pirate);
				soberPirates = soberPirates.filter(p => crew.includes(p));
			}
			await rollOnCaptainsMadnessTable();
		}
	},
	{
		name: 'Bootylust',
		description: 'Our Booty is irresistible.',
		continueText: 'Hang on to the Booty',
		handler: async () => {
			let deserters = (await filterDangerousEventActors(crew)).filter(pirate => roll(pirate) == 1);
			for(let pirate of deserters) {
				if(!crew.includes(pirate)) {
					continue;
				}
				incrementBooty(-5);
				await kill(pirate, 'abandoned the crew after stealing some Booty', false);
			}
		}
	},
	{
		name: 'Barnacles',
		description: 'The ship has even more barnacles than normal, and it’s starting to look like a mess. As soon as the ship returns to port the Captain will insist on spending 3 Booty getting them removed.',
		continueText: 'A worthy expense',
		handler: async () => { shipPermanentFlags.add('barnacles'); }
	},
	{
		name: 'Mast Rot',
		description: 'The main mast looks unstable.',
		continueText: 'Oh no!',
		handler: async () => {
			if(roll() == 1) {
				shipPermanentFlags.add('mast_rot');
				return { continueText:'Keep limping along', description:'The mast collapses! The sails will be less effective, as if crewed by 2 fewer pirates, until 5 Booty is spent to repair the mast at a Port.' };
			}
			return { continueText:'Thank God for that', description:'The mast seems to be holding.' };
		}
	},
	{
		name: 'Pearl Diving',
		description: 'This looks like a pearl-heavy area.',
		continueText: 'Dive!',
		handler: async () => {
			let availableCrew = await filterDangerousEventActors(crew);
			let divers = await getChoice('Who will go pearl diving?', pirateOptions(availableCrew), 0, availableCrew.length);
			for(let diver of divers) {
				if(!crew.includes(diver)) {
					continue;
				}
				let result = roll(diver) + skillValue([diver], skill.stealin);
				if(result == 1) {
					await kill(diver, 'drowned while diving for pearls', true);
				} else if(result > 4) {
					incrementBooty(result);
					await addToLog(`${getPirateName(diver)} successfully recovered a pearl.`);
				} else {
					await addToLog(`${getPirateName(diver)} could not find any pearls.`);
				}
			}
			if(!divers.length) {
				return { continueText:'Who needs pearls anyway', description:'Nobody is available to dive.' };
			}
		}
	},
	{
		name: 'Pet Crab',
		description: 'One of the pirates has tames a pet crab. The crab will sit on that pirate’s shoulder for the rest of their days together.',
		continueText: 'Awww…',
		handler: async () => {
			let pirate = randomResult(filterAvailable(crew), filterByAttr(crew, feature.crab));
			if(pirate) {
				await addAttribute(pirate, feature.crab);
			}
		}
	},
	{
		name: 'Lobster Racing',
		description: 'One of the pirates sets up a Lobster Racing league.',
		continueText: 'Off to the races',
		handler: async () => {
			let pirate = randomResult(await filterDangerousEventActors(crew));
			if(pirate) {
				let pron = getPronouns(pirate);
				pirate.permanentFlags.add('hurt_hand');
				return { continueText:`Let ${pron.acc} have the week off work`, description:`${getPirateName(pirate)} got a nasty snip on ${pron.poss} hand.` };
			}
			return { description:'But they couldn’t find enough participants.' };
		}
	},
	{
		name: 'Mutiny',
		description: 'One pirate decides they could do a better job of running the ship.',
		continue: 'Commence mutiny',
		handler: async () => await mutiny(randomResult(await filterDangerousEventActors(crew))),
	},
	{
		name: 'Argument',
		description: 'Two pirates get in a heated argument.',
		continueText: 'Blow off that steam',
		handler: async () => {
			let availableCrew = await filterDangerousEventActors(crew);
			if(availableCrew.length < 2) {
				return { continueText:'How fortunate', description:'Nothing comes of the argument.' };
			}
			let first = randomResult(availableCrew);
			let second = randomResult(availableCrew, [first]);
			first.rivals.add(second);
			second.rivals.add(first);
			return { continueText:'Let them hold their pathetic grudge', description:`${getPirateName(first)} and ${getPirateName(second)} will never work on the same jobs as each other in future.` };
		}
	},
	{
		name: 'The Prettiest Dress',
		description: 'A dress washes up nearby the ship and the crew haul it in. It’s beautiful.',
		continueText: 'Haul it in',
		handler: async () => {
			let winner = null;
			let tied = null;
			await addToLog(`The crew started brawling over the dress.`);
			let availableCrew = await filterDangerousEventActors(crew);
			let brawlersKilled = [];
			do {
				availableCrew = availableCrew.filter(c => c.alive);
				let brawlResults = availableCrew.map(
					pirate => ({ pirate: pirate, result: roll(pirate) + skillValue([pirate], skill.swashbucklin) })
				).sort((a,b) => b.result - a.result);
				winner = brawlResults[0];
				tied = null;
				for(let item of brawlResults) {
					if(brawlersKilled.includes(item.pirate)) {
						continue;
					}
					if(tied === null && item != winner) {
						tied = item.result == winner.result;
					}
					if(item.result > 5) {
						let victim = randomResult(availableCrew, [item.pirate]);
						if(victim) {
							await kill(victim, 'was killed in a dispute over a dress', true);
							brawlersKilled.push(victim);
						}
					}
				}
			} while(tied);
			if(winner) {
				await addAttribute(winner.pirate, feature.prettyDress);
				let deathClause = brawlersKilled.length ? `, while ${brawlersKilled.length} pirate(s) were killed` : '';
				return { continueText:`Admire ${getPronouns(winner.pirate).poss} new look`, description:`A brawl breaks out over the dress. ${getPirateName(winner.pirate)} emerges victorious and will keep the dress forever${deathClause}.` };
			}
		}
	},
];
