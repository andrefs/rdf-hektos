import {promises as fs} from 'fs';

export const summProps = (props) => {
  const res = {};
  for(const p of Object.keys(props)){
    res[p] = {};
    res[p].ratio = props[p].ratio;
    res[p].count = props[p].count;
    res[p].sampledWalks = props[p].sampledWalks;
    let len = 0;
    const walks = {};
    for(const w of Object.values(props[p].walks)){
      len += w.nodes.length;
      walks[w.status] = walks[w.status] || 0;
      walks[w.status] ++;
    }
    res[p].walks = walks;

    const walksCount = Object.keys(props[p].walks).length;

    res[p].avgLen = walksCount ? len/walksCount : 0;
  }
  return res;
};



export const flattenObj = (obj, parentKey = null, res = {}) => {
    for (let key in obj) {
        const propName = parentKey ? parentKey + "." + key : key
        if (typeof (obj[key]) === "object" && !Array.isArray(obj[key])) {
            flattenObj(obj[key], propName, res)
        } else {
            res[propName] = obj[key]
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
  table.push(['Property', ...Object.keys(keys)]);
  for(const [prop,info] of Object.entries(data)){
    const row = [prop];
    for(const k of table[0].slice(1)){
      row.push(info[k] || '');
    }
    table.push(row);
  }


  return table.map(x => x.join('\t')).join('\n');
};

