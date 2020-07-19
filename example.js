const Diddle = require('./diddle.js');

const beat = 128; // a beat is 128 ticks
const t = 60; // t for tonic
const b = t; // bass tonic

// intro
const introSynth = new Diddle()
	.run(t, t + 12, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat/2 })
	.jumble()
	.repeat(4)
	// .velocity({ random: true, min: 60, max:100 })
	.render(3);

const introSynth1 = new Diddle()
	.run(t + 12, t + 24, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat, delay: 'random' })
	.jumble()
	.repeat(4)
	.velocity({ random: true, min: 60, max:100 })
	.delay(beat/2)
	.render(3);

const introSynth2 = new Diddle()
	.run(t + 36, t, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat })
	.jumble()
	.repeat(4)
	// .velocity({ random: true, min: 60, max:100 })
	.render(3);

// part A
const synthA = new Diddle()
	.run(t, t + 12, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat/4, delay: 'random' })
	.jumble()
	.repeat(4)
	.notes;

const bassA = new Diddle()
	.run(b, b + 12, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat/2, delay: 'random' })
	.jumble()
	.repeat(4)
	.notes;

const drumsA = new Diddle()
	.addNote(36, beat)
	.addNote(27, beat)
	.addNote(40, beat)
	.addNote(36, beat)
	.reform({ resolution: beat/16, delay: 'random' })
	.jumble()
	.repeat(4)
	.notes;

// part b
const synthB = new Diddle()
	.run(t - 12, t + 12, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat/4, delay: 'random' })
	.jumble()
	.repeat(4)
	.notes;

const bassB = new Diddle()
	.run(b, b + 12, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat/2, delay: 'random' })
	.jumble()
	.repeat(4)
	.notes;

const drumsB = new Diddle()
	.addNote(36, beat)
	.addNote(27, beat)
	.addNote(40, beat)
	.addNote(78, beat)
	.reform({ resolution: beat/8, delay: 'random' })
	.jumble()
	.repeat(4)
	.notes;

// body: structure AABB * 3
const bodySynth = new Diddle()
	.addNotes(synthA)
	.addNotes(synthB)
	.repeat(3)
	.delay(introSynth.duration())
	.render(3);

const bodyBass = new Diddle()
	.addNotes(bassA)
	.addNotes(bassB)
	.repeat(3)
	.delay(introSynth.duration())
	.render(1);

const bodyDrums = new Diddle()
	.addNotes(drumsA)
	.addNotes(drumsB)
	.repeat(3)
	.delay(introSynth.duration())
	.render(5);

// outro
const outroSynth = new Diddle()
	.run(t, t + 12, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat })
	.jumble()
	.repeat(4)
	.delay(bodySynth.duration())
	.render(3);

const outroSynth1 = new Diddle()
	.run(t + 12, t + 24, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat, delay: 'random' })
	.jumble()
	.repeat(4)
	.delay(bodySynth.duration() + beat/2)
	.velocity({ random: true, min: 60, max:100 })
	.render(3);

const outroSynth2 = new Diddle()
	.run(t + 36, t, { duration: 4*beat, tonic: t, mode: 'ionian'})
	.reform({ resolution: beat/2 })
	.jumble()
	.repeat(4)
	// .velocity({ random: true, min: 60, max:100 })
	.delay(bodySynth.duration())
	.render(3);

Diddle.write('tune.mid');
