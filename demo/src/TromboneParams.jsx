import { useCallback, useEffect, useState } from "react";

class BoolParam {
    getWidget(onUpdate) {
        return <input className="cursor-pointer" type="checkbox" checked={this.value} onChange={e => onUpdate(e.target.checked)} />
    }
}

class NumberParam {
    constructor(min, max, value) {
        this.min = min;
        this.max = max;
        this.value = value;
    }

    getWidget(onUpdate) {
        return <input className="cursor-pointer" type="range" min={this.min} max={this.max} step="any" value={this.value} onChange={e => onUpdate(e.target.valueAsNumber)} />
    }
}

const params = {
    isVoiced: new BoolParam(),
    voicedness: new NumberParam(0, 1),
    pitch: new NumberParam(41, 64),
    "vibrato.amount": new NumberParam(0, 1),
    "vibrato.frequency": new NumberParam(0, 10),
    nasality: new NumberParam(0, 1),
    "vowel.frontness": new NumberParam(0, 1),
    "vowel.openness": new NumberParam(0, 1),
}

class UIConstrictions {
    constructor(trombone, forceUpdate) {
        this.trombone = trombone;
        this.forceUpdate = forceUpdate;
    }

    getWidget() {
        const forceUpdate = this.forceUpdate;
        return <>
            <div className="flex justify-between items-center">
                <span className="font-mono bg-pink-200 px-1">constrictions</span>
                <button type="button" className="cursor-pointer text-2xl" onClick={() => {this.trombone.constrictions.add();forceUpdate()}}>+</button>
            </div>
            <ul className="flex flex-col gap-1">
            {[...this.trombone.constrictions].filter(constriction => !(constriction.isDestroyed)).map(constriction => {
                const locationParam = new NumberParam(0,1,constriction.location);
                const strengthParam = new NumberParam(0,1,constriction.strength);
                return <li className="flex justify-between ml-2">
                    <ul>
                        <li><span className="font-mono bg-pink-200 p-1">location</span> {locationParam.getWidget((newValue)=>{constriction.location=newValue;forceUpdate()})}</li>
                        <li><span className="font-mono bg-pink-200 p-1">strength</span> {strengthParam.getWidget((newValue)=>{constriction.strength=newValue;forceUpdate()})}</li>
                    </ul>
                    <button type="button" className="cursor-pointer text-2xl" onClick={() => {this.trombone.constrictions.remove(constriction);forceUpdate()}}>-</button>
                </li>
            })}
            </ul>
        </>
    }
    
}


const updateUIParams = (trombone) => Object.entries(params).forEach(([name, param]) => param.value = resolvePath(trombone, name));
const getNewTromboneParams = (trombone) => {updateUIParams(trombone); return {...params}}
export const TromboneParams = ({trombone}) => {
    const [uiParams, setUiParams] = useState(getNewTromboneParams(trombone));
    const [, updateState] = useState();
    const forceUpdate = useCallback(() => updateState({}), []);
    const [uiConstrictions, setUiConstrictions] = useState(new UIConstrictions(trombone, forceUpdate))
    useEffect(() => {
        setUiParams(getNewTromboneParams(trombone));
        setUiConstrictions(new UIConstrictions(trombone, forceUpdate));
    }, [trombone]);

    const updateParam = (param, value) => {
        setPath(trombone, param, value);
        setUiParams(p => {
            const n = {...p};
            n[param].value = value;
            return n;
        });
    };

    return <form className="grid grid-cols-2 gap-y-2 bg-pink-100 p-4 rounded-xl border-pink-300 border-2">
        {[...Object.entries(uiParams)].map(([name, object]) => <label className="col-span-full grid grid-cols-subgrid"key={name}>
            <div><span className="font-mono bg-pink-200 p-1">{name}</span></div>
            {object.getWidget(value => updateParam(name, value))}
            </label>)}
        <div className="col-span-full">
            {uiConstrictions.getWidget()}
        </div>
        <button type="button" className="cursor-pointer p-1  col-start-2 bg-pink-800 text-white rounded-sm" onClick={trombone.delete}>Delete</button>
    </form>
}

// From Adriano Spadoni at https://stackoverflow.com/a/43849204, CC BY-SA 4.0
const resolvePath = (object, path, defaultValue) => path
   .split('.')
   .reduce((o, p) => o ? o[p] : defaultValue, object)
// From Adriano Spadoni at https://stackoverflow.com/a/43849204, CC BY-SA 4.0. Modified by Gorka Egino.
const setPath = (object, path, value) => path
    .split('.')
    .reduce((o,p,i) => path.split('.').length === ++i ? o[p] = value : o[p] || {}, object)