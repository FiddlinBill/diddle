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

	it('creates a progression from valid user input', () => {

		const progression = [
			{
				chord: ['M', 'C4'], duration: 10
			},
			{
				chord: ['M', 'G4'], duration: 5
			},
			{
				chord: ['M', 'F4'], duration: 10
			}
		];

		const prog = new Diddle({ progression })
			.progression;

	    expect(prog).to.equal(progression);
	});

	it('chokes on invalid user input', () => {

		const progression = [
			{
				chord: 9, duration: '10'
			},
			{
				chord: 'G7', duration: 5
			},
			{
				chord: 'F', duration: 10
			}
		];
		
		try {
			new Diddle({ progression }).progression;
		} catch (err) {
			expect(err).to.exist();
			expect(err.details[0].message).to.equal('"progression[0].chord" must be one of [array]');
		}
	});
});


experiment('fill', () => {

	it('chokes on invalid user input', () => {

		const progression = [
			{
				chord: 9, duration: '10'
			},
			{
				chord: 'G7', duration: 5
			},
			{
				chord: 'F', duration: 10
			}
		];
		
		try {
			new Diddle()
				.fill({ progression });
		} catch (err) {
			expect(err).to.exist();
			expect(err.details[0].message).to.equal('"progression[0].chord" must be one of [array]');
		}
	});

	it('follows a simple progression', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 62, duration: 2, delay: 0
 		    },
			{
				note: 65, duration: 2, delay: 0
		    },
			{
				note: 67, duration: 2, delay: 0
		    }
		];

		const notes = new Diddle()
			.fill({ progression, duration: 25, pattern: [0, 1] }).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('follows a simple progression (2 tracks)', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 62, duration: 2, delay: 0
 		    },
			{
				note: 65, duration: 2, delay: 0
		    },
			{
				note: 67, duration: 2, delay: 0
		    }
		];

		const notes = new Diddle()
			.fill({ progression, duration: 25, pattern: [0, 1] }).notes;

		const notes1 = new Diddle()
			.fill({ progression, duration: 25, pattern: [0, 1] }).notes;

		expect(notes).to.equal(expectedNotes);
		expect(notes1).to.equal(expectedNotes);
	});

	it('follows a simple progression (chromatic)', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 61, duration: 2, delay: 0
 		    },
			{
				note: 65, duration: 2, delay: 0
		    },
			{
				note: 66, duration: 2, delay: 0
		    }
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, 1], delta: 'chromatic' }).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('follows a simple progression (chord)', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 64, duration: 2, delay: 0
 		    },
			{
				note: 65, duration: 2, delay: 0
		    },
			{
				note: 69, duration: 2, delay: 0
		    }
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, 1], delta: 'chord' }).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('splits up really nested timing', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 62, duration: 1, delay: 0
 		    },
			{
				note: 64, duration: 1, delay: 0
 		    },
			{
				note: 65, duration: 2, delay: 0
		    },
			{
				note: 67, duration: 1, delay: 0
		    },
			{
				note: 69, duration: 1, delay: 0
		    },
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, [1, 2]] }).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('splits up really nested timing', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 62, duration: 1, delay: 0
 		    },
			{
				note: 64, duration: 0.5, delay: 0
			},
			{
				note: 65, duration: 0.5, delay: 0
 		    },
			{
				note: 65, duration: 2, delay: 0
		    },
			{
				note: 67, duration: 1, delay: 0
		    },
			{
				note: 69, duration: 0.5, delay: 0
		    },
			{
				note: 71, duration: 0.5, delay: 0
		    },
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, [1, [2, 3]]] }).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('handles simple delays', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 2
			},
			{
				note: 65, duration: 2, delay: 2
		    },
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: ['-', 0] }).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('handles delays at end of pattern', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 65, duration: 2, delay: 2
		    },
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, '-'] }).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('handles nested delays', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 2, delay: 0
			},
			{
				note: 62, duration: 1, delay: 0
		    },
			{
				note: 65, duration: 2, delay: 1
			},
			{
				note: 67, duration: 1, delay: 0
		    }
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, [1, '-']]}).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('holds notes', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 4, delay: 0
			},
			{
				note: 65, duration: 4, delay: 0
			},
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, '_']}).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('holds notes after nesting', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 1, delay: 0
			},
			{
				note: 62, duration: 1.5, delay: 0.5
			},
			{
				note: 60, duration: 1, delay: 0
			},
		];

		const pattern = [0, ['-', 1], '_', 0];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern}).notes;

		expect(notes).to.equal(expectedNotes);
	});

	it('fills duration with random notes if no pattern is given', () => {

		const progression = [
			{
			 	chord: ['M', 'C4'], duration: 4
			},
			{
				chord: ['M', 'F4'], duration: 4
			}
		];

		const expectedNotes = [
			{
			 	note: 60, duration: 4, delay: 0
			},
			{
				note: 65, duration: 4, delay: 0
			},
		];

		const notes = new Diddle({ progression })
			.fill({ duration: 25, pattern: [0, '_']}).notes;

		expect(notes).to.equal(expectedNotes);
	});
});