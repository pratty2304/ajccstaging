(() => {
const opt = (value, label) => ({ value, label });

const starts = (value, prefix) => value === prefix || (value || "").startsWith(prefix);

function inSet(value, list) {
  return list.some((item) => {
    if (item.endsWith("*")) return starts(value, item.slice(0, -1));
    return value === item;
  });
}

function missing(...keys) {
  return keys.some((key) => !key);
}

const CANCERS = [
  {
    id: "breast",
    name: "Breast cancer",
    blurb: "Anatomic and clinical prognostic groups",
    color: "#ddd6fe",
    edition: "AJCC 8th Edition",
    extras() {
      return [
        { key: "grade", type: "select", label: "Grade", options: [
          opt("G1", "G1 — well differentiated"),
          opt("G2", "G2 — moderately differentiated"),
          opt("G3", "G3 — poorly differentiated")
        ]},
        { key: "er", type: "segment", label: "ER", options: [opt("pos", "Positive"), opt("neg", "Negative")] },
        { key: "pr", type: "segment", label: "PR", options: [opt("pos", "Positive"), opt("neg", "Negative")] },
        { key: "her2", type: "segment", label: "HER2", options: [opt("pos", "Positive"), opt("neg", "Negative")] }
      ];
    },
    tOptions: () => [
      opt("Tis", "Tis — DCIS or Paget without invasive tumour"),
      opt("T0", "T0 — no evidence of primary tumour"),
      opt("T1mi", "T1mi — ≤ 1 mm"),
      opt("T1a", "T1a — > 1 mm to 5 mm"),
      opt("T1b", "T1b — > 5 mm to 10 mm"),
      opt("T1c", "T1c — > 10 mm to 20 mm"),
      opt("T2", "T2 — > 20 mm to 50 mm"),
      opt("T3", "T3 — > 50 mm"),
      opt("T4a", "T4a — chest wall (not pectoral muscle alone)"),
      opt("T4b", "T4b — ulceration, satellite nodules, or peau d’orange"),
      opt("T4c", "T4c — both T4a and T4b"),
      opt("T4d", "T4d — inflammatory carcinoma")
    ],
    nOptions: () => [
      opt("N0", "N0 — no regional nodes"),
      opt("N1mi", "N1mi — micrometastases (> 0.2 mm to 2 mm)"),
      opt("N1", "N1 — movable ipsilateral level I/II axillary"),
      opt("N2", "N2 — fixed/matted axillary or internal mammary without axillary"),
      opt("N3", "N3 — infraclavicular, internal mammary with axillary, or supraclavicular")
    ],
    mOptions: () => [opt("M0", "M0 — no distant metastasis"), opt("M1", "M1 — distant metastasis")],
    stage(v) {
      if (missing(v.t, v.n, v.m)) return null;
      const anatomic = breastAnatomic(v.t, v.n, v.m);
      const prognostic = (v.grade && v.er && v.pr && v.her2)
        ? breastClinicalPrognostic(v)
        : null;
      return {
        stage: prognostic || anatomic,
        tnm: `${v.t} ${v.n} ${v.m}`,
        notes: [
          prognostic
            ? `Clinical prognostic stage ${prognostic} (grade, ER, PR, HER2 applied). Anatomic stage is ${anatomic}.`
            : `Anatomic stage ${anatomic}. Enter grade, ER, PR, and HER2 for AJCC 8th clinical prognostic grouping.`,
          "Pathological prognostic grouping after upfront surgery can differ from this clinical table.",
          "Oncotype DX Recurrence Score < 11 can downstage selected T1–2 N0 ER+ HER2− cancers; that genomic rule is not applied here."
        ]
      };
    }
  },
  {
    id: "colon",
    name: "Colon cancer",
    blurb: "Adenocarcinoma TNM grouping",
    color: "#c8ebd6",
    edition: "AJCC 8th Edition",
    extras: () => [],
    tOptions: colorectalT,
    nOptions: colorectalN,
    mOptions: colorectalM,
    stage(v) { return colorectalStage(v, "Colon"); }
  },
  {
    id: "rectal",
    name: "Rectal cancer",
    blurb: "Same TNM groups as colon",
    color: "#d9f2e4",
    edition: "AJCC 8th Edition",
    extras: () => [],
    tOptions: colorectalT,
    nOptions: colorectalN,
    mOptions: colorectalM,
    stage(v) {
      const result = colorectalStage(v, "Rectum");
      if (result) {
        result.notes.push("Distance from the anal verge, CRM, and EMVI guide treatment but do not change AJCC stage group.");
      }
      return result;
    }
  },
  {
    id: "stomach",
    name: "Stomach cancer",
    blurb: "Clinical or pathologic groups",
    color: "#f3e7b4",
    edition: "AJCC 8th Edition",
    extras: () => [
      { key: "basis", type: "segment", label: "Staging basis", options: [
        opt("pathologic", "Pathologic"), opt("clinical", "Clinical")
      ]}
    ],
    tOptions: () => [
      opt("Tis", "Tis — high-grade dysplasia / intramucosal"),
      opt("T1a", "T1a — lamina propria or muscularis mucosae"),
      opt("T1b", "T1b — submucosa"),
      opt("T2", "T2 — muscularis propria"),
      opt("T3", "T3 — subserosa"),
      opt("T4a", "T4a — serosa (visceral peritoneum)"),
      opt("T4b", "T4b — adjacent structures")
    ],
    nOptions: (v) => v.basis === "clinical" ? [
      opt("N0", "N0 — no regional nodes"),
      opt("N1", "N1 — metastasis in 1–2 regional nodes"),
      opt("N2", "N2 — 3–6 regional nodes"),
      opt("N3", "N3 — 7 or more regional nodes")
    ] : [
      opt("N0", "N0 — no regional nodes"),
      opt("N1", "N1 — 1–2 nodes"),
      opt("N2", "N2 — 3–6 nodes"),
      opt("N3a", "N3a — 7–15 nodes"),
      opt("N3b", "N3b — 16 or more nodes")
    ],
    mOptions: () => [opt("M0", "M0 — no distant metastasis"), opt("M1", "M1 — distant metastasis")],
    stage(v) {
      if (missing(v.t, v.n, v.m, v.basis)) return null;
      const stage = v.basis === "clinical" ? gastricClinical(v.t, v.n, v.m) : gastricPathologic(v.t, v.n, v.m);
      return {
        stage,
        tnm: `${v.t} ${v.n} ${v.m}`,
        notes: [
          `${v.basis === "clinical" ? "Clinical" : "Pathologic"} stage group.`,
          "GEJ tumours with epicentre ≤ 2 cm into the proximal stomach are staged as oesophageal / EGJ, not gastric."
        ]
      };
    }
  },
  {
    id: "hn",
    name: "Head and neck cancer",
    blurb: "Oral cavity, pharynx, larynx",
    color: "#cfe4ff",
    edition: "AJCC 8th · V9 for NPC & HPV+ OPC",
    editionFor(v) {
      if (v.site === "npc") return "AJCC Version 9 (2025)";
      if (v.site === "opc_pos") return "AJCC Version 9 (2026)";
      return "AJCC 8th Edition";
    },
    extras: (v) => [
      { key: "site", type: "select", label: "Primary site", options: [
        opt("oral", "Oral cavity"),
        opt("opc_pos", "Oropharynx, HPV-associated (p16+)"),
        opt("opc_neg", "Oropharynx, HPV-independent (p16−)"),
        opt("hypopharynx", "Hypopharynx"),
        opt("larynx", "Larynx"),
        opt("npc", "Nasopharynx")
      ]}
    ],
    tOptions: (v) => hnT(v.site),
    nOptions: (v) => hnN(v.site),
    mOptions: (v) => v.site === "npc" ? [
      opt("M0", "M0 — no distant metastasis"),
      opt("M1a", "M1a — ≤ 3 metastatic lesions in one or more organs/sites"),
      opt("M1b", "M1b — > 3 metastatic lesions in one or more organs/sites")
    ] : [opt("M0", "M0 — no distant metastasis"), opt("M1", "M1 — distant metastasis")],
    stage(v) {
      if (missing(v.site, v.t, v.n, v.m)) return null;
      const stage = hnStage(v.site, v.t, v.n, v.m);
      const notes = v.site === "opc_pos" ? [
        "AJCC Version 9 clinical grouping. Unequivocal imaging-detected or clinical ENE raises ipsilateral nodes to N2 and contralateral/bilateral nodes to N3.",
        "Pathologic staging after surgery uses a separate Version 9 table (pN1a/pN1b, pathologic ENE)."
      ] : v.site === "npc" ? [
        "AJCC Version 9 grouping. Stage IV is reserved for distant metastasis and split by lesion count.",
        "Advanced radiologic ENE (invasion of muscle, skin, or neurovascular structures) is N3."
      ] : [
        "HPV-independent mucosal sites share the AJCC 8th clinical stage groups.",
        "Pathologic N (ENE, node count) can differ after neck dissection."
      ];
      return { stage, tnm: `${v.t} ${v.n} ${v.m}`, notes };
    }
  },
  {
    id: "pancreas",
    name: "Pancreatic cancer",
    blurb: "Exocrine pancreas",
    color: "#f7dcc8",
    edition: "AJCC 8th Edition",
    extras: () => [],
    tOptions: () => [
      opt("Tis", "Tis — high-grade PanIN / intraductal / noninvasive IPMN or mucinous cystic"),
      opt("T1a", "T1a — ≤ 0.5 cm"),
      opt("T1b", "T1b — > 0.5 cm to 1 cm"),
      opt("T1c", "T1c — > 1 cm to 2 cm"),
      opt("T2", "T2 — > 2 cm to 4 cm"),
      opt("T3", "T3 — > 4 cm"),
      opt("T4", "T4 — involves coeliac axis, SMA, and/or common hepatic artery")
    ],
    nOptions: () => [
      opt("N0", "N0 — no regional nodes"),
      opt("N1", "N1 — 1–3 regional nodes"),
      opt("N2", "N2 — 4 or more regional nodes")
    ],
    mOptions: () => [opt("M0", "M0 — no distant metastasis"), opt("M1", "M1 — distant metastasis")],
    stage(v) {
      if (missing(v.t, v.n, v.m)) return null;
      let stage;
      if (v.m === "M1") stage = "IV";
      else if (v.t === "Tis" && v.n === "N0") stage = "0";
      else if (v.t === "T4" || v.n === "N2") stage = "III";
      else if (v.n === "N1") stage = "IIB";
      else if (starts(v.t, "T1")) stage = "IA";
      else if (v.t === "T2") stage = "IB";
      else if (v.t === "T3") stage = "IIA";
      else stage = "Cannot assign";
      return {
        stage,
        tnm: `${v.t} ${v.n} ${v.m}`,
        notes: ["Applies to exocrine pancreas. Pancreatic NETs use a separate AJCC Version 9 NET protocol."]
      };
    }
  },
  {
    id: "oesophagus",
    name: "Oesophageal cancer",
    blurb: "Oesophagus and EGJ",
    color: "#e6d7f7",
    edition: "AJCC 8th Edition",
    extras: (v) => {
      const fields = [
        { key: "basis", type: "segment", label: "Staging basis", options: [
          opt("clinical", "Clinical"), opt("pathologic", "Pathologic")
        ]},
        { key: "histo", type: "segment", label: "Histology", options: [
          opt("adeno", "Adenocarcinoma"), opt("scc", "Squamous")
        ]}
      ];
      if (v.basis === "pathologic") {
        fields.push({ key: "grade", type: "select", label: "Grade", options: [
          opt("G1", "G1"), opt("G2", "G2"), opt("G3", "G3")
        ]});
      }
      if (v.basis === "pathologic" && v.histo === "scc") {
        fields.push({ key: "location", type: "select", label: "Location", options: [
          opt("upper", "Upper or middle"),
          opt("lower", "Lower thoracic")
        ]});
      }
      return fields;
    },
    tOptions: () => [
      opt("Tis", "Tis — high-grade dysplasia"),
      opt("T1a", "T1a — lamina propria or muscularis mucosae"),
      opt("T1b", "T1b — submucosa"),
      opt("T2", "T2 — muscularis propria"),
      opt("T3", "T3 — adventitia"),
      opt("T4a", "T4a — pleura, pericardium, azygos vein, diaphragm, or peritoneum"),
      opt("T4b", "T4b — other adjacent structures (aorta, vertebral body, airway)")
    ],
    nOptions: () => [
      opt("N0", "N0 — no regional nodes"),
      opt("N1", "N1 — 1–2 regional nodes"),
      opt("N2", "N2 — 3–6 regional nodes"),
      opt("N3", "N3 — 7 or more regional nodes")
    ],
    mOptions: () => [opt("M0", "M0 — no distant metastasis"), opt("M1", "M1 — distant metastasis")],
    stage(v) {
      if (missing(v.t, v.n, v.m, v.basis, v.histo)) return null;
      if (v.basis === "pathologic" && !v.grade) return null;
      if (v.basis === "pathologic" && v.histo === "scc" && v.t === "T3" && v.n === "N0" && v.m === "M0" && v.grade !== "G1" && !v.location) return null;
      let stage;
      if (v.basis === "clinical") {
        stage = v.histo === "scc" ? oesophagusClinicalScc(v.t, v.n, v.m) : oesophagusClinicalAdeno(v.t, v.n, v.m);
      } else {
        stage = v.histo === "scc" ? oesophagusPathScc(v) : oesophagusPathAdeno(v);
      }
      return {
        stage,
        tnm: `${v.t} ${v.n} ${v.m}`,
        notes: [
          `${v.basis === "clinical" ? "Clinical" : "Pathologic"} grouping for ${v.histo === "scc" ? "squamous carcinoma" : "adenocarcinoma"}.`,
          "Tumours with epicentre within 2 cm of the EGJ and involving the oesophagus are staged as oesophageal."
        ]
      };
    }
  },
  {
    id: "lung",
    name: "Lung cancer",
    blurb: "Non-small cell and small cell",
    color: "#cde8f7",
    edition: "AJCC Version 9 (2025)",
    extras: () => [],
    tOptions: () => [
      opt("Tis", "Tis — carcinoma in situ / adenocarcinoma in situ ≤ 3 cm"),
      opt("T1mi", "T1mi — minimally invasive adenocarcinoma"),
      opt("T1a", "T1a — ≤ 1 cm"),
      opt("T1b", "T1b — > 1 to 2 cm"),
      opt("T1c", "T1c — > 2 to 3 cm"),
      opt("T2a", "T2a — > 3 to 4 cm, or visceral pleura / main bronchus / atelectasis"),
      opt("T2b", "T2b — > 4 to 5 cm"),
      opt("T3", "T3 — > 5 to 7 cm, chest wall, pericardium, phrenic nerve, or same-lobe nodule"),
      opt("T4", "T4 — > 7 cm, mediastinum, diaphragm, heart, great vessels, carina, or other ipsilateral lobe")
    ],
    nOptions: () => [
      opt("N0", "N0 — no regional nodes"),
      opt("N1", "N1 — ipsilateral peribronchial, hilar, or intrapulmonary"),
      opt("N2a", "N2a — single ipsilateral mediastinal / subcarinal station"),
      opt("N2b", "N2b — multiple ipsilateral mediastinal / subcarinal stations"),
      opt("N3", "N3 — contralateral mediastinal/hilar or scalene/supraclavicular")
    ],
    mOptions: () => [
      opt("M0", "M0 — no distant metastasis"),
      opt("M1a", "M1a — contralateral lung nodule, or pleural/pericardial nodules or effusion"),
      opt("M1b", "M1b — single extrathoracic metastasis in one organ system"),
      opt("M1c1", "M1c1 — multiple extrathoracic metastases in one organ system"),
      opt("M1c2", "M1c2 — multiple extrathoracic metastases in more than one organ system")
    ],
    stage(v) {
      if (missing(v.t, v.n, v.m)) return null;
      return {
        stage: lungV9(v.t, v.n, v.m),
        tnm: `${v.t} ${v.n} ${v.m}`,
        notes: [
          "T categories are unchanged from the 8th edition. Version 9 splits N2 and M1c and rearranges IIA–IIIB.",
          "For part-solid tumours, T is based on the invasive / solid component."
        ]
      };
    }
  },
  {
    id: "thyroid",
    name: "Thyroid cancer",
    blurb: "Differentiated, medullary, anaplastic",
    color: "#f7efc2",
    edition: "AJCC 8th Edition",
    extras: (v) => {
      const fields = [
        { key: "type", type: "select", label: "Histology", options: [
          opt("diff", "Differentiated (papillary, follicular, oncocytic)"),
          opt("medullary", "Medullary"),
          opt("anaplastic", "Anaplastic")
        ]}
      ];
      if (v.type === "diff") {
        fields.push({ key: "age", type: "number", label: "Age at diagnosis", min: 0, max: 120 });
      }
      return fields;
    },
    tOptions: () => [
      opt("T1a", "T1a — ≤ 1 cm, limited to thyroid"),
      opt("T1b", "T1b — > 1 to 2 cm, limited to thyroid"),
      opt("T2", "T2 — > 2 to 4 cm, limited to thyroid"),
      opt("T3a", "T3a — > 4 cm, limited to thyroid"),
      opt("T3b", "T3b — gross strap-muscle invasion"),
      opt("T4a", "T4a — subcutaneous, larynx, trachea, oesophagus, or recurrent laryngeal nerve"),
      opt("T4b", "T4b — prevertebral fascia, carotid, or mediastinal vessels")
    ],
    nOptions: () => [
      opt("N0", "N0 — no regional nodes"),
      opt("N1a", "N1a — level VI or VII (central)"),
      opt("N1b", "N1b — lateral neck or other regional nodes")
    ],
    mOptions: () => [opt("M0", "M0 — no distant metastasis"), opt("M1", "M1 — distant metastasis")],
    stage(v) {
      if (missing(v.type, v.t, v.n, v.m)) return null;
      if (v.type === "diff" && (v.age === "" || v.age == null)) return null;
      return {
        stage: thyroidStage(v),
        tnm: `${v.t} ${v.n} ${v.m}`,
        notes: [
          v.type === "diff"
            ? "Differentiated thyroid carcinoma is age-stratified at 55 years in AJCC 8th."
            : v.type === "anaplastic"
              ? "All anaplastic thyroid carcinomas are stage IV."
              : "Medullary carcinoma is not age-stratified."
        ]
      };
    }
  },
  {
    id: "rcc",
    name: "Renal cell carcinoma",
    blurb: "Kidney parenchyma",
    color: "#d7ebe3",
    edition: "AJCC 8th Edition",
    extras: () => [],
    tOptions: () => [
      opt("T1a", "T1a — ≤ 4 cm, limited to kidney"),
      opt("T1b", "T1b — > 4 to 7 cm, limited to kidney"),
      opt("T2a", "T2a — > 7 to 10 cm, limited to kidney"),
      opt("T2b", "T2b — > 10 cm, limited to kidney"),
      opt("T3a", "T3a — renal vein, pelvicalyceal system, or perirenal / renal sinus fat"),
      opt("T3b", "T3b — IVC below the diaphragm"),
      opt("T3c", "T3c — IVC above the diaphragm or invasion of the IVC wall"),
      opt("T4", "T4 — beyond Gerota fascia, including contiguous adrenal")
    ],
    nOptions: () => [
      opt("N0", "N0 — no regional nodes"),
      opt("N1", "N1 — regional node metastasis")
    ],
    mOptions: () => [opt("M0", "M0 — no distant metastasis"), opt("M1", "M1 — distant metastasis")],
    stage(v) {
      if (missing(v.t, v.n, v.m)) return null;
      let stage;
      if (v.m === "M1" || v.t === "T4") stage = "IV";
      else if (starts(v.t, "T3") || v.n === "N1") stage = "III";
      else if (starts(v.t, "T2")) stage = "II";
      else if (starts(v.t, "T1")) stage = "I";
      else stage = "Cannot assign";
      return {
        stage,
        tnm: `${v.t} ${v.n} ${v.m}`,
        notes: ["Urothelial carcinoma of the renal pelvis is staged with the upper tract urothelial system, not this RCC table."]
      };
    }
  }
];

function colorectalT() {
  return [
    opt("Tis", "Tis — intramucosal (lamina propria)"),
    opt("T1", "T1 — submucosa"),
    opt("T2", "T2 — muscularis propria"),
    opt("T3", "T3 — through muscularis propria into pericolorectal tissues"),
    opt("T4a", "T4a — through the visceral peritoneum, including perforation"),
    opt("T4b", "T4b — adjacent organs or structures")
  ];
}

function colorectalN() {
  return [
    opt("N0", "N0 — no regional nodes or tumour deposits"),
    opt("N1a", "N1a — 1 regional node"),
    opt("N1b", "N1b — 2–3 regional nodes"),
    opt("N1c", "N1c — tumour deposit(s) without regional node metastasis"),
    opt("N2a", "N2a — 4–6 regional nodes"),
    opt("N2b", "N2b — 7 or more regional nodes")
  ];
}

function colorectalM() {
  return [
    opt("M0", "M0 — no distant metastasis"),
    opt("M1a", "M1a — one distant organ/site, no peritoneum"),
    opt("M1b", "M1b — two or more distant organs/sites, no peritoneum"),
    opt("M1c", "M1c — peritoneal metastasis")
  ];
}

function colorectalStage(v) {
  if (missing(v.t, v.n, v.m)) return null;
  const { t, n, m } = v;
  let stage;
  if (m === "M1a") stage = "IVA";
  else if (m === "M1b") stage = "IVB";
  else if (m === "M1c") stage = "IVC";
  else if (t === "Tis" && n === "N0") stage = "0";
  else if (inSet(t, ["T1", "T2"]) && n === "N0") stage = "I";
  else if (t === "T3" && n === "N0") stage = "IIA";
  else if (t === "T4a" && n === "N0") stage = "IIB";
  else if (t === "T4b" && n === "N0") stage = "IIC";
  else if ((inSet(t, ["T1", "T2"]) && inSet(n, ["N1a", "N1b", "N1c"])) || (t === "T1" && n === "N2a")) stage = "IIIA";
  else if (
    (inSet(t, ["T3", "T4a"]) && inSet(n, ["N1a", "N1b", "N1c"])) ||
    (inSet(t, ["T2", "T3"]) && n === "N2a") ||
    (inSet(t, ["T1", "T2"]) && n === "N2b")
  ) stage = "IIIB";
  else if (
    (t === "T4a" && n === "N2a") ||
    (inSet(t, ["T3", "T4a"]) && n === "N2b") ||
    (t === "T4b" && n !== "N0")
  ) stage = "IIIC";
  else stage = "Cannot assign";
  return {
    stage,
    tnm: `${t} ${n} ${m}`,
    notes: ["AJCC 8th colorectal grouping. Appendiceal carcinoma has a separate Version 9 protocol."]
  };
}

function breastAnatomic(t, n, m) {
  if (m === "M1") return "IV";
  if (t === "Tis" && n === "N0") return "0";
  const t1 = t === "T0" || starts(t, "T1");
  if (t1 && n === "N0") return "IA";
  if (t1 && n === "N1mi") return "IB";
  if ((t1 && n === "N1") || (t === "T2" && n === "N0")) return "IIA";
  if ((t === "T2" && (n === "N1" || n === "N1mi")) || (t === "T3" && n === "N0")) return "IIB";
  if ((inSet(t, ["T0", "T1*", "T2"]) && n === "N2") || (t === "T3" && inSet(n, ["N1", "N1mi", "N2"]))) return "IIIA";
  if (starts(t, "T4") && inSet(n, ["N0", "N1", "N1mi", "N2"])) return "IIIB";
  if (n === "N3") return "IIIC";
  return "Cannot assign";
}

function hrPair(er, pr) {
  if (er === "pos" && pr === "pos") return "both";
  if (er === "pos" || pr === "pos") return "single";
  return "neg";
}

function breastBucket(t, n) {
  const t1 = starts(t, "T1");
  if ((t1 && n === "N0") || ((t === "T0" || t1) && n === "N1mi")) return "A";
  if (((t === "T0" || t1) && n === "N1") || (t === "T2" && n === "N0")) return "B";
  if ((t === "T2" && inSet(n, ["N1", "N1mi"])) || (t === "T3" && n === "N0")) return "C";
  if (
    ((t === "T0" || t1 || t === "T2") && n === "N2") ||
    (t === "T3" && inSet(n, ["N1", "N1mi", "N2"]))
  ) return "D";
  if ((starts(t, "T4") && n !== "N3") || n === "N3") return "E";
  return null;
}

function breastClinicalPrognostic(v) {
  if (v.m === "M1") return "IV";
  if (v.t === "Tis" && v.n === "N0") return "0";
  const g = v.grade;
  const her2 = v.her2 === "pos";
  const hr = hrPair(v.er, v.pr);
  const b = breastBucket(v.t, v.n);
  const g12 = g === "G1" || g === "G2";

  if (b === "A") {
    if (g12 && hr !== "neg") return "IA";
    if (g12 && her2 && hr === "neg") return "IA";
    if (g12 && !her2 && hr === "neg") return "IB";
    if (g === "G3" && her2) return "IA";
    if (g === "G3" && !her2 && hr === "both") return "IA";
    return "IB";
  }
  if (b === "B") {
    if (g12 && hr === "both") return "IB";
    if (g12 && hr === "single") return "IIA";
    if (g12 && her2 && hr === "neg") return "IIA";
    if (g === "G1" && !her2 && hr === "neg") return "IIA";
    if (g === "G2" && !her2 && hr === "neg") return "IIB";
    if (g === "G3" && her2 && hr === "both") return "IB";
    if (g === "G3" && her2) return "IIA";
    if (g === "G3" && !her2 && hr === "both") return "IIA";
    return "IIB";
  }
  if (b === "C") {
    if (g12 && her2 && hr === "both") return "IB";
    if (g12 && her2 && hr === "single") return "IIA";
    if (g12 && her2 && hr === "neg") return "IIB";
    if (g === "G1" && !her2 && hr !== "both") return "IIB";
    if (g === "G2" && !her2 && hr === "single") return "IIB";
    if (g === "G2" && !her2 && hr === "neg") return "IIIB";
    if (g12 && !her2 && hr === "both") return "IIA";
    if (g === "G3" && her2 && hr === "both") return "IB";
    if (g === "G3" && her2) return "IIB";
    if (g === "G3" && !her2 && hr === "both") return "IIB";
    if (g === "G3" && !her2 && hr === "single") return "IIIA";
    return "IIIB";
  }
  if (b === "D") {
    if (g === "G1" && hr === "both") return "IIA";
    if (g === "G1" && hr === "single") return "IIIA";
    if (g === "G1" && her2 && hr === "neg") return "IIIA";
    if (g === "G2" && her2 && hr === "both") return "IIA";
    if (g === "G2" && her2) return "IIIA";
    if (g === "G1" && !her2 && hr === "neg") return "IIIB";
    if (g === "G2" && !her2 && hr === "both") return "IIA";
    if (g === "G2" && !her2 && hr === "single") return "IIIA";
    if (g === "G2" && !her2 && hr === "neg") return "IIIB";
    if (g === "G3" && her2 && hr === "both") return "IIB";
    if (g === "G3" && her2) return "IIIA";
    if (g === "G3" && !her2 && hr === "both") return "IIIA";
    if (g === "G3" && !her2 && hr === "single") return "IIIB";
    return "IIIC";
  }
  if (b === "E") {
    if (g12 && hr === "both") return "IIIA";
    if (g12 && hr === "single") return "IIIB";
    if (g12 && her2 && hr === "neg") return "IIIB";
    if (g12 && !her2 && hr === "neg") return "IIIC";
    if (g === "G3" && her2) return "IIIB";
    if (g === "G3" && !her2 && hr === "both") return "IIIB";
    return "IIIC";
  }
  return breastAnatomic(v.t, v.n, v.m);
}

function gastricClinical(t, n, m) {
  if (m === "M1") return "IVB";
  if (t === "Tis" && n === "N0") return "0";
  if (inSet(t, ["T1*", "T2"]) && n === "N0") return "I";
  if (inSet(t, ["T1*", "T2"]) && n !== "N0") return "IIA";
  if (inSet(t, ["T3", "T4a"]) && n === "N0") return "IIB";
  if (inSet(t, ["T3", "T4a"]) && n !== "N0") return "III";
  if (t === "T4b") return "IVA";
  return "Cannot assign";
}

function gastricPathologic(t, n, m) {
  if (m === "M1") return "IV";
  if (t === "Tis" && n === "N0") return "0";
  const key = `${tBaseStomach(t)}|${n}`;
  const map = {
    "T1|N0": "IA",
    "T1|N1": "IB", "T2|N0": "IB",
    "T1|N2": "IIA", "T2|N1": "IIA", "T3|N0": "IIA",
    "T1|N3a": "IIB", "T2|N2": "IIB", "T3|N1": "IIB", "T4a|N0": "IIB",
    "T2|N3a": "IIIA", "T3|N2": "IIIA", "T4a|N1": "IIIA", "T4a|N2": "IIIA", "T4b|N0": "IIIA",
    "T1|N3b": "IIIB", "T2|N3b": "IIIB", "T3|N3a": "IIIB", "T4a|N3a": "IIIB", "T4b|N1": "IIIB", "T4b|N2": "IIIB",
    "T3|N3b": "IIIC", "T4a|N3b": "IIIC", "T4b|N3a": "IIIC", "T4b|N3b": "IIIC"
  };
  return map[key] || "Cannot assign";
}

function tBaseStomach(t) {
  if (starts(t, "T1")) return "T1";
  return t;
}

function hnT(site) {
  if (site === "opc_pos") return [
    opt("T0", "T0 — no primary identified (cervical nodes, p16+)"),
    opt("T1", "T1 — ≤ 2 cm"),
    opt("T2", "T2 — > 2 to 4 cm"),
    opt("T3", "T3 — > 4 cm, or extension to lingual surface of epiglottis"),
    opt("T4", "T4 — larynx, extrinsic tongue muscle, medial pterygoid, hard palate, mandible, or beyond")
  ];
  if (site === "npc") return [
    opt("Tis", "Tis — carcinoma in situ"),
    opt("T1", "T1 — nasopharynx, oropharynx, or nasal cavity without parapharyngeal involvement"),
    opt("T2", "T2 — parapharyngeal space and/or medial/lateral pterygoid or prevertebral muscles"),
    opt("T3", "T3 — bony structures of skull base, cervical vertebra, pterygoid, and/or paranasal sinuses"),
    opt("T4", "T4 — intracranial, cranial nerve, hypopharynx, orbit, parotid, or extensive soft tissue")
  ];
  if (site === "larynx") return [
    opt("Tis", "Tis — carcinoma in situ"),
    opt("T1", "T1 — limited to one larynx subsite, normal mobility"),
    opt("T2", "T2 — more than one subsite or adjacent region, or impaired mobility"),
    opt("T3", "T3 — limited to larynx with vocal cord fixation, or inner cortex of thyroid cartilage / pre-epiglottic space"),
    opt("T4a", "T4a — through thyroid cartilage or tissues beyond the larynx"),
    opt("T4b", "T4b — prevertebral space, mediastinum, or carotid encasement")
  ];
  if (site === "hypopharynx") return [
    opt("Tis", "Tis — carcinoma in situ"),
    opt("T1", "T1 — one subsite and/or ≤ 2 cm"),
    opt("T2", "T2 — more than one subsite or adjacent site, or > 2 to 4 cm, no hemilarynx fixation"),
    opt("T3", "T3 — > 4 cm, hemilarynx fixation, or extension to oesophageal mucosa"),
    opt("T4a", "T4a — thyroid/cricoid cartilage, hyoid, thyroid gland, oesophageal muscle, or central compartment soft tissue"),
    opt("T4b", "T4b — prevertebral fascia, carotid encasement, or mediastinal structures")
  ];
  if (site === "opc_neg") return [
    opt("Tis", "Tis — carcinoma in situ"),
    opt("T1", "T1 — ≤ 2 cm"),
    opt("T2", "T2 — > 2 to 4 cm"),
    opt("T3", "T3 — > 4 cm, or extension to lingual surface of epiglottis"),
    opt("T4a", "T4a — larynx, extrinsic tongue muscle, medial pterygoid, hard palate, or mandible"),
    opt("T4b", "T4b — lateral pterygoid, pterygoid plates, lateral nasopharynx, skull base, or carotid encasement")
  ];
  return [
    opt("Tis", "Tis — carcinoma in situ"),
    opt("T1", "T1 — ≤ 2 cm, depth of invasion (DOI) ≤ 5 mm"),
    opt("T2", "T2 — ≤ 2 cm with DOI > 5 mm, or > 2 to 4 cm with DOI ≤ 10 mm"),
    opt("T3", "T3 — > 2 to 4 cm with DOI > 10 mm, or > 4 cm with DOI ≤ 10 mm"),
    opt("T4a", "T4a — > 4 cm with DOI > 10 mm, or cortical bone, maxillary sinus, or facial skin"),
    opt("T4b", "T4b — masticator space, pterygoid plates, skull base, or internal carotid encasement")
  ];
}

function hnN(site) {
  if (site === "opc_pos") return [
    opt("N0", "N0 — no regional nodes"),
    opt("N1", "N1 — ipsilateral node(s), all ≤ 6 cm, without ENE"),
    opt("N2", "N2 — ipsilateral ≤ 6 cm with ENE, or contralateral/bilateral ≤ 6 cm without ENE"),
    opt("N3", "N3 — node(s) > 6 cm, or contralateral/bilateral ≤ 6 cm with ENE")
  ];
  if (site === "npc") return [
    opt("N0", "N0 — no regional nodes"),
    opt("N1", "N1 — unilateral cervical and/or retropharyngeal, ≤ 6 cm, above caudal cricoid, no advanced ENE"),
    opt("N2", "N2 — bilateral cervical, ≤ 6 cm, above caudal cricoid, no advanced ENE"),
    opt("N3", "N3 — > 6 cm, below caudal cricoid, or advanced ENE")
  ];
  return [
    opt("N0", "N0 — no regional nodes"),
    opt("N1", "N1 — single ipsilateral node ≤ 3 cm, ENE−"),
    opt("N2a", "N2a — single ipsilateral node > 3 to 6 cm, ENE−"),
    opt("N2b", "N2b — multiple ipsilateral nodes, all ≤ 6 cm, ENE−"),
    opt("N2c", "N2c — bilateral or contralateral nodes, all ≤ 6 cm, ENE−"),
    opt("N3a", "N3a — node > 6 cm, ENE−"),
    opt("N3b", "N3b — clinically overt extranodal extension")
  ];
}

function hnStage(site, t, n, m) {
  if (site === "npc") {
    if (m === "M1a") return "IVA";
    if (m === "M1b") return "IVB";
    if (t === "Tis") return n === "N0" ? "0" : "Cannot assign";
    if (t === "T4" || n === "N3") return "III";
    if (inSet(t, ["T1", "T2"]) && n === "N0") return "IA";
    if (inSet(t, ["T1", "T2"]) && n === "N1") return "IB";
    if ((inSet(t, ["T1", "T2"]) && n === "N2") || (t === "T3" && inSet(n, ["N0", "N1", "N2"]))) return "II";
    return "Cannot assign";
  }
  if (m === "M1") return site === "opc_pos" ? "IV" : "IVC";
  if (site === "opc_pos") {
    if (t === "T0" && n === "N0") return "Cannot assign";
    if (inSet(t, ["T0", "T1", "T2"]) && inSet(n, ["N0", "N1"])) return "I";
    if ((inSet(t, ["T0", "T1", "T2"]) && n === "N2") || (t === "T3" && inSet(n, ["N0", "N1", "N2"]))) return "II";
    if ((inSet(t, ["T0", "T1", "T2", "T3"]) && n === "N3") || t === "T4") return "III";
    return "Cannot assign";
  }
  if (t === "Tis" && n === "N0") return "0";
  if (t === "T1" && n === "N0") return "I";
  if (t === "T2" && n === "N0") return "II";
  if ((t === "T3" && n === "N0") || (inSet(t, ["T1", "T2", "T3"]) && n === "N1")) return "III";
  if ((t === "T4a" && inSet(n, ["N0", "N1"])) || (inSet(t, ["T1", "T2", "T3", "T4a"]) && inSet(n, ["N2a", "N2b", "N2c"]))) return "IVA";
  if (inSet(n, ["N3a", "N3b"]) || t === "T4b") return "IVB";
  return "Cannot assign";
}

function oesophagusClinicalScc(t, n, m) {
  if (m === "M1") return "IVB";
  if (t === "Tis") return n === "N0" ? "0" : "Cannot assign";
  if (starts(t, "T1") && inSet(n, ["N0", "N1"])) return "I";
  if ((t === "T2" && inSet(n, ["N0", "N1"])) || (t === "T3" && n === "N0")) return "II";
  if ((t === "T3" && n === "N1") || (inSet(t, ["T1*", "T2", "T3"]) && n === "N2")) return "III";
  if (starts(t, "T4") || n === "N3") return "IVA";
  return "Cannot assign";
}

function oesophagusClinicalAdeno(t, n, m) {
  if (m === "M1") return "IVB";
  if (t === "Tis") return n === "N0" ? "0" : "Cannot assign";
  if (n === "N3" || n === "N2" || t === "T4b") return "IVA";
  if (starts(t, "T1") && n === "N0") return "I";
  if (starts(t, "T1") && n === "N1") return "IIA";
  if (t === "T2" && n === "N0") return "IIB";
  if ((t === "T2" && n === "N1") || (inSet(t, ["T3", "T4a"]) && inSet(n, ["N0", "N1"]))) return "III";
  return "Cannot assign";
}

function oesophagusPathAdeno(v) {
  const { t, n, m, grade: g } = v;
  if (m === "M1") return "IVB";
  if (t === "Tis" && n === "N0") return "0";
  if (n === "N3" || t === "T4b" || (t === "T4a" && n === "N2")) return "IVA";
  if (t === "T1a" && n === "N0" && g === "G1") return "IA";
  if ((t === "T1a" && n === "N0" && g === "G2") || (t === "T1b" && n === "N0" && inSet(g, ["G1", "G2"]))) return "IB";
  if ((starts(t, "T1") && n === "N0" && g === "G3") || (t === "T2" && n === "N0" && inSet(g, ["G1", "G2"]))) return "IC";
  if (t === "T2" && n === "N0" && g === "G3") return "IIA";
  if ((starts(t, "T1") && n === "N1") || (t === "T3" && n === "N0")) return "IIB";
  if ((starts(t, "T1") && n === "N2") || (t === "T2" && n === "N1")) return "IIIA";
  if ((t === "T2" && n === "N2") || (t === "T3" && inSet(n, ["N1", "N2"])) || (t === "T4a" && inSet(n, ["N0", "N1"]))) return "IIIB";
  return "Cannot assign";
}

function oesophagusPathScc(v) {
  const { t, n, m, grade: g, location } = v;
  if (m === "M1") return "IVB";
  if (t === "Tis" && n === "N0") return "0";
  if (n === "N3" || t === "T4b" || (t === "T4a" && n === "N2")) return "IVA";
  if (t === "T1a" && n === "N0" && g === "G1") return "IA";
  if (starts(t, "T1") && n === "N0") return "IB";
  if (t === "T2" && n === "N0") return g === "G1" ? "IB" : "IIA";
  if (t === "T3" && n === "N0") {
    if (g === "G1" || location === "lower") return "IIA";
    return "IIB";
  }
  if (starts(t, "T1") && n === "N1") return "IIB";
  if ((starts(t, "T1") && n === "N2") || (t === "T2" && n === "N1")) return "IIIA";
  if ((t === "T2" && n === "N2") || (t === "T3" && inSet(n, ["N1", "N2"])) || (t === "T4a" && inSet(n, ["N0", "N1"]))) return "IIIB";
  return "Cannot assign";
}

function lungV9(t, n, m) {
  if (starts(m, "M1c")) return "IVB";
  if (m === "M1a" || m === "M1b") return "IVA";
  if (t === "Tis" && n === "N0") return "0";
  if (n === "N0") {
    if (t === "T1mi" || t === "T1a") return "IA1";
    if (t === "T1b") return "IA2";
    if (t === "T1c") return "IA3";
    if (t === "T2a") return "IB";
    if (t === "T2b") return "IIA";
    if (t === "T3") return "IIB";
    if (t === "T4") return "IIIA";
  }
  if (n === "N1") {
    if (starts(t, "T1")) return "IIA";
    if (starts(t, "T2")) return "IIB";
    if (t === "T3" || t === "T4") return "IIIA";
  }
  if (n === "N2a") {
    if (starts(t, "T1")) return "IIB";
    if (starts(t, "T2") || t === "T3") return "IIIA";
    if (t === "T4") return "IIIB";
  }
  if (n === "N2b") {
    if (starts(t, "T1")) return "IIIA";
    if (starts(t, "T2") || t === "T3" || t === "T4") return "IIIB";
  }
  if (n === "N3") {
    if (starts(t, "T1") || starts(t, "T2")) return "IIIB";
    if (t === "T3" || t === "T4") return "IIIC";
  }
  return "Cannot assign";
}

function thyroidStage(v) {
  const { type, t, n, m, age } = v;
  if (type === "anaplastic") {
    if (m === "M1") return "IVC";
    if (inSet(t, ["T1a", "T1b", "T2", "T3a"]) && n === "N0") return "IVA";
    return "IVB";
  }
  if (type === "medullary") {
    if (m === "M1") return "IVC";
    if (starts(t, "T1") && n === "N0") return "I";
    if (inSet(t, ["T2", "T3a", "T3b"]) && n === "N0") return "II";
    if (inSet(t, ["T1*", "T2", "T3a", "T3b"]) && n === "N1a") return "III";
    if (t === "T4b") return "IVB";
    if (n === "N1b" || t === "T4a") return "IVA";
    return "Cannot assign";
  }
  const years = Number(age);
  if (m === "M1") return years < 55 ? "II" : "IVB";
  if (years < 55) return "I";
  if (inSet(t, ["T1a", "T1b", "T2"]) && n === "N0") return "I";
  if ((inSet(t, ["T1a", "T1b", "T2"]) && starts(n, "N1")) || starts(t, "T3")) return "II";
  if (t === "T4a") return "III";
  if (t === "T4b") return "IVA";
  return "Cannot assign";
}

function calculate(cancer, values) {
  return cancer.stage(values);
}

function editionOf(cancer, values) {
  return cancer.editionFor ? cancer.editionFor(values) : cancer.edition;
}

const api = { CANCERS, calculate, editionOf };
if (typeof module === "object" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.Staging = api;
})();
