const fs = require('fs');
const Midi = require('jsmidgen');
const Hoek = require('@hapi/hoek');
const Joi = require('joi');
const { chord } = require('@tonaljs/tonal');
const file = new Midi.File();
const lib = require('./lib');
const getNotes = lib.getNotes;
const deconstruct = lib.deconstruct;
const r = lib.r;
const parsePattern = lib.parsePattern;
const beat = 128; // a beat is 128 ticks as per MIDI spec
const allNotes = [...Array(127).keys()]; // all possible midi notes
const midiNoteSchema = Joi.number().integer().min(0).max(126);
const progressionSchema = Joi.array().items({
    chord: [
        Joi.array().items(midiNoteSchema),
        Joi.array().items(Joi.string())
    ],
    duration: Joi.number(),
    vox: Joi.boolean()
});
const noteSchema = {
    duration: Joi.number(),
    resolution: Joi.number().min(1),
    note: midiNoteSchema,
    delay: Joi.number().min(0),
};

const fillOptionsSchema = Joi.object({
    tonic: midiNoteSchema,
    duration: Joi.number(),
    onVox: midiNoteSchema,
    resolution: Joi.number().min(1),
    delta: Joi.string().valid('absolute', 'chromatic', 'degree', 'chord'),
    notes: [
        Joi.array().items(midiNoteSchema),
        Joi.string().valid('all', 'chord', 'scale')
    ],
    pattern: Joi.array().items(
        Joi.string().valid('-', '_'),
        Joi.number().integer(),
        Joi.link('#pattern')
    ),                
    progression: progressionSchema
});

