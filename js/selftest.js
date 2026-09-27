const { CANCERS, calculate } = require("./staging.js");

function find(id) {
  return CANCERS.find((item) => item.id === id);
}

function expect(label, actual, wanted) {
  if (actual !== wanted) {
    console.error(`FAIL ${label}: got ${actual}, expected ${wanted}`);
    process.exitCode = 1;
  } else {
    console.log(`ok  ${label}`);
  }
}

function stage(id, values) {
  return calculate(find(id), values).stage;
}

expect("breast T2N0M0 anatomic", stage("breast", { t: "T2", n: "N0", m: "M0" }), "IIA");
expect("breast T1c N0 M0 G2 ER+ PR+ HER2−", stage("breast", {
  t: "T1c", n: "N0", m: "M0", grade: "G2", er: "pos", pr: "pos", her2: "neg"
}), "IA");
expect("colon T3N0M0", stage("colon", { t: "T3", n: "N0", m: "M0" }), "IIA");
expect("colon T4b N1a M0", stage("colon", { t: "T4b", n: "N1a", m: "M0" }), "IIIC");
expect("colon M1c", stage("colon", { t: "T3", n: "N0", m: "M1c" }), "IVC");
expect("pancreas T2 N0", stage("pancreas", { t: "T2", n: "N0", m: "M0" }), "IB");
expect("pancreas T1c N2", stage("pancreas", { t: "T1c", n: "N2", m: "M0" }), "III");
expect("lung T1c N1 V9", stage("lung", { t: "T1c", n: "N1", m: "M0" }), "IIA");
expect("lung T1b N2a V9", stage("lung", { t: "T1b", n: "N2a", m: "M0" }), "IIB");
expect("lung T2a N2b V9", stage("lung", { t: "T2a", n: "N2b", m: "M0" }), "IIIB");
expect("lung M1c1", stage("lung", { t: "T2a", n: "N0", m: "M1c1" }), "IVB");
expect("rcc T3a N0", stage("rcc", { t: "T3a", n: "N0", m: "M0" }), "III");
expect("thyroid young M0", stage("thyroid", { type: "diff", age: "40", t: "T3a", n: "N1b", m: "M0" }), "I");
expect("thyroid older T4a", stage("thyroid", { type: "diff", age: "60", t: "T4a", n: "N0", m: "M0" }), "III");
expect("stomach pT2 N0", stage("stomach", { basis: "pathologic", t: "T2", n: "N0", m: "M0" }), "IB");
expect("stomach cT3 N1", stage("stomach", { basis: "clinical", t: "T3", n: "N1", m: "M0" }), "III");
expect("oesophagus cT3 N0", stage("oesophagus", { basis: "clinical", histo: "scc", t: "T3", n: "N0", m: "M0" }), "II");
expect("hn oral T2 N0", stage("hn", { site: "oral", t: "T2", n: "N0", m: "M0" }), "II");
expect("hn HPV+ T2 N1", stage("hn", { site: "opc_pos", t: "T2", n: "N1", m: "M0" }), "I");
expect("hn HPV+ T3 N3", stage("hn", { site: "opc_pos", t: "T3", n: "N3", m: "M0" }), "III");
expect("hn HPV+ M1", stage("hn", { site: "opc_pos", t: "T1", n: "N0", m: "M1" }), "IV");
expect("hn oral T4a N1", stage("hn", { site: "oral", t: "T4a", n: "N1", m: "M0" }), "IVA");
expect("hn larynx T4b N0", stage("hn", { site: "larynx", t: "T4b", n: "N0", m: "M0" }), "IVB");
expect("hn larynx M1", stage("hn", { site: "larynx", t: "T2", n: "N0", m: "M1" }), "IVC");

expect("npc V9 T2 N0", stage("hn", { site: "npc", t: "T2", n: "N0", m: "M0" }), "IA");
expect("npc V9 T1 N1", stage("hn", { site: "npc", t: "T1", n: "N1", m: "M0" }), "IB");
expect("npc V9 T2 N2", stage("hn", { site: "npc", t: "T2", n: "N2", m: "M0" }), "II");
expect("npc V9 T3 N1", stage("hn", { site: "npc", t: "T3", n: "N1", m: "M0" }), "II");
expect("npc V9 T4 N0", stage("hn", { site: "npc", t: "T4", n: "N0", m: "M0" }), "III");
expect("npc V9 T1 N3", stage("hn", { site: "npc", t: "T1", n: "N3", m: "M0" }), "III");
expect("npc V9 M1a", stage("hn", { site: "npc", t: "T1", n: "N0", m: "M1a" }), "IVA");
expect("npc V9 M1b", stage("hn", { site: "npc", t: "T4", n: "N3", m: "M1b" }), "IVB");

