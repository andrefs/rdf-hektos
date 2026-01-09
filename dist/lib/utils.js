"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettyMatrix = exports.ppMatrix = exports.flattenObjValues = exports.flattenObj = exports.summMetrics = void 0;
const fs_1 = require("fs");
//export const summPreds = (preds: { [key: string]: Predicate }) => {
//  const res: { [key: string]: PredicateSummary } = {};
//  for (const p of Object.keys(preds)) {
//    const resP = {
//      ratio: preds[p].ratio,
//      count: preds[p].count,
//      subjCoverage: preds[p].subjCoverage,
//      objCoverage: preds[p].objCoverage,
//      sampledWalks: preds[p].sampledWalks,
//      branchingFactor: preds[p].branchingFactor,
//    }
//
//    let len = 0;
//    const walks: { [key: string]: number } = {};
//    for (const w of Object.values(preds[p]?.walks ?? [])) {
//      len += w.nodes.length;
//      for (const s of w.status) {
//        walks[s] = walks[s] || 0;
//        walks[s]++;
//      }
//    }
//
//    const walksCount = Object.keys(preds[p]?.walks ?? []).length;
//
//    const avgLen = walksCount ? len / walksCount : 0;
//    res[p] = { ...resP, walks, avgLen };
//  }
//  return res;
//};
const summMetrics = (preds, globalMetrics) => {
    var _a, _b;
    const res = {};
    for (const p of Object.keys(preds)) {
        res[p] = {};
        res[p].coverage =
            (((_a = preds[p].subjCoverage) !== null && _a !== void 0 ? _a : 0) + ((_b = preds[p].objCoverage) !== null && _b !== void 0 ? _b : 0)) /
                globalMetrics.totalSeeds;
        res[p].totalSeeds = globalMetrics.totalSeeds;
        res[p].subjCoverage = preds[p].subjCoverage;
        res[p].objCoverage = preds[p].objCoverage;
        res[p].branchingFactor =
            preds[p].branchingFactor.subj / preds[p].branchingFactor.obj;
        res[p].normBranchingFactor =
            res[p].branchingFactor < 1
                ? 1 / res[p].branchingFactor
                : res[p].branchingFactor;
    }
    return res;
};
exports.summMetrics = summMetrics;
const flattenObj = (obj, parentKey = null, res = {}) => {
    for (let key in obj) {
        const value = obj[key];
        const predName = parentKey ? parentKey + "." + key : key;
        if (typeof value === "number" ||
            typeof value === "string" ||
            Array.isArray(value)) {
            res[predName] = obj[key];
            continue;
        }
        (0, exports.flattenObj)(value, predName, res);
    }
    return res;
};
exports.flattenObj = flattenObj;
const flattenObjValues = (obj) => {
    return Object.keys(obj).reduce((previous, key) => {
        const value = obj[key];
        if (typeof value === "number" ||
            typeof value === "string" ||
            Array.isArray(value)) {
            previous[key] = value;
            return previous;
        }
        previous[key] = (0, exports.flattenObj)(value);
        return previous;
    }, {});
};
exports.flattenObjValues = flattenObjValues;
const ppMatrix = (data, outputFile) => __awaiter(void 0, void 0, void 0, function* () {
    const m = (0, exports.prettyMatrix)(data);
    if (outputFile) {
        console.warn(`Saving output to ${outputFile}`);
        yield fs_1.promises.writeFile(outputFile, m);
        return;
    }
    console.log(m);
});
exports.ppMatrix = ppMatrix;
const prettyMatrix = (data) => {
    const table = [];
    const keys = {};
    for (const x of Object.values(data)) {
        for (const k of Object.keys(x)) {
            keys[k] = true;
        }
    }
    table.push(["Predicate", ...Object.keys(keys)]);
    for (const [pred, info] of Object.entries(data)) {
        const row = [pred];
        for (const k of table[0].slice(1)) {
            row.push(info[k] || "");
        }
        table.push(row);
    }
    return table.map((x) => x.join("\t")).join("\n");
};
exports.prettyMatrix = prettyMatrix;
//# sourceMappingURL=utils.js.map