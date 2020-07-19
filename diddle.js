const fs = require('fs');
const Midi = require('jsmidgen');
const Hoek = require('@hapi/hoek');
const file = new Midi.File();
const lib = require('./lib');
const getNotes = lib.getNotes;
const deconstruct = lib.deconstruct;
const r = lib.r;
const beat = 128; // a beat is 128 ticks as per MIDI spec

module.exports = class Diddle {

    // optionally pass a previous diddle to create a copy of the notes
    constructor (diddle) {

        const track = new Midi.Track();
        file.addTrack(track);
        this.track = track;
        // an array of objects [{ note, duration, delay }...]
        this.notes = diddle && diddle.notes.map(n => ({...n})) || [];
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
    fill (options={}) {

        const resolution = options.resolution || beat;
        const duration = options.duration || beat;
        const notes = options.notes;
        const chunks = duration / resolution;
        const minNotes = options.minNotes || 1; // the minimum number of notes
        const maxNotes = options.maxNotes || chunks; // the maximum number of notes
        const numberOfNotes = options.numberOfNotes || r(minNotes, maxNotes);
        let newGroove = [];

        if (resolution * numberOfNotes > duration) {
            console.warn('Reform: Your resolution is not fine enough. You will lose information');
        }

        if (duration % resolution) {
            console.warn('Reform: Your duration is not divisible by the resolution.');
        }

        // x random integers that sum to y
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

