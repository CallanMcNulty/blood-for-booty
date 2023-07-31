async function chooseManuallyFromTable(msg, table) {
	return table[await getChoice(msg, table.map((item, i) => ({ value:i, text:item.name })))];
}
async function chooseDieRollManually(msg, successFunc) {
	let opts = [];
	for(let i=1; i<=6; i++) {
		opts.push({ value:i, text:`${i}${successFunc ? ` (${successFunc(i)})`:''}` });
	}
	return await getChoice(msg, opts);
}

function randomInt(limit) {
	return Math.floor(Math.random()*limit);
}

function roll(pirate=null) {
	let result = randomInt(6)+1;
	if(pirate) {
		if(pirate.permanentFlags.has('cursed')) {
			result = 1;
		} else if(pirate.permanentFlags.has('blessed')) {
			if(result == 1) {
				pirate.permanentFlags.has('blessed');
				addToLog(`${getPirateName(pirate)} lost ${getPronouns(pirate).poss} luck`);
			} else {
				result = 6;
			}
		}
	}
	return result;
}

function randomResult(array, exclude=[]) {
	let availableItems = array.filter(item => !exclude.includes(item));
	return availableItems[randomInt(availableItems.length)];
}

function getPirateName(pirate) {
	let legend = pirate.attributes.find(a => attributeIsLegend(a));
	let appellations = [];
	if(legend) {
		appellations.push(legend.name);
	}
	if(pirate.appellation) {
		appellations.push(pirate.appellation);
	}
	let nickname = pirate.nickname;
	if(pirate.colors[1] == 'silver' && (hasAttribute(pirate, feature.blind) || hasAttribute(pirate, feature.beard) || hasAttribute(pirate, feature.toothless))) {
		nickname = 'Old';
	}
	if(hasAttribute(pirate, feature.hook) && hasAttribute(pirate, feature.leftHook)) {
		nickname = 'Hooks';
	}
	if(hasAttribute(pirate, feature.blind) && hasAttribute(pirate, feature.noNose)) {
		nickname = 'Senseless';
	}
	if(hasAttribute(pirate, feature.eyepatch) && hasAttribute(pirate, feature.pegLeg) && hasAttribute(pirate, feature.leftHook)) {
		nickname = 'Half';
	}
	if([hasAttribute(pirate, feature.parrot), hasAttribute(pirate, feature.monkey), hasAttribute(pirate, feature.crab), hasAttribute(pirate, feature.rat)].filter(v => v).length > 2) {
		nickname = 'Beastmaster';
	}
	if(pirate.voyageFlags.has('jig_king')) {
		nickname = 'Jig King';
	}
	let names = [];
	if(pirate.captain) {
		names.push('Cap’n');
	}
	if(nickname) {
		names.push(`“${nickname}”`);
	}
	names.push(pirate.name);
	if(appellations.length) {
		names.push(`the ${appellations.join(', ')}`);
	}
	return names.join(' ');
}

function getPronouns(pirate, cap=false) {
	let pronouns = pirate.female ? { nom:'she', acc:'her', poss:'her' } : { nom:'he', acc:'him', poss:'his' };
	if(cap) {
		for(let k of Object.keys(pronouns)) {
			let arr = pronouns[k].split('');
			arr[0] = arr[0].toUpperCase();
			pronouns[k] = arr.join('');
		}
	}
	return pronouns;
}

function incrementGrog(value) {
	let remainingGrog = grog + value;
	grog = Math.max(remainingGrog, 0);
	updateTopBar();
	updatePort();
	return remainingGrog;
}

function incrementBooty(value, potentialPlunderers) {
	let plunderers = filterByAttr(potentialPlunderers ?? crew, legend.plunderer);
	if(value > 0 && plunderers.length) {
		let extra = roll();
		value += extra;
		let plunderer = randomResult(plunderers);
		addToLog(`${getPirateName(plunderer)} plundered an extra ${extra} Booty`);
	}
	if(value < -booty) {
		value = -booty;
	}
	booty = booty + value;
	updateTopBar();
	updatePort();
	return value;
}

function incrementStashedBooty(value) {
	let remainingBooty = stashedBooty + value;
	stashedBooty = Math.max(remainingBooty, 0);
	updateTopBar();
	updatePort();
	return remainingBooty;
}

function updateTradableBooty(bootyDeficit) {
	if(tradableBooty !== null) {
		tradableBooty += bootyDeficit;
		if(tradableBooty <= 0) {
			tradableBooty = null;
		}
		updatePort();
	}
}

function getGrogPrice() {
	return shipWeeklyFlags.has('half_grog_cost') ? .5 : 1;
}

function getMaxTradeAmount() {
	return tradableBooty === null ? Infinity : tradableBooty;
}

function getMaxGrogPurchase() {
	return Math.min(getMaxTradeAmount(), shipWeeklyFlags.has('no_grog_sale') ? 0 : (booty / getGrogPrice()));
}

function canPurchaseGrogWithDevilsFist() {
	return devilsFist && getMaxTradeAmount() == Infinity && !shipWeeklyFlags.has('no_grog_sale');
}

function getMaxDeposit() {
	return Math.min(getMaxTradeAmount(), booty);
}

function purchaseGrog(purchase) {
	let purchaseCount = Math.min(purchase, getMaxGrogPurchase());
	let bootyDeficit = -Math.ceil(getGrogPrice()*purchaseCount);
	incrementBooty(bootyDeficit);
	incrementGrog(purchaseCount);
	updateTradableBooty(bootyDeficit);
}

