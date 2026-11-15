// ---------- La Tribuna: solapas (informe, SAP, estudios y matafuegos, capacitación, EPP, ante una inspección, descargas) ----------
// Base: portal MIT sin selector de planta (un solo local). PL queda fijo para reusar el código del informe.
// Lo común (textos editables, publicación por sección, descargas, subir constancia, proponer fecha, video) está en core/v1/modulos.js;
// acá van las opciones de este cliente (MOD) y lo propio. Una función con el mismo nombre que una del módulo la pisa.
Object.assign(MOD, {propHorario: "16:00 a 16:45, entre turnos"});
const TABS = [["informe", "Informe de visita"], ["sap", "Autoprotección"], ["hys", "Estudios y matafuegos"], ["cap", "Capacitación"], ["epp", "EPP"], ["insp", "Ante una inspección"], ["dl", "Descargas"]];
const INSST = {PORTAL: "Está en el portal", LOCAL: "Lo guarda el local", FALTA: "Falta", TRAMITE: "En trámite"};
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

// ---------- capacitación ----------
function vCap(){
  const c = X().cap, props = i => PROPS.filter(p => p.tema === T("cap.prog." + i + ".tema"));
  const prog = `<div class="x-box"><div class="x-bh">${E("ui.cap.prog", "Capacitaciones propuestas para el local")}</div>
    <div class="x-row x-cap h"><span>Cuándo</span><span>Tema</span><span>Destinado a</span><span>Fecha a coordinar</span></div>
    ${c.prog.map((p, i) => `<div class="x-row x-cap"><b>${E("cap.prog." + i + ".mes")}</b><span>${E("cap.prog." + i + ".tema")}</span><span class="x-m">${E("cap.prog." + i + ".para")}</span>
      <div>${props(i).map(q => `<div class="prop"><b>${esc(q.fechas)}${q.horario ? " · " + esc(q.horario) : ""}</b><span>propuso ${esc(q.quien)} el ${esc(q.cargada)}${q.estado && q.estado !== "Propuesta" ? " · " + esc(q.estado) : ""}</span></div>`).join("")}
      <button type="button" class="x-btn" data-prop="${i}">📅 Proponer fecha y horario</button></div></div>`).join("")}</div>`;
  const subidas = CONST_UP.filter(x => !x.doc && !/^Ante una inspección/.test(x.cap)).map(x => ({t: x.cap + (x.fecha ? " · " + x.fecha : ""), btn: `<button type="button" class="x-btn" data-cdl="${esc(x.id)}" data-cnom="${esc(x.nombre)}">↓ ${esc(x.nombre)}</button>`, sub: `Subida por ${x.quien} el ${x.subida}`}));
  const lista = c.constancias.map(x => ({t: x.t, btn: btnDl(x.k, "Constancia (PDF)"), sub: "Cargada por el Lic. Marcelo Elvira"})).concat(subidas);
  const cons = `<div class="g-sec">Constancias de capacitación</div>
  <div class="x-box">${lista.length ? lista.map(x => `<div class="x-row x-cot" style="grid-template-columns:1fr 280px"><div><div class="x-t">${esc(x.t)}</div><div class="x-m">${esc(x.sub)}</div></div><div>${x.btn}</div></div>`).join("") : `<div class="x-row x-m">Todavía no hay constancias cargadas.</div>`}
  <div class="x-row" style="background:var(--crema)"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="x-btn p" data-subir="cap">⬆ Subir una constancia de capacitación</button><span class="x-m">PDF o foto de la planilla firmada. Le llega al Lic. Marcelo Elvira y queda acá.</span></div></div></div>`;
  const reg = `<div class="x-note"><span style="flex:1;min-width:240px">${E("ui.cap.reg", "Planilla de asistencia de la capacitación del Sistema de Autoprotección, para completar el día de la charla: rol, horario, nombre y apellido, DNI y firma.")}</span>${btnDl("cons-sap", "Constancia SAP para completar (PDF)")}</div>`;
  return `<h2>Capacitación</h2><p class="x-intro">${E("ui.cap.intro", "Las capacitaciones previstas para el personal: se puede proponer la fecha y el horario de cada una. Abajo, las constancias firmadas; también se pueden subir desde acá.")}</p>${prog}${cons}${reg}`;
}

