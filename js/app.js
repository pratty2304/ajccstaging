(() => {
const { CANCERS, calculate, editionOf } = window.Staging;

const home = document.getElementById("home");
const workspace = document.getElementById("workspace");
const grid = document.getElementById("grid");
const fieldsEl = document.getElementById("fields");
const resultEl = document.getElementById("result");
const cancerTitle = document.getElementById("cancer-title");
const cancerEdition = document.getElementById("cancer-edition");
const cancerSwatch = document.getElementById("cancer-swatch");
const editionBadge = document.getElementById("edition-badge");

let current = null;
let values = {};

function paintGrid() {
  grid.innerHTML = CANCERS.map((cancer) => `
    <button class="card" data-id="${cancer.id}">
      <div class="swatch" style="background:${cancer.color}"></div>
      <h2>${cancer.name}</h2>
      <p>${cancer.blurb}<br>${cancer.edition}</p>
    </button>
  `).join("");
}

function defaults(cancer) {
  const next = {};
  if (cancer.id === "stomach") next.basis = "pathologic";
  if (cancer.id === "oesophagus") {
    next.basis = "clinical";
    next.histo = "adeno";
  }
  if (cancer.id === "thyroid") next.type = "diff";
  if (cancer.id === "hn") next.site = "oral";
  return next;
}

function allowed(options) {
  return new Set(options.map((option) => option.value));
}

function sanitize() {
  const tSet = allowed(current.tOptions(values));
  const nSet = allowed(current.nOptions(values));
  const mSet = allowed(current.mOptions(values));
  if (values.t && !tSet.has(values.t)) values.t = "";
  if (values.n && !nSet.has(values.n)) values.n = "";
  if (values.m && !mSet.has(values.m)) values.m = "";
}

function openCancer(id) {
  current = CANCERS.find((item) => item.id === id);
  values = defaults(current);
  home.classList.add("is-hidden");
  home.hidden = true;
  workspace.classList.add("is-open");
  cancerTitle.textContent = current.name;
  cancerEdition.textContent = current.blurb;
  cancerSwatch.style.background = current.color;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderForm();
}

function fieldHtml(field) {
  if (field.type === "segment") {
    return `<div class="field">
      <label>${field.label}</label>
      <div class="segments" data-key="${field.key}">
        ${field.options.map((option) => `
          <button type="button" data-value="${option.value}" class="${values[field.key] === option.value ? "is-on" : ""}">${option.label}</button>
        `).join("")}
      </div>
    </div>`;
  }
  if (field.type === "number") {
    return `<div class="field">
      <label for="${field.key}">${field.label}</label>
      <input id="${field.key}" type="number" min="${field.min ?? 0}" max="${field.max ?? 120}" value="${values[field.key] ?? ""}" placeholder="Years">
    </div>`;
  }
  const options = [
    `<option value="">Select</option>`,
    ...field.options.map((option) =>
      `<option value="${option.value}" ${values[field.key] === option.value ? "selected" : ""}>${option.label}</option>`
    )
  ].join("");
  return `<div class="field">
    <label for="${field.key}">${field.label}</label>
    <select id="${field.key}">${options}</select>
  </div>`;
}

function renderForm() {
  sanitize();
  const extras = current.extras(values);
  const blocks = [
    ...extras.filter((field) => ["basis", "site", "histo", "type"].includes(field.key)),
    { key: "t", type: "select", label: "T — primary tumour", options: current.tOptions(values) },
    { key: "n", type: "select", label: "N — regional nodes", options: current.nOptions(values) },
    { key: "m", type: "select", label: "M — distant metastasis", options: current.mOptions(values) },
    ...extras.filter((field) => !["basis", "site", "histo", "type"].includes(field.key))
  ];
  fieldsEl.innerHTML = blocks.map(fieldHtml).join("");
  renderResult();
}

function renderResult() {
  const edition = editionOf(current, values);
  editionBadge.textContent = edition;
  const outcome = calculate(current, values);
  if (!outcome) {
    resultEl.innerHTML = `<p class="result-empty">Choose T, N, and M — and any extra detail this site needs. The stage group appears here.</p>
      <p class="disclaimer">Educational reference only. Not a substitute for the AJCC Cancer Staging System, a multidisciplinary tumour board, or clinical judgement.</p>`;
    return;
  }
  resultEl.innerHTML = `
    <p class="kicker" style="text-transform:none;letter-spacing:0;">Stage group</p>
    <div class="stage-mark">${outcome.stage}</div>
    <div class="tnm">${outcome.tnm}</div>
    <div class="chips">
      <span class="chip">${edition}</span>
      <span class="chip">${current.name}</span>
    </div>
    <div class="notes">
      <ul>${outcome.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
    </div>
    <p class="disclaimer">Educational reference only. Staging must be confirmed against the current AJCC protocol and the full clinical record.</p>
  `;
}

const rebuildKeys = new Set(["basis", "site", "histo", "type"]);

grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (card) openCancer(card.dataset.id);
});

document.getElementById("back").addEventListener("click", () => {
  workspace.classList.remove("is-open");
  home.classList.remove("is-hidden");
  home.hidden = false;
  current = null;
});

fieldsEl.addEventListener("change", (event) => {
  const el = event.target;
  if (!el.id) return;
  values[el.id] = el.value;
  if (rebuildKeys.has(el.id)) renderForm();
  else renderResult();
});

fieldsEl.addEventListener("input", (event) => {
  const el = event.target;
  if (el.type !== "number") return;
  values[el.id] = el.value;
  renderResult();
});

fieldsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".segments button");
  if (!button) return;
  const key = button.parentElement.dataset.key;
  values[key] = button.dataset.value;
  if (rebuildKeys.has(key)) renderForm();
  else {
    for (const item of button.parentElement.querySelectorAll("button")) {
      item.classList.toggle("is-on", item === button);
    }
    renderResult();
  }
});

paintGrid();
})();
