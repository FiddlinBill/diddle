const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Diddle = require('./diddle.js');

const { expect } = Code;
const { it, experiment } = exports.lab = Lab.script();

experiment('run', () => {

	it('makes a simple ascending chromatic run by default', () => {

		const run = new Diddle()
			.run(0, 2).notes;

	    expect(run).to.equal([
	    	{ note: 0, duration: 128, delay: 0 },
	    	{ note: 1, duration: 128, delay: 0 },
	    	{ note: 2, duration: 128, delay: 0 }
	    ]);
	});

	it('makes a simple descending chromatic run', () => {

		const run = new Diddle()
			.run(2, 0, { descending: true }).notes;

	    expect(run).to.equal([
	    	{ note: 2, duration: 128, delay: 0 },
	    	{ note: 1, duration: 128, delay: 0 },
	    	{ note: 0, duration: 128, delay: 0 }
	    ]);
	});

	it('adds initial delay', () => {

		const run = new Diddle()
			.run(0, 2, { delay: 10 }).notes;

	    expect(run).to.equal([
	    	{ note: 0, duration: 128, delay: 10 },
	    	{ note: 1, duration: 128, delay: 0 },
	    	{ note: 2, duration: 128, delay: 0 }
	    ]);
	});

	it('applies a given resolution', () => {

		const run = new Diddle()
			.run(0, 2, { resolution: 1 }).notes;

	    expect(run).to.equal([
	    	{ note: 0, duration: 1, delay: 0 },
	    	{ note: 1, duration: 1, delay: 0 },
	    	{ note: 2, duration: 1, delay: 0 }
	    ]);
	});

	it('assumes an appropriate resolution if only duration is specified', () => {

		const run = new Diddle()
			.run(0, 2, { duration: 9 }).notes;

	    expect(run).to.equal([
	    	{ note: 0, duration: 3, delay: 0 },
	    	{ note: 1, duration: 3, delay: 0 },
	    	{ note: 2, duration: 3, delay: 0 }
	    ]);
	});

	it('adds any remainder to duration of last note in run', () => {

		const res = new Diddle()
			.run(0, 2, { duration: 11 }).notes;

	    expect(res.reduce((a, b) => a + b.duration, 0)).to.equal(11);
	    expect(res[res.length - 1].duration).to.equal(5);
	});

	it('returns an ascending run in a given mode', () => {

		const res = new Diddle()
			.run(0, 12, { mode: 'ionian' }).notes;

	    expect(res).to.equal([
	    	{ note: 0, duration: 128, delay: 0 },
	    	{ note: 2, duration: 128, delay: 0 },
	    	{ note: 4, duration: 128, delay: 0 },
	    	{ note: 5, duration: 128, delay: 0 },
	    	{ note: 7, duration: 128, delay: 0 },
	    	{ note: 9, duration: 128, delay: 0 },
	    	{ note: 11, duration: 128, delay: 0 },
	    	{ note: 12, duration: 128, delay: 0 }
	    ]);
	});

	it('returns an descending run in a given mode', () => {

		const res = new Diddle()
			.run(12, 0, { mode: 'ionian' }).notes;

	    expect(res).to.equal([
	    	{ note: 12, duration: 128, delay: 0 },
	    	{ note: 11, duration: 128, delay: 0 },
	    	{ note: 9, duration: 128, delay: 0 },
	    	{ note: 7, duration: 128, delay: 0 },
	    	{ note: 5, duration: 128, delay: 0 },
	    	{ note: 4, duration: 128, delay: 0 },
	    	{ note: 2, duration: 128, delay: 0 },
	    	{ note: 0, duration: 128, delay: 0 }
	    ]);
	});

	it('returns an ascending run with given mode and tonic', () => {

		const res = new Diddle()
			.run(12, 24, { mode: 'ionian', tonic: 4 }).notes;

	    expect(res).to.equal([
	    	{ note: 13, duration: 128, delay: 0 },
	    	{ note: 15, duration: 128, delay: 0 },
	    	{ note: 16, duration: 128, delay: 0 },
	    	{ note: 18, duration: 128, delay: 0 },
	    	{ note: 20, duration: 128, delay: 0 },
	    	{ note: 21, duration: 128, delay: 0 },
	    	{ note: 23, duration: 128, delay: 0 }
	    ]);
	});
});


experiment('repeat', () => {

	it('repeats array x number of times', () => {

		const run = new Diddle()
			.run(0, 2)
			.repeat(2).notes;

	    expect(run).to.equal([
	    	{ note: 0, duration: 128, delay: 0 },
	    	{ note: 1, duration: 128, delay: 0 },
	    	{ note: 2, duration: 128, delay: 0 },
	    	{ note: 0, duration: 128, delay: 0 },
	    	{ note: 1, duration: 128, delay: 0 },
	    	{ note: 2, duration: 128, delay: 0 }
	    ]);
	});

	it('the total duration is multiplied by x', () => {

		const run = new Diddle()
			.run(0, 2)
			.repeat(2).notes;

	    expect(run.reduce((a, b) => a + b.duration + (b.delay || 0), 0)).to.equal(128*6);
	});

});

experiment('progression', () => {

	it.only('create a progression from valid user input', () => {

		const progression = [
			{
				chord: 'C7', duration: 10
			},
			{
				chord: 'G7', duration: 5
			},
			{
				chord: 'F', duration: 10
			}
		];

		const prog = new Diddle(progression)
			.progression;

	    expect(prog).to.equal(progression);
	});

	it('the total duration is multiplied by x', () => {

		const run = new Diddle()
			.run(0, 2)
			.repeat(2).notes;

	    expect(run.reduce((a, b) => a + b.duration + (b.delay || 0), 0)).to.equal(128*6);
	});

});