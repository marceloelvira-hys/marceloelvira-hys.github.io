// ---------- La Tribuna: solapas (informe, SAP, estudios y matafuegos, capacitación, EPP, ante una inspección, descargas) ----------
// Base: portal MIT sin selector de planta (un solo local). PL queda fijo para reusar el código del informe.
// Lo común (textos editables, publicación por sección, descargas, subir constancia, proponer fecha, video) está en core/v1/modulos.js;
// acá van las opciones de este cliente (MOD) y lo propio. Una función con el mismo nombre que una del módulo la pisa.
Object.assign(MOD, {propHorario: "16:00 a 16:45, entre turnos", quien: "el local", sectorDe: "del local",
  capTitulo: "Capacitaciones propuestas para el local", capCuando: "Cuándo", capReg: true,
  capIntro: "Las capacitaciones previstas para el personal: se puede proponer la fecha y el horario de cada una. Abajo, las constancias firmadas; también se pueden subir desde acá.",
  esgPieNombre: true});
const TABS = [["informe", "Informe de visita"], ["sap", "Autoprotección"], ["hys", "Estudios y matafuegos"], ["cap", "Capacitación"], ["epp", "EPP"], ["insp", "Ante una inspección"], ["dl", "Descargas"]];
let TAB = "informe", PL = "P1";

// ---------- SAP ----------
function vSap(){
  const s = X().sap;
  return `<h2>Sistema de Autoprotección</h2><p class="x-intro">${E("ui.sap.intro", "En qué está el Sistema de Autoprotección del local ante Defensa Civil (Ley 5920/17), qué falta y quién lo hace.")}</p>
  <div class="sap-c"><div class="sap-h"><div><b>La Tribuna · ${esc(X().local.dom)}</b><span>Sistema de Autoprotección · ${esc(s.grupo)} · Ley 5920/17</span></div><span class="sap-ok pe">${esc(s.estado)}</span></div>
  <div class="sap-k">
    <div><span>Expediente</span><b style="font-size:14px">${esc(s.exp)}</b><em>caratulado el ${esc(s.caratulado)}</em></div>
    <div><span>Encuadre</span><b>${esc(s.grupo)}</b><em>con el subsuelo en uso</em></div>
    <div><span>Pendientes</span><b>${s.pend.length}</b><em>para presentar el SAP</em></div>
  </div>
  <div class="sap-l">${s.hitos.map((h, i) => `<div class="ok"><i></i><b>${fISO(h.f)}</b><span>${E("sap.hitos." + i + ".t")}</span></div>`).join("")}</div>
  <div class="g-sec">Lo que falta para presentar</div>
  <div class="x-box">${s.pend.map((p, i) => `<div class="x-row lt-pend"><span class="lt-n">${i + 1}</span><div><div class="x-t">${E("sap.pend." + i + ".t")}</div><div class="x-m">${E("sap.pend." + i + ".q")}</div></div><div>${p.k ? btnDl(p.k, "Planilla (Excel)") : ""}</div></div>`).join("")}</div>
  <p class="x-m" style="margin:12px 0">${E("sap.nota")}</p>
  <div class="x-dl x-dlrow">${s.archivos.map(k => btnDl(k)).join("")}</div></div>`;
}

