import { describe, it, expect } from "vitest";
import GraphOperations from "../../lib/GraphOperations";
import { N, Q, Query, UNION, V, VALUES } from "../../lib/QueryBuilder.js";
import { setupTestGraph, engine, factory, pf } from "./test-data";

const n3 = setupTestGraph();

const graph = new GraphOperations({
  select: async (sparql) => {
    const res = await engine.queryBindings(sparql, { sources: [n3] });
    return res;
  },
  engine: engine,
  source: "source",
});

it("getPreds", async () => {
  const preds = await graph.getPreds();

  expect(Object.keys(preds)).toHaveLength(4);
  expect(preds).toHaveProperty([`${pf}/R1`, "count"], 4);
  expect(preds).toHaveProperty([`${pf}/R2`, "count"], 10);
  expect(preds).toHaveProperty([`${pf}/R3`, "count"], 1);
  expect(preds).toHaveProperty([`${pf}/R4`, "count"], 2);
});

describe("_randomWalk", () => {
  it("finds loop", async () => {
    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R1`),
      factory.namedNode(`${pf}/N1`),
      6,
    );

    expect(r).toHaveProperty("status", ["found_loop"]);
    expect(r.nodes).toHaveLength(5);
    expect(r.nodes[0]).toHaveProperty("value", `${pf}/N4`);
    expect(r.nodes[1]).toHaveProperty("value", `${pf}/N2`);
    expect(r.nodes[2]).toHaveProperty("value", `${pf}/N1`);
    expect(r.nodes[3]).toHaveProperty("value", `${pf}/N3`);
    expect(r.nodes[4]).toHaveProperty("value", `${pf}/N4`);
  });

  it("finishes early", async () => {
    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R4`),
      factory.namedNode(`${pf}/N3`),
      4,
    );

    expect(r).toHaveProperty("status", ["finished_early", "finished_early"]);
    expect(r.nodes).toHaveLength(3);
    expect(r.nodes[0]).toHaveProperty("value", `${pf}/N3`);
    expect(r.nodes[1]).toHaveProperty("value", `${pf}/N11`);
    expect(r.nodes[2]).toHaveProperty("value", `${pf}/N12`);
  });

  it("finds literal", async () => {
    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R3`),
      factory.namedNode(`${pf}/N7`),
      4,
    );

    expect(r).toHaveProperty("status", ["found_literal", "finished_early"]);
    expect(r.nodes).toHaveLength(2);
    expect(r.nodes[0]).toHaveProperty("value", `${pf}/N7`);
    expect(r.nodes[1]).toHaveProperty("value", "L1");
  });

  it("finishes", async () => {
    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R4`),
      factory.namedNode(`${pf}/N3`),
      2,
    );

    expect(r).toHaveProperty("status", ["finished"]);
    expect(r.nodes).toHaveLength(2);
    expect(r.nodes[0]).toHaveProperty("value", `${pf}/N3`);
    expect(r.nodes[1]).toHaveProperty("value", `${pf}/N11`);
  });
});

describe("_randomWalks", () => {
  it("returns walks", async () => {
    const r = await graph._randomWalks(
      factory.namedNode(`${pf}/R2`),
      [factory.namedNode(`${pf}/N8`), factory.namedNode(`${pf}/N9`)],
      3,
    );

    expect(r).toHaveProperty([`${pf}/N8`, "status"], ["finished"]);
    expect(r).toHaveProperty([`${pf}/N9`, "status"], ["finished"]);
    expect(r[`${pf}/N8`].nodes).toHaveLength(3);
    expect(r[`${pf}/N9`].nodes).toHaveLength(3);
    expect(r[`${pf}/N8`].nodes[0]).toHaveProperty("value", `${pf}/N5`);
    expect(r[`${pf}/N8`].nodes[1]).toHaveProperty("value", `${pf}/N8`);
    expect(r[`${pf}/N8`].nodes[2]).toHaveProperty("value", `${pf}/N13`);
    expect(r[`${pf}/N9`].nodes[0]).toHaveProperty("value", `${pf}/N6`);
    expect(r[`${pf}/N9`].nodes[1]).toHaveProperty("value", `${pf}/N9`);
    expect(r[`${pf}/N9`].nodes[2]).toHaveProperty("value", `${pf}/N14`);
  });
});

