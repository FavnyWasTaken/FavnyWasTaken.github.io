const $ = (id) => document.getElementById(id);
const KEY = "startpage.v3";
const clone = (o) => JSON.parse(JSON.stringify(o));

let state;
try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; }
state = state || clone(window.CONFIG);
state.prompt = state.prompt ?? window.CONFIG.prompt;
state.hero = state.hero ?? { w: window.CONFIG.hero.w, custom: false };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kids);
  return el;
};

const db = new Promise((res) => {
  const r = indexedDB.open("startpage", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("img");
  r.onsuccess = () => res(r.result);
  r.onerror = () => res(null);
});
const tx = (mode, fn) => db.then((d) => new Promise((res, rej) => {
  if (!d) return rej(new Error("no db"));
  const t = d.transaction("img", mode);
  const r = fn(t.objectStore("img"));
  t.oncomplete = () => res(r.result);
  t.onerror = () => rej(t.error);
}));

let heroUrl = null;
async function loadHero() {
  const blob = state.hero.custom ? await tx("readonly", (s) => s.get("hero")).catch(() => null) : null;
  if (heroUrl) URL.revokeObjectURL(heroUrl);
  heroUrl = blob ? URL.createObjectURL(blob) : null;
  const el = document.querySelector(".hero");
  if (el) el.src = heroUrl || window.CONFIG.hero.src;
}

function applyTheme() {
  const r = document.documentElement.style;
  r.setProperty("--bg", state.theme.bg);
  r.setProperty("--text", state.theme.text);
  r.setProperty("--leaf", state.theme.leaf);
}

function renderPage() {
  document.title = state.title;
  const cols = h("div", { className: "cols" }, ...state.sections.map((s) => {
    const el = h("section", { className: "col" },
      h("h2", { textContent: s.title }),
      ...s.links.map((l) => h("a", { href: l.url, textContent: l.name })));
    el.style.setProperty("--c", s.color);
    return el;
  }));
  const search = h("input", {
    id: "q", type: "text", placeholder: "search duckduckgo", autocomplete: "off", spellcheck: false,
    onkeydown: (e) => {
      const v = e.target.value.trim();
      if (e.key === "Enter" && v) location.href = window.CONFIG.search + encodeURIComponent(v);
    },
  });
  const hero = h("img", { className: "hero", src: heroUrl || window.CONFIG.hero.src, alt: "", draggable: false });
  hero.style.width = state.hero.w + "px";
  hero.onerror = () => hero.remove();
  $("page").replaceChildren(hero, h("div", { className: "content" },
    h("div", { className: "prompt" },
      h("span", { textContent: ">" }),
      h("span", { textContent: state.prompt }),
      search),
    cols));
}

async function setHero(file) {
  try { await tx("readwrite", (s) => s.put(file, "hero")); } catch { return; }
  state.hero.custom = true;
  save();
  await loadHero();
  renderPage();
}

async function restoreHero() {
  await tx("readwrite", (s) => s.delete("hero")).catch(() => {});
  state.hero.custom = false;
  save();
  await loadHero();
  renderPage();
}

function buildPanel() {
  const refresh = () => { save(); renderPage(); };
  const retheme = () => { applyTheme(); save(); };
  const text = (obj, key, cb, props = {}) => h("input", {
    type: "text", value: obj[key], ...props,
    oninput: (e) => { obj[key] = e.target.value; cb(); },
  });
  const color = (obj, key, cb) => h("input", {
    type: "color", value: obj[key],
    oninput: (e) => { obj[key] = e.target.value; cb(); },
  });
  const row = (...kids) => h("div", { className: "row" }, ...kids);
  const label = (t) => h("span", { textContent: t });

  const sections = state.sections.map((s) => h("div", { className: "group" },
    row(text(s, "title", refresh), color(s, "color", refresh)),
    ...s.links.map((l, i) => row(
      text(l, "name", refresh, { placeholder: "name" }),
      text(l, "url", refresh, {
        placeholder: "url",
        onchange: (e) => {
          const v = e.target.value.trim();
          if (v && !/^[a-z][a-z0-9+.-]*:/i.test(v)) {
            l.url = e.target.value = "https://" + v;
            refresh();
          }
        },
      }),
      h("button", { textContent: "x", onclick: () => { s.links.splice(i, 1); refresh(); buildPanel(); } }),
    )),
    h("button", { textContent: "add link", onclick: () => { s.links.push({ name: "new", url: "https://" }); refresh(); buildPanel(); } }),
  ));

  $("panel").replaceChildren(
    h("h3", { textContent: "general" }),
    row(label("tab title"), text(state, "title", refresh)),
    row(label("prompt"), text(state, "prompt", refresh)),
    row(label("background"), color(state.theme, "bg", retheme)),
    row(label("text"), color(state.theme, "text", retheme)),
    row(label("leaves"), color(state.theme, "leaf", retheme)),
    h("h3", { textContent: "sections" }),
    ...sections,
    h("h3", { textContent: "illustration" }),
    row(label("size"), h("input", {
      type: "range", min: 150, max: 800, value: state.hero.w,
      oninput: (e) => {
        state.hero.w = +e.target.value;
        const el = document.querySelector(".hero");
        if (el) el.style.width = state.hero.w + "px";
        save();
      },
    })),
    row(h("input", {
      type: "file", accept: ".gif,.png,.jpg,.jpeg,.webp,image/gif,image/png,image/jpeg,image/webp",
      onchange: (e) => e.target.files[0] && setHero(e.target.files[0]),
    })),
    row(h("button", { textContent: "restore cat", onclick: restoreHero })),
    h("h3", { textContent: "reset" }),
    h("button", {
      textContent: "reset everything",
      onclick: async () => {
        if (!confirm("Reset all settings and the illustration?")) return;
        localStorage.removeItem(KEY);
        await tx("readwrite", (s) => s.clear()).catch(() => {});
        location.reload();
      },
    }),
  );
}

$("gear").onclick = () => {
  const panel = $("panel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) buildPanel();
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("panel").hidden = true; });

function drawLeaves() {
  const svg = $("leaves");
  const NS = "http://www.w3.org/2000/svg";
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < window.CONFIG.leaves; n++) {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform",
      `translate(${rnd() * 100}%, ${rnd() * 100}%) rotate(${rnd() * 360}) scale(${0.8 + rnd() * 2.2})`);
    const leaf = document.createElementNS(NS, "path");
    leaf.setAttribute("d", "M0,-40 C26,-22 26,22 0,44 C-26,22 -26,-22 0,-40 Z");
    const vein = document.createElementNS(NS, "path");
    vein.setAttribute("d", "M0,-34 L0,40 M0,-8 L12,-20 M0,8 L-12,-4 M0,22 L10,12");
    vein.setAttribute("class", "vein");
    g.append(leaf, vein);
    svg.append(g);
  }
}

applyTheme();
renderPage();
loadHero();
drawLeaves();
$("q")?.focus();
