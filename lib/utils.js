import {promises as fs} from 'fs';

export const summPreds = (preds) => {
  const res = {};
  for(const p of Object.keys(preds)){
    res[p] = {};
    res[p].ratio        = preds[p].ratio;
    res[p].count        = preds[p].count;
    res[p].coverage     = preds[p].coverage;
    res[p].sampledWalks = preds[p].sampledWalks;
    let len = 0;
    const walks = {};
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



export const flattenObj = (obj, parentKey = null, res = {}) => {
    for (let key in obj) {
        const predName = parentKey ? parentKey + "." + key : key
        if (typeof (obj[key]) === "object" && !Array.isArray(obj[key])) {
            flattenObj(obj[key], predName, res)
        } else {
            res[predName] = obj[key]
        }
    }
    return res
};

export const flattenObjValues = obj => {
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


export const prettyMatrix = (data) => {
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

