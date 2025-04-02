# @asmatzaile/pink-trombone

headless polyphonic port of [Neil Thapen's Pink Trombone](https://dood.al/pinktrombone/)

```sh
npm i @asmatzaile/pink-trombone
```

```js
import { PinkTrombone } from '@asmatzaile/pink-trombone';

document.addEventListener("pointerdown", () => {
  const audioContext = new window.AudioContext();
  const trombone = new PinkTrombone(audioContext);
  trombone.isVoiced = true;
}, { once: true })
```

Check [demo](/demo/) to see how it could be done.


## Api

Class `PinkTrombone`

### Constructors
```js
new PinkTrombone();
```

### Accessors
  - <code>isVoiced: <em>boolean</em></code>
    - whether the vocal cords are vibrating
  - <code>tenseness: <em>number</em></code>
    - Kind of the opposite of 'breathiness'.
    - Usual values: around `0.6`
    - `0` is very breathy
    - `1` is sharp and robotic
    - more than `1` does both
    - less than `0` breaks it
  - <code>frequency: <em>number</em></code>
    - frequency in Hertz
    - Usual values: between `90` and `330`
    - less than `50` is barely audible
    - more than `2000` is a screech and has audible artifacting
  - <code>pitch: <em>number</em></code>
    - pitch in midi. Equivalent to `frequency`
    - Usual values: between `41` (F2) and `64` (E4)
  - <code>vibrato: <em>number</em></code>
    - regular variation in pitch
    - Usual values: between `0` and `0.005`.
    - `0` is none.
    - `1` is "full" range
    - values close to `1` and greater start to break it
    - negative is the same as positive

### Methods
  - `dispose`: disconnect it from audio processing.

## Deprecated api
- `PinkTrombone.tract`
  - `.velumTarget`: back roof of the mouth; controls how nasal things sound
    - 0 is closed
    - 1 is very nasal
    - \>1 is even more nasal
    - negative is the same
  - `.diameter`: shape of the tract, represented by a 44-index array from throat to lips
    - standard range of each point is roughly 0-3, with the throat being smaller
    - the original UI modifies the tract shape with radial deformers to simulate a tongue
  - `.targetDiameter`: interpolation target for `Tract.diameter`; usually you want to set this instead of modifying `Tract.diamater` directly
  - `.restDiameter`: initial shape of the tract; useful for resetting
  - `.noseDiameter`: shape of the nose, represented by a 28-index array from velum to nostril
    - standard range is roughly 0-2, with edges being smaller