describe("_randSelectSubjects", () => {
  it("selects subjects", async () => {
    const r = await graph._randSelectSubjects(factory.namedNode(`${pf}/R4`), 3);

    const values = r.map((x) => x.value).sort();

    expect(r).toHaveLength(3);
    expect(values[0]).toBe(`${pf}/N11`);
    expect(values[1]).toBe(`${pf}/N12`);
    expect(values[2]).toBe(`${pf}/N3`);
  });
});

describe("calcInOutRatios", () => {
  it("calculates ratios", async () => {
    const preds = await graph.getPreds();
    const ratios = await graph.calcInOutRatios(preds);

    expect(Object.keys(ratios)).toHaveLength(3);
    expect(ratios[`${pf}/R2`]).toBe(0.8333333333333334);
    expect(ratios[`${pf}/R1`]).toBe(1);
    expect(ratios[`${pf}/R4`]).toBe(1);
  });
});

describe("calcRandomWalks", () => {
  it("calculates random walks", async () => {
    const preds = await graph.getPreds();
    const walks = await graph.calcRandomWalks(preds, 1, 6);

    const R1 = Object.values(walks[`${pf}/R1`][2])[0];
    expect(R1).toHaveProperty("status", ["found_loop"]);
    const vs = R1.nodes.map((n) => n.value);
    expect(R1.nodes).toHaveLength(5);
    expect(vs).toContain(`${pf}/N4`);
    expect(vs).toContain(`${pf}/N2`);
    expect(vs).toContain(`${pf}/N1`);
    expect(vs).toContain(`${pf}/N3`);

    const R2 = Object.values(walks[`${pf}/R2`][2])[0];
    expect(R2).toHaveProperty("status", ["finished_early", "finished_early"]);

    const R3 = Object.values(walks[`${pf}/R3`][2])[0];
    expect(R3).toHaveProperty("status", ["found_literal", "finished_early"]);

    const R4 = Object.values(walks[`${pf}/R4`][2])[0];
    expect(R4).toHaveProperty("status", ["finished_early", "finished_early"]);
  });
});

describe("calcSubjectCoverage", () => {
  it("calculates coverage", async () => {
    const subq = new Query()
      .distinct()
      .select("seed")
      .where(Q(V("seed"), N(`${pf}/R2`), V("o")));

    const cov = await graph.calcSubjectCoverage(subq);

    expect(cov).toStrictEqual({
      [`${pf}/R1`]: 1,
      [`${pf}/R2`]: 7,
    });
  });
});

describe("calcObjectCoverage", () => {
  it("calculates coverage", async () => {
    const subq = new Query()
      .distinct()
      .select("s")
      .where(Q(V("s"), N(`${pf}/R2`), V("o")));

    const cov = await graph.calcObjectCoverage(subq);

    expect(cov).toStrictEqual({
      [`${pf}/R1`]: 1,
      [`${pf}/R2`]: 10,
    });
  });
});

describe("calcBranchingFactor", () => {
  it("calculates branching factors", async () => {
    const preds = await graph.getPreds();
    const bfs = await graph.calcBranchingFactor(preds);
    expect(bfs).toMatchInlineSnapshot(`
      {
        "${pf}/R1": 1,
        "${pf}/R2": 1.4285714285714286,
        "${pf}/R3": 1,
        "${pf}/R4": 1,
      }
    `);
  });
});

describe("calcSeedPosRatio", () => {
  it("calculates seed position ratios", async () => {
    const preds = await graph.getPreds();
    const subq = new Query()
      .distinct()
      .select("seed")
      .where(VALUES([{ "?seed": N(`${pf}/N3`) }, { "?seed": N(`${pf}/N6`) }]));

    const seedPRs = await graph.calcSeedPosRatio(preds, subq);
    expect(seedPRs).toStrictEqual({
      [`${pf}/R1`]: 1,
      [`${pf}/R2`]: 2,
      [`${pf}/R3`]: NaN, // 0/0
      [`${pf}/R4`]: Infinity, // 1/0
    });
  });
});

describe("globalMetrics", () => {
  it("calculates global metrics", async () => {
    const subq = new Query()
      .select("s")
      .where(Q(V("s"), N(`${pf}/R2`), V("o")));

    const global = await graph.globalMetrics(subq);

    expect(global).toStrictEqual({
      totalNodes: 17, // N1-N16 + L1 = 17
      totalResources: 21, // N1-N16 + R1-R4 + L1 = 21
      totalSeeds: 10,
      totalSubjects: 12,
    });
  });
});
