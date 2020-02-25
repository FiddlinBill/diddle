You'll need:
1) Midi playback software. For playing the midi files you generate.
1.5) (optional) Download a custom soundfont for your midi playback device.
2) Nodejs - works on v10 - probably works on many other versions of node

Install Dependencies
```console
npm i
```

Render a midi file
```console
node example.js
```

Done!

Now you need to get midi playback working on your platform

Windows users
windows media player can play midi file out of the box. However, you might one day get bored of the default soundfont.
A simple program that allows you to customize the windows media player soundfont is called Virtual Midi Synth.

Linux users!
I recommend using fluidsynth and jackd as outlined in the excellent article.
http://tedfelix.com/linux/linux-midi.html

Here is a brief summary:


Install Fluidsynth
```console
sudo apt-get install fluidsynth
```
Optionally install a soundfont
```console
sudo apt-get install fluid-soundfont-gm
```

Optionally install a low latency kernel
```console
sudo apt-get install linux-lowlatency
```

Install jackd - a low latency audio server
```console
sudo apt-get install jackd2
```


Now to get everything up and running...

- Shut off any programs using audio

- suspend pulse audio - it can interfere with jackd. Note that audio in other applications might stop working.
```console
	echo "suspend 1" | pacmd
```

run jack daemon. Change the hw:1 to whatever device you want (ex: hw:2)
```console
	jackd -d alsa --device hw:1 --rate 44100 --period 128
```

run fluidsynth as a server
```console
	fluidsynth --server --audio-driver=jack --connect-jack-outputs
```

Alternatively run fluidsynth with a configuration file. This is helpful because it is tedious to manually set the instruments for each channel every time fluidsynth starts up.
```console
	fluidsynth --server --audio-driver=jack --connect-jack-outputs -f example.conf
```

See example.conf for an example of fluidsynth config

play a midi file (providing that fluidsynth is listening at the default port 128).
```console
	aplaymidi -p 128:0 song.mid
```

unsuspend pulse audio when you are finished
```console
	echo "suspend 0" | pacmd
```











Motifs
	- Progression based composition
		- All instruments adhere to a progression of notes

	- Reaction based composition
		- All other instruments react to whatever the lead instrument is doing

	- Hysteresis
		- current output depends on past events

	- Melody composition - 

	- Instrumentation
		- giving each instrument a pattern
	- Role based composition
		- each instrument has its own role to play

Variation - Mixing up a melody
Challenges
	- getting all tracks to line up in progression based composition

Imitating a midi controller - send events directly to syth
Generating midi events - save events in a midi file

MIDI Spec

Song position pointer
Continuous Controller