expect("lung T3 N2a V9", stage("lung", { t: "T3", n: "N2a", m: "M0" }), "IIIA");
expect("lung T4 N2a V9", stage("lung", { t: "T4", n: "N2a", m: "M0" }), "IIIB");
expect("lung T2b N0 V9", stage("lung", { t: "T2b", n: "N0", m: "M0" }), "IIA");

const oe = (extra) => stage("oesophagus", { m: "M0", ...extra });
expect("oes cAdeno T1 N1", oe({ basis: "clinical", histo: "adeno", t: "T1b", n: "N1" }), "IIA");
expect("oes cAdeno T2 N0", oe({ basis: "clinical", histo: "adeno", t: "T2", n: "N0" }), "IIB");
expect("oes cAdeno T3 N1", oe({ basis: "clinical", histo: "adeno", t: "T3", n: "N1" }), "III");
expect("oes cAdeno T2 N2", oe({ basis: "clinical", histo: "adeno", t: "T2", n: "N2" }), "IVA");
expect("oes cScc T2 N1", oe({ basis: "clinical", histo: "scc", t: "T2", n: "N1" }), "II");
expect("oes pScc T2 N0 G1", oe({ basis: "pathologic", histo: "scc", grade: "G1", t: "T2", n: "N0" }), "IB");
expect("oes pScc T2 N0 G3", oe({ basis: "pathologic", histo: "scc", grade: "G3", t: "T2", n: "N0" }), "IIA");
expect("oes pScc T3 N0 G2 upper", oe({ basis: "pathologic", histo: "scc", grade: "G2", location: "upper", t: "T3", n: "N0" }), "IIB");
expect("oes pScc T3 N0 G2 lower", oe({ basis: "pathologic", histo: "scc", grade: "G2", location: "lower", t: "T3", n: "N0" }), "IIA");
expect("oes pScc T3 N0 G1 no location", oe({ basis: "pathologic", histo: "scc", grade: "G1", t: "T3", n: "N0" }), "IIA");
expect("oes pScc T3 N1", oe({ basis: "pathologic", histo: "scc", grade: "G2", t: "T3", n: "N1" }), "IIIB");
expect("oes pScc T4a N0", oe({ basis: "pathologic", histo: "scc", grade: "G2", t: "T4a", n: "N0" }), "IIIB");
expect("oes pAdeno T2 N0 G3", oe({ basis: "pathologic", histo: "adeno", grade: "G3", t: "T2", n: "N0" }), "IIA");

expect("breast T3 N1 G3 ER+PR− HER2−", stage("breast", {
  t: "T3", n: "N1", m: "M0", grade: "G3", er: "pos", pr: "neg", her2: "neg"
}), "IIIB");
expect("breast T4b N0 G1 triple neg", stage("breast", {
  t: "T4b", n: "N0", m: "M0", grade: "G1", er: "neg", pr: "neg", her2: "neg"
}), "IIIC");
expect("colon T1 N2a", stage("colon", { t: "T1", n: "N2a", m: "M0" }), "IIIA");
expect("colon T3 N2b", stage("colon", { t: "T3", n: "N2b", m: "M0" }), "IIIC");
expect("stomach pT4b N3a", stage("stomach", { basis: "pathologic", t: "T4b", n: "N3a", m: "M0" }), "IIIC");
expect("stomach cT4b N0", stage("stomach", { basis: "clinical", t: "T4b", n: "N0", m: "M0" }), "IVA");
expect("thyroid medullary T2 N1b", stage("thyroid", { type: "medullary", t: "T2", n: "N1b", m: "M0" }), "IVA");
expect("thyroid anaplastic T2 N1a", stage("thyroid", { type: "anaplastic", t: "T2", n: "N1a", m: "M0" }), "IVB");
expect("thyroid ≥55 M1", stage("thyroid", { type: "diff", age: "70", t: "T1a", n: "N0", m: "M1" }), "IVB");
expect("rcc T2b N1", stage("rcc", { t: "T2b", n: "N1", m: "M0" }), "III");
expect("pancreas T3 N1", stage("pancreas", { t: "T3", n: "N1", m: "M0" }), "IIB");

if (!process.exitCode) console.log("all checks passed");
