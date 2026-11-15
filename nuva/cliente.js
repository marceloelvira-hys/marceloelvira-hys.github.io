// ---------- NUVA: solapas (informe, SAP, estudios y matafuegos, capacitación, EPP, máquinas, procedimientos, ante una inspección, descargas) ----------
// Base: portal MIT sin selector de planta (un solo local). PL queda fijo para reusar el código del informe.
// Lo común (textos editables, publicación por sección, descargas, subir constancia, proponer fecha, video) está en core/v1/modulos.js;
// acá van las opciones de este cliente (MOD) y lo propio. Una función con el mismo nombre que una del módulo la pisa.
Object.assign(MOD, {propHorario: "13:30 a 14:15, al cambio de turno", quien: "la empresa", delLugar: "de la planta",
  capTitulo: "Programa de capacitación 2026", capProg: ["prog", "Programa 2026 (PDF)"], capCuando: "Mes", capReg: false,
  capIntro: "Programa anual: se puede proponer la fecha y el horario de cada charla. Abajo, las constancias firmadas de las capacitaciones dadas; también se pueden subir desde acá.",
  esgAltas: ["Inmediata", "Alta"], esgAltasTxt: "Inmediata o alta",
  vistas: {maq: vMaq, proc: vProc},
  informes: [["9-26", "Informe 9-26"], ["inm", "Informe 9-26 · corrección inmediata"], ["3-26", "Informe 3-26"], ["1-26", "Informe 1-26"]],
  descargas: [{t: "Habilitación y Autoprotección", c: "var(--brand)", de: [["habil"], "@sap"]},
    {t: "Estudios", c: "var(--celeste-dk)", de: ["@estudios", "@mf"]},
    {t: "Capacitación", c: "#8A5A12", de: [["prog"], "@constancias"]},
    {t: "Procedimientos y AST", c: "#2F7D4A", de: ["@procs"]},
    {t: "Documentación ante la ART", c: "#6E1E2E", de: [["rgrl"], ["rar"], ["epp299"]]}]});
MOD.esgCol.APROBADO = "#2E7D32";
const TABS = [["informe", "Informe de visita"], ["sap", "Autoprotección"], ["hys", "Estudios y matafuegos"], ["cap", "Capacitación"], ["epp", "EPP"], ["maq", "Máquinas"], ["proc", "Procedimientos"], ["insp", "Ante una inspección"], ["dl", "Descargas"]];
let TAB = "informe", PL = "P1";

// ---------- máquinas animadas ----------
function vMaq(){
  return `<h2>Máquinas</h2><p class="x-intro">${E("ui.maq.intro", "Simuladores 3D de máquinas de la planta para capacitar al personal: se abren en el navegador (también en el celular) y se recorren solos o tocando cada parte. Al lado de cada una, su procedimiento de trabajo seguro.")}</p>
  <div class="lt-maqs">${X().maquinas.map((m, i) => `<div class="lt-maq"><div class="lt-maqi">⚙</div><div><b>${E("maquinas." + i + ".n")}</b><div class="x-m">${E("maquinas." + i + ".d")}</div>
    <div class="x-dl x-dlrow" style="margin-top:8px">${m.k.map(k => btnDl(k, /^3d/.test(k) ? "Ver en 3D" : "Abrir el simulador")).join("")}${m.pts.map(k => btnDl(k, nomArch(k).split(" ")[0] + " (PDF)")).join("")}</div></div></div>`).join("")}</div>`;
}

// ---------- procedimientos ----------
function vProc(){
  return `<h2>Procedimientos de trabajo seguro</h2><p class="x-intro">${E("ui.proc.intro", "Procedimientos y análisis de seguridad de las tareas (AST) de NUVA, para tener a mano en el puesto y en las capacitaciones.")}</p>
  <div class="x-box" style="border-top:5px solid var(--brand)">${X().procs.map((p, i) => `<div class="x-row x-cot" style="grid-template-columns:1fr 220px"><div class="x-t">${E("procs." + i + ".t")}</div><div>${btnDl(p.k, "Descargar (PDF)")}</div></div>`).join("")}</div>`;
}

document.addEventListener("click", e => {
  if (EDIT && e.target.closest("[data-ed]")) return;   // editando: el clic es para escribir
  const t = e.target.closest("[data-tab],[data-dl],[data-dlsel],[data-pub],[data-editar],[data-prop],[data-subir],[data-cdl],#ppEnv,#suEnv"); if (!t) return;
  if (t.dataset.pub){ const k = t.dataset.pub, on = !pubOn(k); PUB = PUB || {}; PUB[k] = on; enviar({tipo: "publicar", seccion: k, on}).then(r => toast(r.ok ? (on ? "Sección publicada" : "Sección sacada de la publicación") : "No se pudo guardar")); solapas(); if (!$("vExtra").hidden) renderExtra(); return; }
  if (t.dataset.editar){ EDIT = !EDIT; document.body.classList.toggle("editando", EDIT); barra(); irA(TAB); toast(EDIT ? "Tocá cualquier texto con borde punteado y escribí. Se guarda al salir del texto." : "Edición terminada"); return; }
  if (t.dataset.prop){ abrirProp(+t.dataset.prop); return; }
  if (t.dataset.subir){ abrirSubir(t.dataset.subir); return; }
  if (t.dataset.cdl !== undefined){ bajarSubida(t.dataset.cdl, t.dataset.cnom); return; }
  if (t.id === "ppEnv"){ enviarProp(+t.dataset.pi); return; }
  if (t.id === "suEnv"){ enviarSubir(t.dataset.modo); return; }
  if (t.dataset.dlsel){ bajarArch($("sel-" + t.dataset.dlsel).value); return; }
  if (t.dataset.tab) irA(t.dataset.tab);
  else if (t.dataset.dl) bajarArch(t.dataset.dl);
});

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {inicio: modInicio, estado: modEstado, prios: ["inmediata", "alta", "media"],
  prioTxt: n => ` · corrección inmediata ${n("inmediata")}, prioridad alta ${n("alta")} y media ${n("media")}`});