// ---------- EPP ----------
function vEpp(){
  const ss = X().sect, es = X().epp;
  return `<h2>Elementos de protección personal</h2><p class="x-intro">${E("ui.epp.intro", "Dónde hay que usar cada elemento, por sector del local.")}</p>
  <div class="x-box"><div class="x-bh">La Tribuna<span>elemento por sector</span></div><div class="x-mxw"><table class="x-mx"><tr><th style="width:28%">Elemento</th>${ss.map(x => `<th>${esc(x)}</th>`).join("")}</tr>
  ${es.map((e, i) => `<tr><td><b>${E("epp." + i + ".elem")}</b><div class="x-m">${E("epp." + i + ".det")}</div></td>${ss.map((_, j) => e.s.includes(j) ? `<td><span class="x-dot" title="Se usa"></span></td>` : `<td class="x-no">—</td>`).join("")}</tr>`).join("")}</table></div></div>
  <div class="x-cards">${es.map((e, i) => `<div class="x-card"><b>${E("epp." + i + ".elem")}</b><span class="x-m">${E("epp." + i + ".cuando")}</span></div>`).join("")}</div>
  <div class="x-note"><span style="flex:1;min-width:240px">${E("epp_nota")}</span>${btnDl("epp299", "Constancia de entrega de EPP (Excel)")}</div>`;
}

