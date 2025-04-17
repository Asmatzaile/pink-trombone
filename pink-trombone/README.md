# pink-trombone

Headless polyphonic port of [Neil Thapen's Pink Trombone](https://dood.al/pinktrombone/).

## Motivation

This is not the first JavaScript refactoring of Pink Trombone: some examples include [Zakaton's Pink-Trombone](https://github.com/zakaton/Pink-Trombone), [Christian d'Heureuse's pink-trombone-mod](https://github.com/chdh/pink-trombone-mod) and [Sean LeBlanc's pink-trombone](https://github.com/seleb/pink-trombone).

My main aim for this one has been to create a library with a nice API with normalized parameters so that it is easy to incorporate to other projects, and to be able to generate multiple trombones for polyphony.

I needed that for another project of mine, [Hiruaho](https://github.com/Asmatzaile/Hiruaho), a web experiment where your eyes turn into singing mouths!

## Installation

```sh
npm i pink-trombone
```

## Getting started

```js
import { PinkTrombone } from 'pink-trombone';

document.addEventListener("pointerdown", () => {
  const audioContext = new window.AudioContext();
  const trombone = new PinkTrombone(audioContext);
  trombone.isVoiced = true;
}, { once: true })
```

## API

> [!TIP]
> Check out the [live demo](https://asmatzaile.github.io/pink-trombone/) to get a feeling for all the methods, plus a visual explanation!

### Class `PinkTrombone`

#### Constructors

```js
new PinkTrombone(audioContext);
```

#### Accessors

  - <code>isVoiced: <em>boolean</em></code>
    - Whether the vocal cords are vibrating.
  - <code>tenseness: <em>number</em></code>
    - Kind of the opposite of 'breathiness'.
    - Usual values: around `0.6`.
    - `0` is very breathy.
    - `1` is sharp and robotic.
  - <code>frequency: <em>number</em></code>
    - Frequency in Hertz.
    - Usual values: between `90` and `330`.
  - <code>pitch: <em>number</em></code>
    - Pitch in MIDI. Equivalent to `frequency`.
    - Usual values: between `41` (F2) and `64` (E4).
  - <code>vibrato</code>
    - Regular variation in pitch.
    - <code>amount: <em>number</em></code>
      - Usual values: between `0` and `0.005`.
      - `0` is none.
      - `1` is "full" range.
    - <code>frequency: <em>number</em></code>
      - How fast the vibrato happens, in Hertz.
      - Usual values: around `6`.
  - <code>nasality</code>
    - How nasal it sounds.
    - Usual values: between `0` and `1`.
  - <code>vowel</code>
    - These have to do with how the position of the tongue shapes vowels.
    - <code>frontness: <em>number</em></code>
      - How close from the teeth is the part of the tongue that is raised.
      - Usual values: from `0` to `1`.
    - <code>openness: <em>number</em></code>
      - How far the tongue is from the roof of the mouth.
      - Usual values: from `0` to `1`.

#### Methods

  - `constrictions`
    - Take a look at the API for constrictions below.
    - `add`: add and return a new constriction.
    - `remove`: remove a constriction.
  - `dispose`: disconnect the trombone from audio processing and free resources up.

### Class `Constriction`

Constrictions are used to interrupt the flow of air and thus produce consonants.

#### Constructor

To generate a constriction, call `constrictions.add()` on a `PinkTrombone` instance.

#### Accessors

  - <code>location: <em>number</em></code>
    - Where in the tract the constriction is located.
    - `0` is the back of the tract.
    - `1` is the lips.
  - <code>strength: <em>number</em></code>
    - How close to completely blocking the air the constriction is.
    - `0` is not interfering at all.
    - `1` is completely blocking.
