const { Chord, Midi } = require('@tonaljs/tonal');
const modes = [
	{ name: 'ionian', pattern: [2, 2, 1, 2, 2, 2, 1]},
	{ name: 'dorian', pattern: [2, 1, 2, 2, 2, 1, 2]},
	{ name: 'phrygian', pattern: [1, 2, 2, 2, 1, 2, 2]},
	{ name: 'lydian', pattern: [2, 2, 2, 1, 2, 2, 1]},
	{ name: 'mixolydian', pattern: [2, 2, 1, 2, 2, 1, 2]},
	{ name: 'aeolian', pattern: [2, 1, 2, 2, 1, 2, 2]},
	{ name: 'locrian', pattern: [1, 2, 2, 1, 2, 2, 2]}
];

// function for generating a random integer between x and y
const r = module.exports.r = function (x, y) {

 	x = Math.ceil(x);
	y = Math.ceil(y);

	const min = x < y ? x : y;

	return Math.floor(Math.random() * Math.abs(x - y)) + min; //The maximum is exclusive and the minimum is inclusive
};

// generates an array of x random integers between min and max
const rx = module.exports.rx = function (x, min, max) {

	const res = [];

	for (let i = 0; i < x; i++) {
		res.push(r(min, max));
	}

	return res;
};

// parse a pattern string and return an array
// '154[r6[56]]7' => [1,5,4,[r,6,[5,6]],7]
const parsePattern = module.exports.parsePattern = function (p) {

	const res = [];
	if (typeof p !== 'string') {
		return p;
	}
 
	while (p.length) {
		const c = p.shift();

		if (c === '[') {
			res.push(parsePattern(p));
			continue;
		}

		if (c === ']') {
			break;
		}

		res.push(c)
	}

	return res;
};

// procrastinator deconstruct. It crams everything in at the end.
// generates x random integers that sum up to y
const procrastinator = module.exports.procrastinator = function (x, y) {

	const res = [];

	for (let i = 1; i < x; i++) {
		res.push(r(1, y - res.reduce((a, b) => a + b, 0) - (x - i)));
	}
	res.push(y - res.reduce((a, b) => a + b, 0));

	return res;
};

// deconstruct with uniform distribution.
// generates x random integers that sum up to y
const deconstruct = module.exports.deconstruct = function (x, y) {

	let res = new Array(x).fill(1).map((i) => Math.round(Math.random()*y/x));
	const sum = res.reduce((a, b) => a + b, 0);
	const aug = Math.floor((y - sum) / x);

	if (aug) {
		res = res.map((i) => i + aug);
	}

	while (res.reduce((a, b) => a + b, 0) < y) {

		const i = r(0, x); 
		res[i]++;
	}

	return res;
};


// splits an interval into x equal intervals
const split = module.exports.split = function (interval, x, resolution=128) {
	const res = [];

	if (interval % resolution) {
		console.warn('Your interval is not divisible by the resolution. Dont expect it to be perfect');
	}

	for (let i = 1; i < x; i++) {
		res.push(r(1, y - res.reduce((a, b) => a + b, 0) - (x - i)));
	}
	res.push(y - res.reduce((a, b) => a + b, 0));

	return res;
};

// choose n elements randomly from a given array
const choose = module.exports.choose = function (n, ar, options={}) {

	const min = options.min;
	const max = options.max;

	if (min) {
		ar = ar.filter((e) => e > min);
	}

	if (max) {
		ar = ar.filter((e) => e < max);
	}

	// Shuffle array
	const shuffled = ar.sort(() => 0.5 - Math.random());

	// Get sub-array of first n elements after shuffled
	return shuffled.slice(0, n);
};

// return all midi notes in given mode with root note
const getNotes = module.exports.getNotes = function (r, mode) {

	mode = modes.find((m) => m.name === mode);

	if (!mode) {
		throw new Error('That\'s not a mode!!');
	}

	r = r%12; // make sure the root number is in it's simplest form
	const pattern = mode.pattern; // pattern for minor scale
	const notes = [...Array(127).keys()]; // all possible MIDI notes
	const rootNotes = [r];

	pattern.forEach((n, i) => rootNotes.push(n + rootNotes[i]));

	// add any fundamental notes that are lower than the root note
	for (let i = pattern.length - 1; r - pattern[i] >= 0; i--) {

		rootNotes.unshift(r - pattern[i]);
		r = r - pattern[i];
	}

	return notes.filter((n) => rootNotes.includes(n%12));
};

const getChordNotes = module.exports.getChordNotes = (chord) => {

	// if the name of a chord has been passed then attempt to convert it to an array of notes
	if (typeof chord === 'string') {
		chord = Chord
			.get(notes).notes;
	}

	return chord.map((n) => Midi.toMidi(n));
};

// find all instances of given notes
const getInstancesOf = module.exports.getInstancesOf = function (notes, options) {

	const min = options.min;
	const max = options.max;
	const rootNotes = notes.map((n) => n%12);

	return [...Array(127).keys()] // all possible MIDI notes
		.filter((n) => rootNotes.includes(n%12)) // get all notes that are octaves of the root notes
        .filter((n) => n >= min && n <= max); // trim with max and min values
};