function devilsFistForGrog() {
	if(canPurchaseGrogWithDevilsFist()) {
		devilsFist--;
		incrementGrog(Math.floor(50 / getGrogPrice()));
	}
}

function depositBooty(value) {
	let deposit = Math.min(value, getMaxDeposit());
	incrementBooty(-deposit);
	incrementStashedBooty(deposit);
	updateTradableBooty(-deposit);
}

function withdrawBooty(value) {
	let withdrawal = Math.min(stashedBooty, value);
	incrementStashedBooty(-withdrawal);
	incrementBooty(withdrawal, []);
}

async function recruitPirate() {
	if(grog >= 1 && booty >= 1) {
		incrementGrog(-1);
		incrementBooty(-1);
		await rollPirate();
		updateTradableBooty(-1);
		return true;
	}
	return false;
}

function canWin() {
	return booty + 50*devilsFist >= 300;
}

async function win() {
	if(!canWin()) {
		return;
	}
	let devilsFistsToSpend = Math.min(6, devilsFist);
	let toSpend = 300 - devilsFistsToSpend * 50;
	if(toSpend > booty) {
		return;
	}
	devilsFist -= devilsFistsToSpend;
	incrementBooty(-toSpend);
	updateTopBar();
	updateCrewList();
	await doAction('You won!', 'Congratulations on your successful life of piracy.', 'Play again');
	beginGame();
}

function getCaptain() {
	return crew.find(p => p.captain);
}

async function assignCaptain(newCaptain) {
	let oldCaptain = getCaptain();
	if(oldCaptain) {
		oldCaptain.captain = false;
		oldCaptain.job = null;
	}
	newCaptain.captain = true;
	newCaptain.job = 'helm';
	updateCrewList();
	await addToLog(`Crew is now led by ${getPirateName(newCaptain)}`); 
}

async function kill(pirate, cause='left the crew', literal = false) {
	if(!pirate.alive) {
		return;
	}
	let name = getPirateName(pirate);
	if(literal && hasAttribute(pirate, legend.bloody) && roll(pirate) > 3) {
		await addToLog(`${name} escaped death`);
		return false;
	}
	pirate.alive = !literal;
	pirate.causeOfDeath = cause;
	pirate.timeOfDeath = Date.now();
	crew = crew.filter(p => p != pirate);
	await addToLog(`${name} ${cause}`);
	if(crew.length == 0) {
		throw new Error('NO_CREW');
	}
	if(pirate.captain) {
		await pickNewCaptain();
	}
	updateCrewList();
	return true;
}

async function killRandomPirates(pirateGroup, method, number) {
	pirateGroup = [...pirateGroup];
	for(let i=0; i<number && pirateGroup.length; i++) {
		let cursed = pirateGroup.find(p => p.permanentFlags.has('cursed'));
		let target = cursed || randomResult(pirateGroup);
		await kill(target, method, true);
		pirateGroup = pirateGroup.filter(p => crew.includes(p));
	}
	return pirateGroup;
}

async function pickNewCaptain() {
	let legendaryPirates = crew.filter(p => p.attributes.some(attr => attributeIsLegend(attr)));
	let possibleCaptains = legendaryPirates.length ? legendaryPirates : crew;
	updateCrewList();
	let newCaptain = await getChoice('Who will be the new captain?', pirateOptions(possibleCaptains));
	await assignCaptain(newCaptain);
}

function attributeIsSkill(attr) {
	return Object.values(skill).includes(attr);
}
function attributeIsFlaw(attr) {
	return Object.values(flaw).includes(attr);
}
function attributeIsLegend(attr) {
	return Object.values(legend).includes(attr);
}
function attributeIsFeature(attr) {
	return Object.values(feature).includes(attr);
}

function skillValue(pirateGroup, usedSkill) {
	return filterByAttr(pirateGroup, usedSkill).length;
}

async function addAttribute(pirate, attr, unique=true) {
	const addingSkill = attributeIsSkill(attr);
	const addingFlaw = attributeIsFlaw(attr);
	if(
		hasAttribute(pirate, attr) ||
		(addingSkill && pirate.attributes.filter(a => attributeIsSkill(a)).length > 1) ||
		(addingFlaw && pirate.attributes.filter(a => attributeIsFlaw(a)).length > 1)
	) {
		return;
	}
	// add it
	pirate.attributes.push(attr);
	updateCrewList();
	await addToLog(`${getPirateName(pirate)} gained the “${attr.name}” ${addingSkill ? 'Skill' : addingFlaw ? 'Flaw' : 'Feature'}`);
	// check for legendary pirate status
	if(addingSkill) {
		let skills = pirate.attributes.filter(a => attributeIsSkill(a));
		if(skills.length == 2) {
			let earnedLegend = Object.values(legend).find(l => l.skills.includes(skills[0]) && l.skills.includes(skills[1]));
			if(!pirates.some(p => hasAttribute(p, earnedLegend) && p.alive)) {
				pirate.attributes.push(earnedLegend);
				updateCrewList();
				await addToLog(`${getPirateName(pirate)} became a Legendary Pirate`);
			}
		}
	}
	if(unique) {
		await ensureUniqueness(pirate);
	}
}

async function removeAttribute(pirate, attr) {
	let idx = pirate.attributes.indexOf(attr);
	if(idx > -1) {
		pirate.attributes.splice(idx, 1);
		let type = 'Feature';
		if(attributeIsFlaw(attr)) {
			type = 'Flaw';
		} else if(attributeIsSkill(attr)) {
			type = 'Skill';
		}
		await addToLog(`${getPirateName(pirate)} lost the “${attr.name}” ${type}`);
		await ensureUniqueness(pirate);
	}
	updateCrewList();
}