module.exports = class Diddle {

    // optionally pass a previous diddle to create a copy of the notes
    constructor (options={}) {

        const diddleOptionsSchema = Joi.object({
            notes: Joi.array().items(noteSchema),
            progression: progressionSchema,
        });
        const res = diddleOptionsSchema.validate(options);

        if (res.error) {
            throw res.error;
        }

        const track = new Midi.Track();
        this.progression = options.progression;
        file.addTrack(track);
        this.track = track;
        // an array of objects [{ note, duration, delay }...]
        this.notes = options.notes && options.notes.map(n => ({...n})) || [];
    }

    static write (filename) {

        fs.writeFileSync(filename, file.toBytes(), 'binary');
    }

    addNote (note, duration, delay, velocity) {

        this.notes.push({ note, duration, delay: delay || 0, velocity: velocity || 0 });
        return this;
    };


    addNotes (notes) {

        this.notes = this.notes.concat(notes);
        return this;
    };

    prepend (notes) {

        this.notes = notes.concat(this.notes);
        return this;
    };

    // functions cannot be chained after calling duration()
    duration () {
        
        return this.notes.reduce((a, b) => a + b.duration + (b.delay || 0), 0);
    }

    // creates ascending/descending runs with many options including modes and duration
    // defaults to chromatic if no mode is given
    run (start, end, options={}) {

        let delay = options.delay || 0; // initial delay
        const duration = options.duration;
        let resolution = options.resolution || beat;
        const tonic = options.tonic || start;
        const mode = options.mode;
        const descending = end < start;
        const res = [];
        let allowableNotes = mode && getNotes(tonic, mode).filter((n) => descending ? n <= start && n >= end : n >= start && n <= end);
        const length = mode && allowableNotes.length || Math.abs(end - start) + 1;

        if (duration) {
            resolution = Math.floor(duration / length);
        }

        if (duration && resolution*length !== duration) {
            console.warn('Run: Your duration is not divisible by the resolution. Adjusting resolution accordingly');
        }

        if (!mode) {    
            for (let i = start; descending ? i >= end : i <= end; descending ? i-- : i++) {

                res.push({ note: i, duration: resolution, delay });
                delay = 0;
            }
        }

        if (mode) { 
            for (let i = 0; i < allowableNotes.length; i++) {

                res.push({ note: allowableNotes[descending ? length - 1 - i : i], duration: resolution, delay });
                delay = 0;
            }
        }

        // add any remainder to the duration of the last note
        if (duration % resolution) {
            res[res.length - 1].duration = res[res.length - 1].duration + duration % resolution;
        }


        // if there are existing notes. add the run to them!
        this.notes = this.notes.concat(res);
        return this;
    }

    // repeat notes array x times
    repeat (x) {

        const notes = this.notes;
        let res = [];

        for (let i = 0; i < x; i++) {
            res = res.concat(this.notes.map(a => ({...a})));
        }

        this.notes = res;
        return this;
    }

    // repeat last x notes in array
    repeatLast (x) {

        const notes = this.notes;
        const repeated = notes.slice(this.notes.length - x);

        this.notes = notes.concat(repeated);
        return this;
    }

    // restructure an interval with random note lengths. The duration of the interval stays the same
    reform (options={}) {

        const resolution = options.resolution || beat;
        const duration = this.notes.reduce((a, b) => a + b.duration + b.delay, 0);
        const length = this.notes.length;
        const chunks = duration / resolution;
        const delay = options.delay;
        const randomDelay = delay === 'random';

        if (resolution * length > duration) {
            console.warn('Reform: Your resolution is not fine enough. You will lose information');
        }

        if (duration % resolution) {
            console.warn('Reform: Your duration is not divisible by the resolution.');
        }

        // x random integers that sum to y
        let newGroove = deconstruct(randomDelay ? length*2 : length, chunks);

        this.notes.forEach((n, i) => {

            n.duration = newGroove.pop() * resolution;
            
            if (randomDelay) {
                n.delay = newGroove.pop() * resolution;
            }

            // 0 duration notes with a delay are sometimes problematic
            // just switch the two values in this case
            if (!n.duration && n.delay) {
                n.duration = n.delay;
                n.delay = 0;
            }
        });

        // remove any 0 delay 0 duration notes that may have occurred due to information loss
        this.notes = this.notes.filter((n) => n.duration || n.delay);
        return this;
    }
 
    // fill an interval of a given length with given notes
    fill (options) {

        let {
            tonic = 60,
            mode = 'ionian',
            delta = 'degree',
            resolution = beat,
            minNotes = 1,
            duration = beat,
            notes = allNotes,
            onVox = 126, // volume of notes during vocal sections
            pattern = undefined,
            progression = this.progression
        } = options;

        const validation = fillOptionsSchema.validate(options);

        if (validation.error) {
            throw validation.error;
        }
        
        // random fill
        const chunks = duration / resolution;
        const maxNotes = chunks;
        const numberOfNotes = r(minNotes, maxNotes);

        const notesInKey = getNotes(tonic, mode);
        let newGroove = [];
        let delay = 0;

        // pattern = 'x(x_x)_x--x'
        // pattern = [{ note: 23, delta: -1 }, {}]
        // pattern = [-2, '_', ['-1, 1, 0], '-', '-']
        // delta: chromatic || degree (default) || chord
        // chromatic - deltas traverse chromatically from root chord, or tonic (if no progression is given)
        // degree - deltas traverse degrees of scale. Ex fill({ pattern: [-1, 0, 1], tonic: 'C4', mode: 'ionian' }) => B4, C4, D4 (degrees) OR B4, C4, C#4 (chromatic)
        // chord - deltas traverse degrees of chord. Ex fill({ pattern: [-1, 0, 1], progression: [{ chord: 'C', duration: 2*beat }] }) => G3, C4, E4
    
        // resolution does not make sense with pattern and duration
        // no pattern and no progression
        // diddle
        //     .fill({ duration: 4*beat })

        // pattern and no progression 
        // -> repeats pattern with random notes until duration is reached
        // -> assumes duration is 1 beat if not given

        // pattern and progression
        // -> fill duration of progression step with pattern

        // no pattern and progression
        // -> 

        // no pattern and no progression
    
        // takes a single step of a progression and converts it to notes
        const fill = (step) => {
            const duration = step.duration;
            const p = step.pattern || pattern;
            const res = duration / p.length;
            const chord = step.chord;
            const chordNotes = lib.getChordNotes(chord);
            const chordRoot = chordNotes[0];
            const allChordNotes = lib.getInstancesOf(chordNotes);

            for (let i = 0; i < p.length; i++) {

                if (Array.isArray(p[i])) {
                    const newStep = {
                        chord,
                        duration: res,
                        pattern: p[i]
                    } 
                    
                    fill(newStep);
                    continue;
                }

                // make the previous note longer
                if (p[i] === '_') {
                    newGroove[newGroove.length - 1].duration += res;
                    continue;
                }
                
                // add to delay of next note
                if (p[i] === '-') {
                    delay += res;
                    continue;
                }

                let note;

                if (delta === 'absolute') {
                    note = p[i];
                }

                if (delta === 'chromatic') {
                    note = chordRoot + p[i];
                }

                if (delta === 'chord') {
                    note = allChordNotes[allChordNotes.indexOf(chordRoot) + p[i]]
                }

                if (delta === 'degree') {
                    note = notesInKey[notesInKey.indexOf(chordRoot) + p[i]]
                }

                newGroove.push({
                    note,
                    duration: res,
                    delay,
                });

                delay = 0;
            }
        };

        if (progression) {
            for (let i = 0; i < progression.length; i++) {
                fill(progression[i]);
            }  
            
            this.notes = newGroove;
            return this;    
        }

        let randomIntegers = deconstruct(numberOfNotes, chunks);

        for (let i = 0; i < numberOfNotes; i++) {
        
            newGroove.push({
                note: notes[r(0, notes.length)],
                duration: randomIntegers.pop() * resolution
            });
        }

        this.notes = this.notes.concat(newGroove);

        // remove any 0 delay 0 duration notes that may have occurred due to information loss
        this.notes = this.notes.filter((n) => n.duration || n.delay);

        this.notes = newGroove;
        return this;
    }

    // adds an initial delay to the first note
    delay (delay) {

        this.notes[0].delay = delay;
        return this;
    }

    // transpose notes up or down
    transpose (steps) {

        this.notes = this.notes.map((n) => {

            n.note += steps;
            return n;
        });
        return this;
    }

    // shuffles notes of array
    jumble () {

        const notes = this.notes;
        for (let i = notes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [notes[i], notes[j]] = [notes[j], notes[i]];
        }

        this.notes = notes;
        return this;
    }

    // adds all notes to track
    render (channel) {

        this.notes.forEach((e) => this.track.addNote(channel, e.note, e.duration, e.delay, e.velocity));
        return this;
    }

    map (func) {

        this.notes.map(func);
        return this;
    }

    velocity (options) {

        const level = options.level;
        const min = options.min || 0;
        const max = options.max || 127;
        const random = options.random;

        if (!level && !random) {
            return;
        }

        this.notes.forEach((n) => n.velocity = level || r(min, max));
        return this;
    }

    // __444__555
    // ^  ^  ^  ^
    // _  4  _  5
    // 4  4  5  5 <--- does this kind of sampling
    sample (options = {}) {

        const resolution = options.resolution;
        const notes = options.notes || this.notes;
        let beats = 0;
        const sample = [];

        this.notes.forEach((n, i) => {

            beats += n.duration + n.delay;

            while (beats >= resolution) {

                const event = { ...n };
                event.duration = resolution;
                sample.push(event);

                if (i === 0) {
                    break;
                }
            
                beats -= resolution;
            };

        });

        this.notes = sample;

        return this;
    }

    harmonize (options = {}) {

        const mode = options.mode || 'ionian';
        const tonic = options.tonic || 60;
        const min = options.min || tonic - 24;
        const max = options.max || tonic + 24;
        const notes = options.notes || this.notes;
        const k = lib // all midi notes in key
            .getNotes(tonic, mode);

        const harmony = [];

        notes.forEach((n, i) => {

            const pre = Hoek.reach(notes[i - 1], 'note');
            const x = k.indexOf(n.note);
            let p = [k[x], k[x + 2], k[x + 3], k[x + 4], k[x + 5]]; // p stands for possible harmony notes
            p = lib.getInstancesOf(p, { min, max });

            // don't bother changing the harmony note if it's still in harmony
            if (pre && p.includes(pre)) {
                notes[i - 1].duration += n.duration;
                n.duration = 0;
                return;
            }

            n.note = p[r(0, p.length - 1)];
        });

        this.notes = notes.filter((n) => n.duration); // filter out 0 duration notes
        return this;
    }

    // sticky: holds notes as long as possible
    // lazy: finds the harmonization with the fewest changes
}