// ---------- ante una inspección ----------
function vInsp(){
  const gs = X().insp, todos = gs.flatMap(g => g.items), cnt = k => todos.filter(d => d.estado === k).length;
  const sub = doc => CONST_UP.filter(x => x.cap === "Ante una inspección · " + doc);
  const item = (g, gi, d, i) => { const p = `insp.${gi}.items.${i}`, ups = sub(d.doc);
    return `<div class="x-row lt-ins"><div><div class="x-t">${E(p + ".doc")}</div><div class="x-m">${E(p + ".sit")}</div>
      ${ups.length ? `<div class="lt-ups">${ups.map(x => `<button type="button" class="x-btn" data-cdl="${esc(x.id)}" data-cnom="${esc(x.nombre)}">↓ ${esc(x.nombre)}</button><span class="x-m">subido por ${esc(x.quien)} el ${esc(x.subida)}${x.fecha ? " · " + esc(x.fecha) : ""}</span>`).join("")}</div>` : ""}</div>
      <div><span class="x-st ${d.estado}">${INSST[d.estado]}</span></div>
      <div class="x-dl">${d.k.map(k => btnDl(k, d.k.length > 1 ? nomArch(k).replace(/^SAP - /, "") : "Descargar")).join("")}${d.estado !== "PORTAL" ? `<button type="button" class="x-btn" data-subir="${esc(d.doc)}">⬆ Subir</button>` : ""}</div></div>`; };
  return `<h2>Ante una inspección</h2><p class="x-intro">${E("ui.insp.intro", "Todo lo que conviene tener a mano si llega un inspector, agrupado según quién suele pedirlo. Lo que dice «Está en el portal» se baja desde acá, incluso desde el celular. Lo que guarda el local se puede subir acá para tenerlo todo junto.")}</p>
  <div class="lt-sum"><div class="ok"><b>${cnt("PORTAL")}</b><span>en el portal</span></div><div class="lo"><b>${cnt("LOCAL")}</b><span>los guarda el local</span></div><div class="tr"><b>${cnt("TRAMITE")}</b><span>en trámite</span></div><div class="fa"><b>${cnt("FALTA")}</b><span>faltan</span></div></div>
  <div class="lt-guia"><h3>${E("ui.insp.guia", "Si llega un inspector")}</h3><ol>${X().guia.map((g, i) => `<li>${E("guia." + i)}</li>`).join("")}</ol>
  <a class="x-btn p" href="tel:+5491145646462">📞 Llamar al Lic. Marcelo Elvira · 15-4564-6462</a></div>
  ${gs.map((g, gi) => `<div class="g-sec">${E("insp." + gi + ".t")} <span class="lt-quien">${E("insp." + gi + ".quien")}</span></div><div class="x-box lt-g-${g.g}">${g.items.map((d, i) => item(g, gi, d, i)).join("")}</div>`).join("")}`;
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

// ---------- estado de situación general a demanda ----------
const ESG_COL = {FALTA: "#C0392B", TRAMITE: "#B7791F", LOCAL: "#555B66", PORTAL: "#2E7D32", EJECUTADO: "#2E7D32", VIGENTE: "#2E7D32", VENCIDO: "#C0392B", PENDIENTE: "#B7791F", "EN PREPARACIÓN": "#B7791F"};
function esgDoc(gen){
  const x = X(), g = x.esg, d = v => v || "—", m = DATA.meses[0], s = x.sap;
  const stl = (st, l) => `<b style="color:${ESG_COL[st] || "#333"};font-size:8pt">${esc(l || st)}</b>`;
  const est = p => ultEstado(m, p) || "Pendiente";
  const f = m.temas.map(t => { const ps = m.puntos.filter(p => p.tema === t.key), c = fn => ps.filter(fn).length; return {n: t.nombre, t: ps.length, al: c(p => p.prio === "Alta"), cu: c(p => est(p) === "En curso"), li: c(p => est(p) === "Listo para verificar"), re: c(p => est(p) === "Resuelto")}; }).filter(r => r.t);
  const tot = k => f.reduce((a, r) => a + r[k], 0);
  return `<table class="esg-pg"><tbody><tr><td>
  <div class="esg-mem"><b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo</span><small>M.P. 0656 C.P.I.I. · 15-4564-6462 · marcelo.a.elvira@gmail.com</small></div>
  <h1>Estado de situación general</h1>
  <div class="esg-fe">Higiene y Seguridad en el Trabajo · última actualización: ${esc(x.fecha)} · <b>informe generado el ${esc(gen)}</b></div>
  <table class="esg-t esg-dat"><tr><th>Cliente</th><td>${esc(g.razon)} · ${esc(g.establecimiento)}</td><th>CUIT</th><td>${esc(g.cuit)}</td></tr>
  <tr><th>Domicilio</th><td>${esc(x.local.dom)}, ${esc(x.local.barrio)}, C.A.B.A.</td><th>Encuadre</th><td>${esc(g.encuadre)}</td></tr></table>
  <div class="esg-bar">1. SISTEMA DE AUTOPROTECCIÓN</div>
  <table class="esg-t"><thead><tr><th style="width:30%">Expediente</th><th style="width:18%">Estado</th><th>Lo que falta para presentar</th></tr></thead><tbody>
  <tr><td>${esc(s.exp)}<small>caratulado el ${esc(s.caratulado)} · ${esc(s.grupo)}</small></td><td>${stl(s.estado)}</td><td>${s.pend.map((p, i) => `${i + 1}. ${esc(T("sap.pend." + i + ".t"))} <small style="display:inline">(${esc(T("sap.pend." + i + ".q"))})</small>`).join("<br>")}</td></tr></tbody></table>
  <div class="esg-bar">2. PUNTOS DEL INFORME DE VISITA ${esc(m.etq)} POR TEMA</div>
  <table class="esg-t"><thead><tr><th>Tema</th><th>Puntos</th><th>Prioridad alta</th><th>En curso</th><th>Listos para verificar</th><th>Resueltos</th></tr></thead><tbody>
  ${f.map(r => `<tr><td>${esc(r.n)}</td><td class="c"><b>${r.t}</b></td><td class="c">${d(r.al)}</td><td class="c">${d(r.cu)}</td><td class="c">${d(r.li)}</td><td class="c">${d(r.re)}</td></tr>`).join("")}
  <tr class="tot"><td>Total</td>${["t", "al", "cu", "li", "re"].map(k => `<td class="c">${tot(k)}</td>`).join("")}</tr></tbody></table>
  <p class="esg-n">El detalle de cada punto, con sus fotos y la acción a realizar, está en el informe de visita ${esc(m.etq)} y en el portal. El avance es el cargado en el portal al momento de generar este informe.</p>
  <div class="esg-bar">3. ESTUDIOS DE HIGIENE Y SEGURIDAD</div>
  <table class="esg-t"><thead><tr><th style="width:44%">Estudio</th><th style="width:16%">Fecha</th><th style="width:20%">Vigencia</th><th>Estado</th></tr></thead><tbody>
  ${x.estudios.map((e, i) => { const [st, ve] = estEst(e); return `<tr><td><b>${esc(T("estudios." + i + ".estudio"))}</b><small>${esc(T("estudios." + i + ".norma"))}</small></td><td>${esc(T("estudios." + i + ".fecha"))}</td><td>${esc(T("estudios." + i + ".vigencia"))}</td><td>${stl(st, st === "PENDIENTE" ? "A REALIZAR" : st)}${ve ? "<small>" + ve + "</small>" : ""}</td></tr>`; }).join("")}</tbody></table>
  <div class="esg-bar">4. DOCUMENTACIÓN PARA UNA INSPECCIÓN</div>
  <table class="esg-t"><thead><tr><th style="width:48%">Documento</th><th style="width:17%">Estado</th><th>Situación</th></tr></thead><tbody>
  ${x.insp.map((gr, gi) => `<tr class="tot"><td colspan="3">${esc(T("insp." + gi + ".t"))}</td></tr>` + gr.items.map((o, i) => `<tr><td>${esc(T(`insp.${gi}.items.${i}.doc`))}</td><td>${stl(o.estado, INSST[o.estado].toUpperCase())}</td><td>${esc(T(`insp.${gi}.items.${i}.sit`))}</td></tr>`).join("")).join("")}</tbody></table>
  <div class="esg-fi">${ESG_FIRMA ? `<img src="${ESG_FIRMA}" alt="">` : ""}<b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo · M.P. 0656 C.P.I.I.</span></div>
  </td></tr></tbody><tfoot><tr><td><div class="esg-pie">Estado de situación general — ${esc(g.razon)} (La Tribuna) — ${esc(x.local.dom)}, C.A.B.A.</div></td></tr></tfoot></table>`;
}
async function imprimirEsg(){
  toast("Generando el estado de situación…");
  try { await cargarEstado(); } catch(e){}
  if (!ESG_FIRMA && X().archivos.firma){ try { const b = CIFRADO ? await bajarCifrado("arch/firma") : await (await fetch("arch/firma")).arrayBuffer(); ESG_FIRMA = URL.createObjectURL(new Blob([b], {type: X().archivos.firma.tipo})); } catch(e){} }
  const a = new Date(), dd = n => String(n).padStart(2, "0");
  const gen = `${dd(a.getDate())}/${dd(a.getMonth() + 1)}/${a.getFullYear()} a las ${dd(a.getHours())}:${dd(a.getMinutes())} h`;
  let el = $("esg"); if (!el){ el = document.createElement("div"); el.id = "esg"; document.body.appendChild(el); }
  el.innerHTML = esgDoc(gen);
  const im = el.querySelector("img"); if (im){ try { await im.decode(); } catch(e){} }
  const t0 = document.title; document.title = `Estado de situación general La Tribuna ${dd(a.getDate())}-${dd(a.getMonth() + 1)}-${String(a.getFullYear()).slice(2)}`;
  document.body.classList.add("imprimiendo-esg");
  await new Promise(r => setTimeout(r, 200));
  window.print(); document.body.classList.remove("imprimiendo-esg"); document.title = t0;
}
document.addEventListener("click", e => { if (e.target.closest("[data-esg]")) imprimirEsg(); });

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {inicio: modInicio, estado: modEstado});