async function ensureUniqueness(pirate) {
	while(crew.some(other => {
		return other.alive && other != pirate && other.attributes.length == pirate.attributes.length &&
			pirate.attributes.every(a => hasAttribute(other, a))
		;
	})) {
		await addAttribute(pirate, randomFeature(pirate));
	}
	return 0;
}

function hasAttribute(pirate, attr) {
	return pirate.attributes.includes(attr);
}

function filterByAttr(pirateGroup, attr) {
	return pirateGroup.filter(p => hasAttribute(p, attr));
}

async function rollSkill(pirate, alreadyRolled = null) {
	let result = roll();
	let chosenSkill = null;
	switch(result) {
		case 1:
			return await rollFlaw(pirate);
		case 2:
			chosenSkill = skill.swashbucklin;
			break;
		case 3:
			chosenSkill = skill.swaggerin;
			break;
		case 4:
			chosenSkill = skill.stealin;
			break;
		case 5:
			chosenSkill = skill.shootin;
			break;
		case 6:
			if(!alreadyRolled) {
				updateCrewList();
				chosenSkill = await getChoice(
					`${getPirateName(pirate)} needs a skill. What will it be?`, Object.values(skill).map(s => ({ value:s, text:s.name }))
				);
				await addAttribute(pirate, chosenSkill, false);
				await rollSkill(pirate, chosenSkill);
			} else {
				chosenSkill = alreadyRolled;
			}
			break;
	}
	if(chosenSkill != alreadyRolled) {
		await addAttribute(pirate, chosenSkill);
		return chosenSkill;
	} else {
		return await rollFlaw(pirate);
	}
}

function randomFeature(pirate) {
	featureTable[0] = pirate.female ? feature.earrings : feature.beard;
	return randomResult(featureTable);
}

async function rollFlaw(pirate) {
	let result = roll();
	let chosenFlaw;
	switch(result) {
		case 1:
			chosenFlaw = flaw.scummy;
			break;
		case 2:
			chosenFlaw = flaw.scaredy;
			break;
		case 3:
			chosenFlaw = flaw.seasick;
			break;
		case 4:
			chosenFlaw = flaw.swigger;
			break;
		case 5:
			chosenFlaw = flaw.scrapper;
			break;
		case 6:
			chosenFlaw = randomFeature(pirate);
			break;
	}
	await addAttribute(pirate, chosenFlaw);
	return chosenFlaw;
}

async function rollPirate(withSkills=true, defaultFemale=null) {
	let female = defaultFemale === null ? Math.random() < .15 : defaultFemale;
	// name
	do {
		var name = randomResult(female ? femaleNameList : maleNameList);
	} while(pirates.some(p => p.name == name));
	// colors
	let skinColors = ['lemonchiffon', 'cornsilk', 'blanchedalmond', 'bisque', 'peachpuff', 'navajowhite', 'wheat', 'burlywood', 'sandybrown', 'darksalmon', 'peru', 'chocolate', 'sienna', 'saddlebrown'];
	let skinIndex = randomInt(skinColors.length);
	let skinColor = skinColors[skinIndex];
	// weird logic to make sure hair color works with skin color
	let hairColors = ['black', 'saddlebrown', 'brown', 'goldenrod', 'darkorange', 'palegoldenrod', 'silver'];
	let hairColor = hairColors[hairColors.length-1];
	if(randomInt(10) < 9) {
		let hairIndexMax = Math.ceil((1 - (skinIndex / skinColors.length)) * (hairColors.length  - 1));
		hairColor = hairColors[randomInt(hairIndexMax)];
	}
	let clothingColors = ['beige', 'slategrey', 'cadetblue', 'rosybrown', 'mediumpurple', 'salmon', 'darkcyan', 'darkolivegreen', 'dodgerblue', 'cornflowerblue', 'darkseagreen', 'tomato'];
	let shirtColor = randomResult(clothingColors);
	do {
		var pantsColor = randomResult(clothingColors);
	} while(shirtColor == pantsColor);
	let newPirate = {
		name: name,
		job: null,
		explorer: null,
		captain: false,
		alive: true,
		causeOfDeath: 'is not yet dead',
		timeOfDeath: null,
		attributes: [],
		rivals: new Set(),
		weeklyFlags: new Set(),
		voyageFlags: new Set(),
		permanentFlags: new Set(),
		nickname: null,
		appellation: null,
		hair: { parts:[] },
		colors: [],
		female: female,
		lastMoved: 0,
	};
	newPirate.colors = [skinColor, hairColor, shirtColor, pantsColor];
	newPirate.hair = randomResult(newPirate.female ? femaleHairstyles : maleHairstyles);
	// mechanical stuff
	pirates.push(newPirate);
	await addPirateToCrew(newPirate);
	if(withSkills) {
		await rollSkill(newPirate);
	}
	if(
		crew.some(pirate => pirate.permanentFlags.has('hook_club')) &&
		(hasAttribute(newPirate, feature.hook) || hasAttribute(newPirate, feature.leftHook))
	) {
		newPirate.permanentFlags.add('hook_club');
	}
	return newPirate;
}

async function addPirateToCrew(newPirate) {
	crew.push(newPirate);
	updateCrewList();
	await addToLog(`${getPirateName(newPirate)} joined the crew`);
}

