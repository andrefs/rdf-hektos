const flattenObj = (obj, parentKey = null, res = {}) => {
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

export default flattenObj;
