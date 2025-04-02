import { useEffect, useState } from "react";

class BoolParam {
    getWidget(onUpdate) {
        return <input className="cursor-pointer" type="checkbox" checked={this.value} onChange={e => onUpdate(e.target.checked)} />
    }
}

class NumberParam {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    getWidget(onUpdate) {
        return <input className="cursor-pointer" type="range" min={this.min} max={this.max} step="any" value={this.value} onChange={e => onUpdate(e.target.valueAsNumber)} />
    }
}

const params = {
    isVoiced: new BoolParam(),
    tenseness: new NumberParam(0, 1),
    pitch: new NumberParam(41, 64),
    vibrato: new NumberParam(0, 1),
}


const updateUIParams = (trombone) => Object.entries(params).forEach(([name, param]) => param.value = trombone[name]);
const getNewTromboneParams = (trombone) => {updateUIParams(trombone); return {...params}}
export const TromboneParams = ({trombone}) => {
    const [uiParams, setUiParams] = useState(getNewTromboneParams(trombone));
    useEffect(() => setUiParams(getNewTromboneParams(trombone)), [trombone])

    const updateParam = (param, value) => {
        trombone[param] = value;
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
        <button type="button" className="cursor-pointer p-1  col-start-2 bg-pink-800 text-white rounded-sm" onClick={trombone.delete}>Delete</button>
    </form>
}