// ---------- estudios y matafuegos ----------
function grupoInf(){
  return `<div class="g-box" style="--c:var(--brand)"><h3>Informes de visita</h3><span class="x-m">El último y los anteriores, en PDF</span>
  <div class="g-sel"><select id="sel-inf">${["9-26", "6-26"].map(k => `<option value="${k}">Informe ${k}</option>`).join("")}</select><button type="button" class="g-btn" data-dlsel="inf">Descargar</button></div></div>`;
}
function vHys(){
  const e = X().estudios, mf = X().matafuegos, tot = mf.reduce((a, m) => a + m.n, 0);
  return `<h2>Estudios de higiene y seguridad</h2><p class="x-intro">${E("ui.hys.intro", "Mediciones y estudios del local, con su estado al " + X().fecha + ".")}</p>
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="x-box" style="border-top:5px solid var(--brand)"><div class="x-row x-est h"><span>Estudio</span><span>Norma</span><span>Fecha</span><span>Vigencia</span><span>Estado</span><span>Documento</span></div>
  ${e.map((s, i) => { const [st, ve] = estEst(s); return `<div class="x-row x-est"><div><div class="x-t">${E("estudios." + i + ".estudio")}</div><div class="x-m">${E("estudios." + i + ".sit")}</div></div><div class="x-m">${E("estudios." + i + ".norma")}</div><div class="x-m">${E("estudios." + i + ".fecha")}</div><div class="x-m">${E("estudios." + i + ".vigencia")}</div><div><span class="x-e ${st.replace(" ", "-")}">${st === "EN CURSO" ? "EN PREPARACIÓN" : st === "PENDIENTE" ? "A REALIZAR" : st}</span>${ve ? `<div class="x-m">${ve}</div>` : ""}</div><div class="x-dl">${s.archivos.map(k => btnDl(k, k === "cf-plan" ? "Planillas" : "Descargar")).join("") || `<span class="x-m">—</span>`}</div></div>`; }).join("")}</div>
  <div class="g-sec">Matafuegos · ${tot} equipos</div>
  <div class="lt-mf">${mf.map((m, i) => `<div class="lt-mfc${/K/.test(m.tipo) ? " k" : ""}"><div class="lt-mfi"><svg viewBox="0 0 24 40" aria-hidden="true"><rect x="5" y="9" width="14" height="29" rx="5"/><rect x="9" y="3" width="6" height="7" rx="1"/><path d="M15 6h6v3" fill="none" stroke-width="2.4" stroke-linecap="round"/></svg><b>${m.n}</b></div><div><div class="x-t">${E("matafuegos." + i + ".tipo")}</div><div class="x-m"><b>${E("matafuegos." + i + ".lugar")}</b></div><div class="x-m">${E("matafuegos." + i + ".obs")}</div></div></div>`).join("")}</div>
  <div class="x-note"><span style="flex:1;min-width:240px">${E("mf_nota")}</span></div>`;
}

// ---------- descargas ----------
function vDl(){
  const x = X();
  const box = (t, c, ks) => ks.length ? `<div class="g-box" style="--c:${c}"><h3>${t}</h3><div class="g-list">${ks.map(([k, tx]) => `<div class="g-it"><span>${esc(tx || nomArch(k))}</span><button type="button" class="g-btn" data-dl="${k}">Descargar</button></div>`).join("")}</div></div>` : "";
  const est = x.estudios.flatMap((s, i) => s.archivos.map(k => [k, (k === "cf-plan" ? "Planillas · " : "") + T("estudios." + i + ".estudio") + " · " + s.fecha]));
  return `<h2>Descargas</h2><p class="x-intro">${E("ui.dl.intro", "Todo para bajar, agrupado por tipo.")}</p>
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="g-row">${box("Habilitación y Autoprotección", "var(--brand)", [["oblea"], ["plano-hab"], ["sap-car"], ["ddjj"], ["planos-ev"]])}${box("Estudios", "var(--celeste-dk)", est)}${box("Formularios para completar", "#2F7D4A", [["dotacion"], ["cons-sap"], ["epp299"]])}${box("Actas de inspección", "#6E1E2E", [["acta1"], ["acta2"]])}</div>`;
}
function renderExtra(){
  $("vExtra").innerHTML = pubCtl(TAB) + ({sap: vSap, hys: vHys, cap: vCap, epp: vEpp, insp: vInsp, dl: vDl})[TAB]();
  if (EDIT) $("vExtra").querySelectorAll("[data-ed]").forEach(e => e.contentEditable = "true");
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

// Estado de situación: cuadro del Sistema de Autoprotección (propio hasta el bloque 3 de módulos)
function esgSap(s, stl){
  return `<table class="esg-t"><thead><tr><th style="width:30%">Expediente</th><th style="width:18%">Estado</th><th>Lo que falta para presentar</th></tr></thead><tbody>
  <tr><td>${esc(s.exp)}<small>caratulado el ${esc(s.caratulado)} · ${esc(s.grupo)}</small></td><td>${stl(s.estado)}</td><td>${s.pend.map((p, i) => `${i + 1}. ${esc(T("sap.pend." + i + ".t"))} <small style="display:inline">(${esc(T("sap.pend." + i + ".q"))})</small>`).join("<br>")}</td></tr></tbody></table>`;
}

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {inicio: modInicio, estado: modEstado});