function cannotWork(pirate, workers) {
	// nobody works while mast is broken
	if(shipPermanentFlags.has('broken_mast')) {
		return 'Repairing the mast is more important than normal jobs';
	}
	// non-work flags
	if(pirate.weeklyFlags.has('hurt_hand')) {
		return 'Given the week off for hurt hand';
	}
	if(pirate.weeklyFlags.has('scrapped')) {
		return 'Got in a fight and is too hurt to work';
	}
	if(pirate.weeklyFlags.has('sick') && filterByAttr(workers, legend.terrible).length == 0) {
		return 'Too sick to work';
	}
	let doesNothingResult = doesNotDoAnything(pirate);
	if(doesNothingResult) {
		return doesNothingResult;
	}
	if(shipWeeklyFlags.has('fish_game')) {
		return 'Distracted by the fish game';
	}
	if(shipWeeklyFlags.has('singsong')) {
		return 'Distracted by the singsong';
	}
	// scummy
	let scummyPirates = workers.filter(w => hasAttribute(w, flaw.scummy) || w.voyageFlags.has('beard_lice'));
	if(scummyPirates.length && !scummyPirates.includes(pirate)) {
		return 'Will not work with scummy pirate';
	}
	// hook club
	if(pirate.permanentFlags.has('hook_club')) {
		let hookClub = crew.filter(pirate => pirate.permanentFlags.has('hook_club'));
		if(hookClub.some(p => !workers.includes(p))) {
			return 'Insists on working with the hook club';
		}
	}
	// rivals
	let rival = workers.find(other => pirate.rivals.has(other));
	if(rival) {
		return `Will not work with rival ${getPirateName(rival)}`;
	}
	return null;
}

function filterWorkers(workers) {
	return workers.filter(w => !cannotWork(w, workers));
}

async function filterNonScared(pirateGroup) {
	let filtered = [];
	for(let pirate of pirateGroup) {
		let scaredy = hasAttribute(pirate, flaw.scaredy) || (shipVoyageFlags.has('haunted') && !hasAttribute(pirate, skill.swaggerin));
		if(scaredy && roll(pirate) < 4) {
			await addToLog(`${getPirateName(pirate)} got scared and ran away`);
			continue;
		}
		filtered.push(pirate);
	}
	return filtered;
}

function filterAvailable(pirateGroup) {
	return pirateGroup.filter(pirate => !doesNotDoAnything(pirate));
}

async function filterDangerousEventActors(pirateGroup) {
	return await filterNonScared(filterAvailable(pirateGroup));
}

function filterExplorers() {
	return crew.filter(pirate => pirate.explorer);
}

function doesNotDoAnything(pirate) {
	if(pirate.voyageFlags.has('boxed')) {
		return 'Stuck in a box';
	} else if(pirate.voyageFlags.has('gangrenous')) {
		return 'Has gangrene and cannot do anything';
	}
}

async function rollOnSobrietyTable(soberPirate) {
	let event = soberPirateTable[randomInt(6)];
	if(event) {
		event = Object.assign({}, event);
		event.description = event.description.replace('The pirate', getPirateName(soberPirate));
		await showEvent(event, 'Sober Pirate', soberPirate);
	} else {
		await addToLog(`${getPirateName(soberPirate)} just about managed to function despite the lack of Grog.`);
	}
}

async function rollOnCaptainsMadnessTable() {
	await showEvent(randomResult(captainsMadnessTable), 'Captain’s Madness');
}

