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
  trombone.glottis.isTouched = true;
}, { once: true })
```

Check [demo](/demo/) to see how it could be done.

## notes

- `alwaysVoice` and `autoWobble` from the original are disabled, and not exposed
  - `alwaysVoice` is not needed, since you can set `Glottis.isTouched = true` and never turn it off to get the same behaviour
  - `autoWobble` is relatively simple to reproduce: it's just noise applied to the vibrato

## Api

Class `PinkTrombone`

### Constructors
```js
new PinkTrombone();
```

### Accessors
  - <code>frequency: <em>number</em></code>
    - frequency in Hertz
    - Usual values: between `90` and `330`
    - less than `50` is barely audible
    - more than `2000` is a screech and has audible artifacting
  - <code>pitch: <em>number</em></code>
    - pitch in midi. Equivalent to `frequency`
    - Usual values: between `41` (F2) and `64` (E4)


### Methods
  - `dispose`: disconnect it from audio processing.


## Deprecated api
- `new PinkTrombone`: create a new one
- `PinkTrombone.glottis`
  - `.isTouched`: whether it's producing sound
    - just `true` or `false`
  - `.UIFrequency`: frequency in Hertz
    - Usual values: 90-330
    - <50 is barely audible
    - \>2000 is a screech and has audible artifacting
  - `.UITenseness`: breathiness
    - Usual value: around 0.5
    - 0 is more breathy
    - 1 is sharp and a bit robotic
    - \>1 kinda does both
    - negative breaks it
  - `.vibratoAmount`:
      - Usual values: 0-0.1
      - 0 is none
      - 1 is "full" range
      - \>1 is broken cheeping
      - negative is the same
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
