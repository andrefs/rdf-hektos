import {promises as fs} from 'fs';
import {Predicate, Walk} from './GraphOperations.js';

interface PredicateSummary {
  ratio?: number,
  count?: number,
  coverage?: number,
  sampledWalks?: number,
  branchingFactor?: number,
  walks?: {[key:string]: number},
  avgLen?: number
};

export const summPreds = (preds: {[key:string]: Predicate}) => {
  const res : {[key: string]: PredicateSummary} = {};
  for(const p of Object.keys(preds)){
    res[p] = {};
    res[p].ratio           = preds[p].ratio;
    res[p].count           = preds[p].count;
    res[p].coverage        = preds[p].coverage;
    res[p].sampledWalks    = preds[p].sampledWalks;
    res[p].branchingFactor = preds[p].branchingFactor;

    let len = 0;
    const walks: {[key:string]: number} = {};
    for(const w of Object.values(preds[p].walks)){
      len += w.nodes.length;
      for(const s of w.status){
        walks[s] = walks[s] || 0;
        walks[s] ++;
      }
    }
    res[p].walks = walks;

    const walksCount = Object.keys(preds[p].walks).length;

    res[p].avgLen = walksCount ? len/walksCount : 0;
  }
  return res;
};



export const flattenObj = (obj: {[key:string]: NestedObject}, parentKey: (string |null)=null, res:{[key:string]: } = {}) => {
  for (let key in obj) {
    const predName = parentKey ? parentKey + "." + key : key;
    if (typeof (obj[key]) === "object" && !Array.isArray(obj[key])) {
        flattenObj(obj[key] as {[key:string]: object}, predName, res);
    } else {
        res[predName] = obj[key];
    }
  }
  return res
};

type NestedObject = (string|number|Array<NestedObject>|{[key:string]: NestedObject})

export const flattenObjValues = (obj: NestedObject) => {
  return Object.keys(obj)
                     .reduce((previous, key) => {
                       previous[key] = flattenObj(obj[key]);
                       return previous;
                     }, {});
};

export const ppMatrix = async (data, outputFile) => {
  const m = prettyMatrix(data);
  if(outputFile){
    console.warn(`Saving output to ${outputFile}`)
    await fs.writeFile(outputFile, m);
    return;
  }
  console.log(m);
};


export const prettyMatrix = (data): string => {
  const table = [];
  const keys = {};
  for(const x of Object.values(data)){
    for(const k of Object.keys(x)){
      keys[k] = true;
    }
  }
  table.push(['Predicate', ...Object.keys(keys)]);
  for(const [pred,info] of Object.entries(data)){
    const row = [pred];
    for(const k of table[0].slice(1)){
      row.push(info[k] || '');
    }
    table.push(row);
  }


  return table.map(x => x.join('\t')).join('\n');
};