async function doWeek() {
	await addToLog(`New week started`);
	if(autoSave) {
		localStorage.setItem('blood4booty-saved-game', serializeGameState());
	}
	if(shipPermanentFlags.has('becalmed')) {
		if(roll() > 3) {
			shipPermanentFlags.delete('becalmed');
			await addToLog(`Ship has left the doldrums`);
		}
	}
	let startedWeekWithBrokenMast = shipPermanentFlags.has('broken_mast');
	let startedWeekWithWaitingCastaway = shipPermanentFlags.has('waiting_castaway');
	let piratesStartingWeekWithHurtHand = pirates.filter(pirate => pirate.permanentFlags.has('hurt_hand'));
	if(shipVoyageFlags.has('scurvy')) {
		await rollScurvy();
	}
	let crewAway = pirates.filter(pirate => pirate.permanentFlags.has('away_on_plan'));
	if(crewAway.length) {
		let planResult = roll();
		if(planResult < 3) {
			await addToLog('The ship found the smashed up remains of the conspirators’ rowboat');
			for(let deadPirate of crewAway) {
				await kill(deadPirate, 'died in a rowboat wreck', true);
			}
		} else {
			if(planResult > 4) {
				incrementBooty(crewAway.length*10, crewAway);
				await addToLog('Conspirators returned with 10 Booty each');
			} else {
				await addToLog('Conspirators returned with some worthless driftwood and get a good beating from the Captain');
			}
			for(let pirate of crewAway) {
				if(pirate.alive) {
					await addPirateToCrew(pirate);
				}
			}
		}
		for(let pirate of crewAway) {
			pirate.permanentFlags.delete('away_on_plan');
		}
	}
	if(shipPermanentFlags.has('hull_damage') && roll() == 1) {
		for(let pirate of crew) {
			await kill(pirate, 'drowned when ship sank', true);
		}
		await addToLog('The ship sank');
	}
	if(inPort) {
		inPort = false;
		await addToLog(`Shoving off!`);
	}
	// handle seasickness
	let seasickPirates = crew.filter(pirate => hasAttribute(pirate, flaw.seasick) || pirate.voyageFlags.has('as_seasick') || pirate.permanentFlags.has('ate_bad_fruit'))
	for(let pirate of seasickPirates) {
		if(roll(pirate) < 3) {
			pirate.weeklyFlags.add('sick');
			await addToLog(`${getPirateName(pirate)} is too sick to work this week`);
		}
	}
	// jobs
	await doJobAssignments();
	let team = { helm: crew.filter(w => w.job == 'helm'), deck: crew.filter(w => w.job == 'deck'), sails: crew.filter(w => w.job == 'sails') };
	// handle scraps
	let scrappyPirates = filterByAttr(crew, flaw.scrapper)
	for(let scrapper of scrappyPirates) {
		let workers = team[scrapper.job];
		if(workers && workers.length > 1 && roll() == 1 && filterByAttr(workers, legend.terrible).length == 0) {
			workers = workers.filter(w => w != scrapper);
			let target = randomResult(workers);
			scrapper.weeklyFlags.add('scrapped');
			target.weeklyFlags.add('scrapped');
			await addToLog(`${getPirateName(scrapper)} started a fight with ${getPirateName(target)}, preventing either of them from working this week`);
		}
	}
	// helm
	await addToLog(`The Captain takes the Helm…`);
	let helmsmen = filterWorkers(team.helm);
	if(!helmsmen.some(h => !h.captain) && !shipPermanentFlags.has('broken_mast')) {
		await rollOnCaptainsMadnessTable();
	}
	let helmSucceeded = helmsmen.includes(getCaptain());
	if(!(getCaptain().voyageFlags.has('no_heading_change') || getCaptain().permanentFlags.has('whale_obsession'))) {
		if(helmSucceeded) {
			headingToIsland = await getChoice('What is our heading?', [
				{ value: true, text: 'Island', selected: headingToIsland },
				{ value: false, text: 'Port', selected: !headingToIsland },
			]);
			await addToLog(`We are on course`);
		} else {
			let helmRoll = roll();
			if(CHOOSE_ROLLS) {
				helmRoll = await chooseDieRollManually('Helm roll', n => n > 3 ? 'succeed' : 'fail');
			}
			headingToIsland = helmRoll > 3;
			await addToLog(`Captain cannot steer the ship. Our heading is now ${headingToIsland ? 'island' : 'port'}`);
		}
	} else {
		await addToLog(`Captain refuses to change our heading`);
	}
	// deck
	let deckhands = filterWorkers(team.deck);
	await addToLog(`The crew on the Decks get to work…`);
	let result = roll();
	if(CHOOSE_ROLLS) {
		result = await chooseDieRollManually('Deck job roll', n => (n == 1 || n+deckhands.length) < 6 ? 'fail' : 'succeed');
	}
	if(result > 1) {
		result += deckhands.length;
	}
	if(result < 6) {
		await addToLog(`Decks running poorly. Something bad may happen…`);
		let event = randomResult(crewEventTable);
		if(CHOOSE_ROLLS) {
			event = await chooseManuallyFromTable('Choose Crew Event', crewEventTable);
		}
		await showEvent(event, 'Crew Event');
	} else {
		await addToLog(`Decks running smoothly`);
	}
	// sails
	let sailors = filterWorkers(team.sails);
	await addToLog(`The crew set Sail…`);
	result = roll();
	if(CHOOSE_ROLLS) {
		result = await chooseDieRollManually('Sails job roll', n => (n == 1 || n+sailors.length < 6) ? 'fail' : 'succeed');
	}
	if(result > 1) {
		result += sailors.length;
	}
	if(shipPermanentFlags.has('mast_rot')) {
		result -= 2;
	}
	let destinationReached = false;
	if(result >= 6 && !shipPermanentFlags.has('broken_mast') && !shipPermanentFlags.has('becalmed')) {
		// reached destination
		destinationReached = true;
		if(shipVoyageFlags.has('uncertain_navigation')) {
			let navResult = roll();
			if(navResult == 1) {
				destinationReached = false;
			} else if(navResult == 1) {
				headingToIsland = !headingToIsland;
			}
			shipVoyageFlags.delete('uncertain_navigation');
		}
	} else {
		// still at sea
		await addToLog(`No land in sight`);
		let event = randomResult(seaEncounterTable);
		if(CHOOSE_ROLLS) {
			event = await chooseManuallyFromTable('Choose Sea Encounter', seaEncounterTable);
		}
		await showEvent(event, 'Sea Encounter');
		if(shipWeeklyFlags.has('early_arrival')) {
			destinationReached = true;
		}
	}
	// handle arrival at destination
	if(destinationReached && getCaptain().permanentFlags.has('whale_obsession')) {
		await addToLog('White Whale spotted!');
		let whalers = await filterDangerousEventActors(crew);
		let whaleResult = roll() + skillValue(whalers, skill.shootin);
		if(whaleResult < 3) {
			await killRandomPirates(whalers, 'was eaten by a whale', true);
			incrementBooty(-roll());
			await addToLog('The Whale escaped and managed to swallow one pirate and some Booty in the process');
		} else if(whaleResult < 5) {
			await addToLog('The Whale escaped');
		} else {
			let whaleBoneBooty = incrementBooty(roll()+roll(), whalers);
			getCaptain().permanentFlags.delete('whale_obsession');
			await addToLog(`The Whale is caught, much to the relief of the Captain, and its bones are worth ${whaleBoneBooty} Booty`);
		}
	} else if(destinationReached) {
		await addToLog(`Land ho!`);
		if(shipVoyageFlags.has('bad_compass')) {
			headingToIsland = roll() > 3;
			await addToLog(`Indecisive compass led us to this ${headingToIsland ? 'Island' : 'Port'}`);
			shipVoyageFlags.delete('bad_compass');
		}
		if(shipVoyageFlags.has('curse')) {
			if(roll() < 3) {
				incrementBooty(-booty);
				await addToLog(`All Booty disappeared! We shouldn’t have messed with that cursed ship!`);
			}
			shipVoyageFlags.delete('curse');
		}
		let eventReRollable = shipVoyageFlags.has('dolphin_guides');
		if(eventReRollable) {
			shipVoyageFlags.delete('dolphin_guides');
		}
		if(headingToIsland) {
			if(startedWeekWithWaitingCastaway) {
				await addToLog(`Castaway found`);
				await rollPirate();
			}
			do {
				shipWeeklyFlags.delete('turtle_transport');
				// choose explorers
				let options = filterAvailable(crew).filter(p => !p.permanentFlags.has('caver')).map(w => pirateToOption(w, w.explorer));
				if(!options.length) {
					break;
				}
				let chosenExplorers = await getChoice(
					'We’ve reached an Island. Who should be on the exploration team?', options, 1, options.length
				);
				if(options.length == 1) {
					chosenExplorers = [ chosenExplorers ];
				}
				for(let pirate of crew) {
					pirate.explorer = chosenExplorers.includes(pirate);
				}
				let explorers = filterExplorers();
				// get event
				let event = randomResult(islandExplorationTable);
				if(CHOOSE_ROLLS) {
					event = await chooseManuallyFromTable('Choose Island', islandExplorationTable);
				}
				if(shipPermanentFlags.has('treasure_map')) {
					shipPermanentFlags.delete('treasure_map');
					let eventIndex = islandExplorationTable.indexOf(event);
					let nextIndex = (eventIndex + 1) % islandExplorationTable.length;
					let priorIndex = eventIndex ? eventIndex - 1 : (islandExplorationTable.length - 1);
					let eventOpts = [
						event, islandExplorationTable[priorIndex], islandExplorationTable[nextIndex]
					].map(e => ({ value:e, text:e.name }));
					event = await getChoice(`Where is our treasure map leading us?`, eventOpts);
				}
				let reroll = false;
				if(eventReRollable) {
					reroll = await getChoice(`We found our way to ${event.name}. Should we let our dolphin guides direct us elsewhere?`, [
						{ value: true, text: 'Yes' },
						{ value: false, text: 'No, this place is fine' },
					]);
				}
				let fated = explorers.find(p => p.permanentFlags.has('fated'));
				if(fated) {
					reroll = await getChoice(`We found our way to ${event.name}. Will ${getPirateName(fated)} use ${getPronouns(fated).poss} good luck to direct us elsewhere?`, [
						{ value: true, text: 'Yes (the new result will be final)' },
						{ value: false, text: 'No' }
					]);
					fated.permanentFlags.delete('fated');
				}
				if(reroll) {
					event = randomResult(islandExplorationTable);
				}
				// do event
				let savedState = JSON.parse(serializeGameState());
				await showEvent(event, 'Island Exploration', explorers);
				if(shipWeeklyFlags.has('treasure_hunter_iou')) {
					let bootyDiff = booty - savedState.booty;
					let shares = [];
					if(bootyDiff > 0) {
						let repaid = Math.floor(bootyDiff / 2);
						incrementBooty(-repaid);
						shares.push(`${repaid} Booty`);
					}
					let grogDiff = grog - savedState.grog;
					if(grogDiff > 0) {
						let repaid = Math.floor(grogDiff / 2);
						incrementGrog(-repaid);
						shares.push(`${repaid} Grog`);
					}
					if(shares.length) {
						await addToLog(`Treasure hunters claimed their share of ${shares.join(' and ')}`);
					}
				}
			} while(shipWeeklyFlags.has('turtle_transport'));
		}
		if(!headingToIsland) {
			inPort = true;
			await addToLog(`Making port`);
			// barnacles
			if(shipPermanentFlags.has('barnacles') && booty >= 3) {
				incrementBooty(-3);
				shipPermanentFlags.delete('barnacles');
				await addToLog(`Barnacles removed`);
			}
			// homesickness
			if(getCaptain().voyageFlags.has('homesick') && booty) {
				let spent = incrementBooty(-roll()-roll());
				await addToLog(`Captain spent ${-spent} Booty on luxuries out of homesickness`);
			}
			// bad fruit
			for(let pirate of crew) {
				if(pirate.permanentFlags.has('ate_bad_fruit') && pirate.alive && booty > 0) {
					incrementBooty(-1);
					pirate.permanentFlags.delete('ate_bad_fruit');
					await addToLog(`${getPirateName(pirate)} spent 1 Booty on leeches to cure ${getPronouns(pirate).poss} food poisoning`);
				}
			}
			// saw hell
			let clergyBound = crew.filter(pirate => pirate.permanentFlags.has('glimpsed_hell'));
			for(let p of clergyBound) {
				await kill(p, `left the pirate life to become a ${p.female ? 'nun' : 'priest'}`, false);
			}
			// jail
			let jailbirds = crew.filter(pirate => pirate.voyageFlags.has('in_jail') && pirate.alive);
			if(jailbirds.length) {
				await addToLog(`${jailbirds.length} pirate(s) returned from jail`);
				for(let pirate of jailbirds) {
					await addPirateToCrew(pirate);
				}
			}
			// sell goods
			if(shipVoyageFlags.has('carrying_high_value_goods')) {
				if(roll() < 4) {
					let earnings = incrementBooty(1, crew);
					await addToLog(`The goods were not in demand after all and were only sold for ${earnings} Booty`);
				} else {
					let earnings = incrementBooty(30, crew);
					await addToLog(`The deal worked and the goods were sold for ${earnings} Booty`);
				}
			}
			// deliver messenger
			if(shipVoyageFlags.has('carrying_messenger')) {
				incrementBooty(10, crew);
				await addToLog('Messenger arrived at destination and gave us our fee');
			}
			// repairs
			const devilsFistOption = devilsFist ? [ { value: 2, text: 'Yes, and pay with Devil’s Fist' } ] : [];
			if(shipPermanentFlags.has('hull_damage') && booty >= 10) {
				let repair = await getChoice('Should the hull be repaired for 10 Booty', [
					{ value: 1, text: 'Yes' },
					{ value: 0, text: 'No' },
					...devilsFistOption,
				]);
				if(repair) {
					if(repair == 1) {
						incrementBooty(-10);
					} else {
						devilsFist--;
						updateTopBar();
					}
					shipPermanentFlags.delete('hull_damage');
				}
			}
			if(shipPermanentFlags.has('mast_rot') && booty >= 5) {
				let repair = await getChoice('Should the mast be repaired for 5 Booty', [
					{ value: 1, text: 'Yes' },
					{ value: 0, text: 'No' },
					...devilsFistOption,
				]);
				if(repair) {
					if(repair == 1) {
						incrementBooty(-5);
					} else {
						devilsFist--;
						updateTopBar();
					}
					shipPermanentFlags.delete('mast_rot');
				}
			}
			// clear flags
			shipVoyageFlags.clear();
			crew.forEach(pirate => pirate.voyageFlags.clear());
			// happening
			let happening = randomResult(portHappeningTable);
			if(CHOOSE_ROLLS) {
				happening = await chooseManuallyFromTable('Choose Port Happening', portHappeningTable);
			}
			if(eventReRollable) {
				let reroll = await getChoice(`${happening.name} is happening at this Port. Should we let our dolphin guides direct us elsewhere?`, [
					{ value: true, text: 'Yes' },
					{ value: false, text: 'No, this port is fine' },
				]);
				if(reroll) {
					happening = randomResult(portHappeningTable);
				}
			}
			await showEvent(happening, 'Port Happening');
			if(!shipWeeklyFlags.has('skip_port_actions')) {
				let crewNeedingNecessities = crew.filter(p => !p.weeklyFlags.has('striking'));
				let necessityCost = shipWeeklyFlags.has('no_port_cost') ? 0 : (shipWeeklyFlags.has('double_port_cost') ? 2 : 1);
				let spent = incrementBooty(-crewNeedingNecessities.length * necessityCost);
				await addToLog(`The crew spent ${-spent} Booty on necessities`);
				// handle backstabber
				let backstabber = filterByAttr(crew, legend.backstabber)[0];
				if(backstabber) {
					let result = roll(backstabber);
					if(result == 1) {
						backstabber.voyageFlags.add('in_jail');
						await kill(backstabber, 'was thrown in jail', false);
					} else {
						result = incrementBooty(result, crew);
						await addToLog(`${getPirateName(backstabber)} acquired ${result} Booty through armed robbery`);
					}
				}
				// handle bastard
				let bastard = filterByAttr(crew, legend.bastard)[0];
				if(bastard) {
					let result = roll(bastard);
					if(result == 1) {
						await kill(bastard, 'was killed by a rival', true);
					} else if(result > 4) {
						await addToLog(`${getPirateName(bastard)} beat up an enemy so badly, they're joining the crew out of admiration`);
						await rollPirate();
					}
				}
				// get player actions
				await doPortActions();
			}
		}
	}
	// calculate grog consumption
	if(!inPort) {
		await addToLog(`The crew were given their weekly Grog`);
		let grogDrinkers = crew.filter(pirate => !pirate.voyageFlags.has('boxed'));
		let consumedGrog = grogDrinkers.length;
		let doubleConsumption = shipWeeklyFlags.has('heatwave');
		if(doubleConsumption) {
			consumedGrog *= 2;
		}
		let swiggers = filterByAttr(grogDrinkers, flaw.swigger);
		let soberPirates = [];
		for(let swigger of swiggers) {
			let previousConsumption = consumedGrog;
			while(roll() < 4) {
				if(consumedGrog < grog) {
					consumedGrog ++;
				} else {
					soberPirates.push(swigger);
					break;
				}
			}
			await addToLog(`${getPirateName(swigger)} drank ${consumedGrog - previousConsumption} extra Grog`);
		}
		if(consumedGrog < grog) {
			consumedGrog += grogDrinkers.filter(pirate => pirate.weeklyFlags.has('deserves_extra_grog')).length;
		}
		let remainingGrog = incrementGrog(-consumedGrog);
		if(remainingGrog < 0) {
			let soberCount = Math.ceil(Math.abs(remainingGrog / (doubleConsumption ? 2 : 1)));
			if(soberCount) {
				await addToLog(`${soberCount} pirates did not get enough Grog`);
			}
			for(let i=0; i<soberCount; i++) {
				let soberPirate = randomResult(grogDrinkers, soberPirates);
				grogDrinkers.splice(grogDrinkers.indexOf(soberPirate), 1);
				if(soberPirate && crew.includes(soberPirate)) { // check that a pirate is found, in case they've all been killed
					soberPirates.push(soberPirate);
				}
			}
			for(let soberPirate of soberPirates) {
				await rollOnSobrietyTable(soberPirate);
			}
			if(shipVoyageFlags.has('bad_grog')) {
				grogDrinkers.filter(pirate => !soberPirates.includes(pirate)).forEach(pirate => pirate.voyageFlags.add('as_seasick'));
			}
		}
	}
	// extra week-end stuff
	if(startedWeekWithBrokenMast && shipPermanentFlags.has('broken_mast') && roll() > 2) {
		await addToLog('Broken mast repaired');
		shipPermanentFlags.delete('broken_mast');
	}
	if(shipVoyageFlags.has('rats')) {
		switch(roll()) {
			case 1:
				if(incrementGrog(-1)) {
					await addToLog('Rats ate through 1 Grog barrel');
				}
				break;
			case 2:
				if(incrementBooty(-1)) {
					await addToLog('Rats ruined 1 piece of Booty');
				}
				break;
			case 6:
				let petRatRecipient = randomResult(crew, filterByAttr(crew, feature.rat));
				if(petRatRecipient) {
					await addAttribute(petRatRecipient, feature.rat);
				}
				await addToLog(`${getPirateName(petRatRecipient)} takes rat as a pet`);
				break;
		}
	}
	if(startedWeekWithWaitingCastaway) {
		shipPermanentFlags.delete('waiting_castaway');
	}
	piratesStartingWeekWithHurtHand.forEach(pirate => pirate.permanentFlags.delete('hurt_hand'));
	shipWeeklyFlags.clear();
	pirates.forEach(pirate => pirate.weeklyFlags.clear());
	playGame();
}

async function playGame() {
	try {
		await doWeek();
	} catch(e) {
		if(e.message == 'NO_CREW') {
			updateCrewList();
			if(!AUTO) {
				await doAction('Game Over', 'With no more crew, your pirate journey is over.', 'Restart');
			}
			beginGame();
		} else {
			console.error(e);
			await doAction('Something went wrong',
				DEBUG_MODE ? e.stack : 'Looks like we got a software bug here.',
				'Attempt to recover'
			);
			playGame();
		}
	}
}

function pause() {
	autoPlay = false;
	updateTopBar();
}

function play() {
	autoPlay = true;
	updateTopBar();
}

function setPaused(state) {
	paused = state;
	updateTopBar();
	updateCrewList();
}

function serializeGameState() {
	let piratesCopy = [];
	let crewCopy = crew.map(p => null);
	for(let p of pirates) {
		let copy = JSON.parse(JSON.stringify(p));
		crewCopy[crew.indexOf(p)] = piratesCopy.length;
		piratesCopy.push(copy);
		copy.attributes = p.attributes.map(attr => {
			let list = feature;
			let listName = 'feature';
			if(attributeIsSkill(attr)) {
				list = skill;
				listName = 'skill';
			} else if(attributeIsFlaw(attr)) {
				list = flaw;
				listName = 'flaw';
			} else if(attributeIsLegend(attr)) {
				list = legend;
				listName = 'legend';
			}
			return { list:listName, key:Object.keys(list).find(key => list[key] == attr) };
		});
		copy.rivals = Array.from(p.rivals);
		copy.weeklyFlags = Array.from(p.weeklyFlags);
		copy.voyageFlags = Array.from(p.voyageFlags);
		copy.permanentFlags = Array.from(p.permanentFlags);
	}
	return JSON.stringify({
		grog: grog,
		booty: booty,
		devilsFist: devilsFist,
		stashedBooty: stashedBooty,
		tradableBooty: tradableBooty,
		inPort: inPort,
		headingToIsland: headingToIsland,
		pirates: piratesCopy,
		crew: crewCopy,
		shipWeeklyFlags: Array.from(shipWeeklyFlags),
		shipVoyageFlags: Array.from(shipVoyageFlags),
		shipPermanentFlags: Array.from(shipPermanentFlags),
	});
}

function loadGameState(saved) {
	grog = saved.grog;
	booty = saved.booty;
	devilsFist = saved.devilsFist;
	stashedBooty = saved.stashedBooty;
	tradableBooty = saved.tradableBooty;
	inPort = saved.inPort;
	headingToIsland = saved.headingToIsland;
	saved.pirates.forEach(p => {
		p.attributes = p.attributes.map(attr => {
			switch(attr.list) {
				case 'skill':
					return skill[attr.key];
				case 'flaw':
					return flaw[attr.key];
				case 'legend':
					return legend[attr.key];
				case 'feature':
					return feature[attr.key];
			}
		});
		p.rivals = new Set(p.rivals);
		p.weeklyFlags = new Set(p.weeklyFlags);
		p.voyageFlags = new Set(p.voyageFlags);
		p.permanentFlags = new Set(p.permanentFlags);
	});
	pirates = saved.pirates;
	crew = saved.crew.map(idx => pirates[idx]);
	shipWeeklyFlags = new Set(saved.shipWeeklyFlags);
	shipVoyageFlags = new Set(saved.shipVoyageFlags);
	shipPermanentFlags = new Set(saved.shipPermanentFlags);
	updateTopBar();
	updateCrewList();
}

function load() {
	let saved = localStorage.getItem('blood4booty-saved-game');
	if(saved) {
		resetGlobals();
		loadGameState(JSON.parse(saved));
		switchInterface();
		playGame();
	}
}

function resetGlobals() {
	grog = 40;
	booty = 0;
	devilsFist = 0;
	stashedBooty = 0;
	tradableBooty = null;
	inPort = false;
	headingToIsland = true;
	pirates = [];
	crew = [];
	shipWeeklyFlags = new Set();
	shipVoyageFlags = new Set();
	shipPermanentFlags = new Set();
	autoPlay = true;
	paused = false;
	autoSave = false;
	updateTopBar();
	clearLog();
}

function beginGame() {
	resetGlobals();
	(async () => {
		await addToLog(`Generating starting crew`);
		for(let i=0; i<8; i++) {
			await rollPirate();
		}
		await pickNewCaptain();

		updateCrewList();
		playGame();
	})();
}
