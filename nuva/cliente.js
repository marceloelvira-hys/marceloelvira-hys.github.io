// ---------- NUVA: solapas (informe, SAP, estudios y matafuegos, capacitación, EPP, máquinas, procedimientos, ante una inspección, descargas) ----------
// Base: portal MIT sin selector de planta (un solo local). PL queda fijo para reusar el código del informe.
// Lo común (textos editables, publicación por sección, descargas, subir constancia, proponer fecha, video) está en core/v1/modulos.js;
// acá van las opciones de este cliente (MOD) y lo propio. Una función con el mismo nombre que una del módulo la pisa.
Object.assign(MOD, {propHorario: "13:30 a 14:15, al cambio de turno"});
const TABS = [["informe", "Informe de visita"], ["sap", "Autoprotección"], ["hys", "Estudios y matafuegos"], ["cap", "Capacitación"], ["epp", "EPP"], ["maq", "Máquinas"], ["proc", "Procedimientos"], ["insp", "Ante una inspección"], ["dl", "Descargas"]];
const INSST = {PORTAL: "Está en el portal", LOCAL: "Lo guarda la empresa", FALTA: "Falta", TRAMITE: "En trámite"};
let TAB = "informe", PL = "P1", MFP = "";

// ---------- SAP ----------
function vSap(){
  const s = X().sap, prox = s.hitos.find(h => !h.ok && h.sim);
  return `<h2>Sistema de Autoprotección</h2><p class="x-intro">${E("ui.sap.intro", "Lo presentado y aprobado ante Defensa Civil, las fechas de los simulacros y del vencimiento anual, y la documentación para bajar.")}</p>
  <div class="sap-c"><div class="sap-h"><div><b>NUVA · ${esc(X().local.dom)}</b><span>Sistema de Autoprotección · ${esc(s.grupo)}</span></div><span class="sap-ok">${esc(s.estado)}</span></div>
  <div class="sap-k">
    <div><span>Vencimiento anual</span><b>${fISO(s.vig_anual)}</b><em class="${dias(s.vig_anual) < 60 ? "pr" : ""}">${falta(s.vig_anual)}</em></div>
    <div><span>Próximo simulacro</span>${prox ? `<b>${fISO(prox.f)}</b><em>${falta(prox.f)}</em>` : `<b>—</b><em>Se fijan al renovar</em>`}</div>
    <div><span>Vigencia del SAP</span><b>${fISO(s.vig_bianual)}</b><em>${esc(s.disp)}</em></div>
  </div>
  <div class="sap-l">${s.hitos.map((h, i) => `<div class="${h.ok || dias(h.f) < 0 ? "ok" : "pe"}${h.venc ? " ve" : ""}"><i></i><b>${fISO(h.f)}</b><span>${E("sap.hitos." + i + ".t")}</span>${!h.ok && dias(h.f) >= 0 ? `<em>${falta(h.f)}</em>` : ""}</div>`).join("")}</div>
  <p class="x-m" style="margin:10px 0">Expediente ${esc(s.exp)} · aprobado el ${esc(s.disp_fecha)}. ${E("sap.nota")}</p>
  <div class="x-dl x-dlrow">${s.archivos.map(k => btnDl(k)).join("")}</div></div>`;
}

// ---------- estudios y matafuegos ----------
function grupoInf(){
  return `<div class="g-box" style="--c:var(--brand)"><h3>Informes de visita</h3><span class="x-m">El último y los anteriores, en PDF</span>
  <div class="g-sel"><select id="sel-inf">${[["9-26", "Informe 9-26"], ["inm", "Informe 9-26 · corrección inmediata"], ["3-26", "Informe 3-26"], ["1-26", "Informe 1-26"]].map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select><button type="button" class="g-btn" data-dlsel="inf">Descargar</button></div></div>`;
}
function vHys(){
  const e = X().estudios, mf = X().matafuegos, tot = mf.length, pisos = [...new Set(mf.map(m => m.piso))];
  return `<h2>Estudios de higiene y seguridad</h2><p class="x-intro">${E("ui.hys.intro", "Mediciones y estudios de la planta, con su estado al " + X().fecha + ".")}</p>
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="x-box" style="border-top:5px solid var(--brand)"><div class="x-row x-est h"><span>Estudio</span><span>Norma</span><span>Fecha</span><span>Vigencia</span><span>Estado</span><span>Documento</span></div>
  ${e.map((s, i) => { const [st, ve] = estEst(s); return `<div class="x-row x-est"><div><div class="x-t">${E("estudios." + i + ".estudio")}</div><div class="x-m">${E("estudios." + i + ".sit")}</div></div><div class="x-m">${E("estudios." + i + ".norma")}</div><div class="x-m">${E("estudios." + i + ".fecha")}</div><div class="x-m">${E("estudios." + i + ".vigencia")}</div><div><span class="x-e ${st.replace(" ", "-")}">${st === "EN CURSO" ? "EN PREPARACIÓN" : st === "PENDIENTE" ? "A REALIZAR" : st}</span>${ve ? `<div class="x-m">${ve}</div>` : ""}</div><div class="x-dl">${s.archivos.map(k => btnDl(k, k === "cf-plan" ? "Planillas" : "Descargar")).join("") || `<span class="x-m">—</span>`}</div></div>`; }).join("")}</div>
  <div class="g-sec">Matafuegos · ${tot} equipos · control del ${esc(X().mf_fecha)}</div>
  <div class="lt-pisos">${pisos.map(p => `<button type="button" class="lt-piso${MFP === p ? " on" : ""}" data-mfp="${esc(p)}"><b>${mf.filter(m => m.piso === p).length}</b><span>${esc(p)}</span></button>`).join("")}<button type="button" class="lt-piso${!MFP ? " on" : ""}" data-mfp=""><b>${tot}</b><span>Todos</span></button></div>
  <div class="x-box"><div class="x-row lt-mfr h"><span>N.º</span><span>Puesto</span><span>Piso</span><span>Equipo</span><span>Observación</span></div>
  ${mf.filter(m => !MFP || m.piso === MFP).map(m => `<div class="x-row lt-mfr"><b>${m.n}</b><span>${esc(m.puesto)}</span><span class="x-m">${esc(m.piso)}</span><span class="x-m">${esc(m.agente)} · ${esc(m.cap)}${m.num ? " · n.º " + esc(m.num) : ""}</span><span class="x-m">${esc(m.obs)}</span></div>`).join("")}
  <div class="x-row" style="background:var(--crema)">${btnDl("mf", "Control de extintores (PDF)")}</div></div>
  <div class="x-note"><span style="flex:1;min-width:240px">${E("mf_nota")}</span></div>`;
}

// ---------- capacitación ----------
function vCap(){
  const c = X().cap, props = i => PROPS.filter(p => p.tema === T("cap.prog." + i + ".tema"));
  const prog = `<div class="x-box"><div class="x-bh">${E("ui.cap.prog", "Programa de capacitación 2026")}<span>${btnDl("prog", "Programa 2026 (PDF)").replace('class="x-btn"', 'class="x-btn x-inv"')}</span></div>
    <div class="x-row x-cap h"><span>Mes</span><span>Tema</span><span>Destinado a</span><span>Fecha a coordinar</span></div>
    ${c.prog.map((p, i) => `<div class="x-row x-cap"><b>${E("cap.prog." + i + ".mes")}</b><span>${E("cap.prog." + i + ".tema")}</span><span class="x-m">${E("cap.prog." + i + ".para")}</span>
      <div>${props(i).map(q => `<div class="prop"><b>${esc(q.fechas)}${q.horario ? " · " + esc(q.horario) : ""}</b><span>propuso ${esc(q.quien)} el ${esc(q.cargada)}${q.estado && q.estado !== "Propuesta" ? " · " + esc(q.estado) : ""}</span></div>`).join("")}
      <button type="button" class="x-btn" data-prop="${i}">📅 Proponer fecha y horario</button></div></div>`).join("")}</div>`;
  const subidas = CONST_UP.filter(x => !x.doc && !/^Ante una inspección/.test(x.cap)).map(x => ({t: x.cap + (x.fecha ? " · " + x.fecha : ""), btn: `<button type="button" class="x-btn" data-cdl="${esc(x.id)}" data-cnom="${esc(x.nombre)}">↓ ${esc(x.nombre)}</button>`, sub: `Subida por ${x.quien} el ${x.subida}`}));
  const lista = c.constancias.map(x => ({t: x.t, btn: btnDl(x.k, "Constancia (PDF)"), sub: "Cargada por el Lic. Marcelo Elvira"})).concat(subidas);
  const cons = `<div class="g-sec">Constancias de capacitación</div>
  <div class="x-box">${lista.length ? lista.map(x => `<div class="x-row x-cot" style="grid-template-columns:1fr 280px"><div><div class="x-t">${esc(x.t)}</div><div class="x-m">${esc(x.sub)}</div></div><div>${x.btn}</div></div>`).join("") : `<div class="x-row x-m">Todavía no hay constancias cargadas.</div>`}
  <div class="x-row" style="background:var(--crema)"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="x-btn p" data-subir="cap">⬆ Subir una constancia de capacitación</button><span class="x-m">PDF o foto de la planilla firmada. Le llega al Lic. Marcelo Elvira y queda acá.</span></div></div></div>`;
  const reg = "";
  return `<h2>Capacitación</h2><p class="x-intro">${E("ui.cap.intro", "Programa anual: se puede proponer la fecha y el horario de cada charla. Abajo, las constancias firmadas de las capacitaciones dadas; también se pueden subir desde acá.")}</p>${prog}${cons}${reg}`;
}

// ---------- EPP ----------
function vEpp(){
  const ss = X().sect, es = X().epp;
  return `<h2>Elementos de protección personal</h2><p class="x-intro">${E("ui.epp.intro", "Dónde hay que usar cada elemento, por sector de la planta.")}</p>
  <div class="x-box"><div class="x-bh">NUVA<span>elemento por sector</span></div><div class="x-mxw"><table class="x-mx"><tr><th style="width:28%">Elemento</th>${ss.map(x => `<th>${esc(x)}</th>`).join("")}</tr>
  ${es.map((e, i) => `<tr><td><b>${E("epp." + i + ".elem")}</b><div class="x-m">${E("epp." + i + ".det")}</div></td>${ss.map((_, j) => e.s.includes(j) ? `<td><span class="x-dot" title="Se usa"></span></td>` : `<td class="x-no">—</td>`).join("")}</tr>`).join("")}</table></div></div>
  <div class="x-cards">${es.map((e, i) => `<div class="x-card"><b>${E("epp." + i + ".elem")}</b><span class="x-m">${E("epp." + i + ".cuando")}</span></div>`).join("")}</div>
  <div class="x-note"><span style="flex:1;min-width:240px">${E("epp_nota")}</span>${btnDl("epp299", "Constancia de entrega de EPP (Excel)")}</div>`;
}

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

// ---------- ante una inspección ----------
function vInsp(){
  const gs = X().insp, todos = gs.flatMap(g => g.items), cnt = k => todos.filter(d => d.estado === k).length;
  const sub = doc => CONST_UP.filter(x => x.cap === "Ante una inspección · " + doc);
  const item = (g, gi, d, i) => { const p = `insp.${gi}.items.${i}`, ups = sub(d.doc);
    return `<div class="x-row lt-ins"><div><div class="x-t">${E(p + ".doc")}</div><div class="x-m">${E(p + ".sit")}</div>
      ${ups.length ? `<div class="lt-ups">${ups.map(x => `<button type="button" class="x-btn" data-cdl="${esc(x.id)}" data-cnom="${esc(x.nombre)}">↓ ${esc(x.nombre)}</button><span class="x-m">subido por ${esc(x.quien)} el ${esc(x.subida)}${x.fecha ? " · " + esc(x.fecha) : ""}</span>`).join("")}</div>` : ""}</div>
      <div><span class="x-st ${d.estado}">${INSST[d.estado]}</span></div>
      <div class="x-dl">${d.k.map(k => btnDl(k, d.k.length > 1 ? nomArch(k).replace(/^SAP - /, "") : "Descargar")).join("")}${d.estado !== "PORTAL" ? `<button type="button" class="x-btn" data-subir="${esc(d.doc)}">⬆ Subir</button>` : ""}</div></div>`; };
  return `<h2>Ante una inspección</h2><p class="x-intro">${E("ui.insp.intro", "Todo lo que conviene tener a mano si llega un inspector, agrupado según quién suele pedirlo. Lo que dice «Está en el portal» se baja desde acá, incluso desde el celular. Lo que guarda la empresa se puede subir acá para tenerlo todo junto.")}</p>
  <div class="lt-sum"><div class="ok"><b>${cnt("PORTAL")}</b><span>en el portal</span></div><div class="lo"><b>${cnt("LOCAL")}</b><span>los guarda la empresa</span></div><div class="tr"><b>${cnt("TRAMITE")}</b><span>en trámite</span></div><div class="fa"><b>${cnt("FALTA")}</b><span>faltan</span></div></div>
  <div class="lt-guia"><h3>${E("ui.insp.guia", "Si llega un inspector")}</h3><ol>${X().guia.map((g, i) => `<li>${E("guia." + i)}</li>`).join("")}</ol>
  <a class="x-btn p" href="tel:+5491145646462">📞 Llamar al Lic. Marcelo Elvira · 15-4564-6462</a></div>
  ${gs.map((g, gi) => `<div class="g-sec">${E("insp." + gi + ".t")} <span class="lt-quien">${E("insp." + gi + ".quien")}</span></div><div class="x-box lt-g-${g.g}">${g.items.map((d, i) => item(g, gi, d, i)).join("")}</div>`).join("")}`;
}

// ---------- descargas ----------
function vDl(){
  const x = X();
  const box = (t, c, ks) => ks.length ? `<div class="g-box" style="--c:${c}"><h3>${t}</h3><div class="g-list">${ks.map(([k, tx]) => `<div class="g-it"><span>${esc(tx || nomArch(k))}</span><button type="button" class="g-btn" data-dl="${k}">Descargar</button></div>`).join("")}</div></div>` : "";
  const est = x.estudios.flatMap((s, i) => s.archivos.map(k => [k, T("estudios." + i + ".estudio") + " · " + s.fecha]));
  return `<h2>Descargas</h2><p class="x-intro">${E("ui.dl.intro", "Todo para bajar, agrupado por tipo.")}</p>
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="g-row">${box("Habilitación y Autoprotección", "var(--brand)", [["habil"], ...x.sap.archivos.map(k => [k])])}${box("Estudios", "var(--celeste-dk)", est.concat([["mf", "Control de extintores · " + x.mf_fecha]]))}${box("Capacitación", "#8A5A12", [["prog"], ...x.cap.constancias.map(c => [c.k, c.t])])}${box("Procedimientos y AST", "#2F7D4A", x.procs.map(p => [p.k, p.t]))}${box("Documentación ante la ART", "#6E1E2E", [["rgrl"], ["rar"], ["epp299"]])}</div></div>`;
}
function renderExtra(){
  $("vExtra").innerHTML = pubCtl(TAB) + ({sap: vSap, hys: vHys, cap: vCap, epp: vEpp, maq: vMaq, proc: vProc, insp: vInsp, dl: vDl})[TAB]();
  if (EDIT) $("vExtra").querySelectorAll("[data-ed]").forEach(e => e.contentEditable = "true");
}

document.addEventListener("click", e => {
  if (EDIT && e.target.closest("[data-ed]")) return;   // editando: el clic es para escribir
  const t = e.target.closest("[data-tab],[data-dl],[data-dlsel],[data-mfp],[data-pub],[data-editar],[data-prop],[data-subir],[data-cdl],#ppEnv,#suEnv"); if (!t) return;
  if (t.dataset.pub){ const k = t.dataset.pub, on = !pubOn(k); PUB = PUB || {}; PUB[k] = on; enviar({tipo: "publicar", seccion: k, on}).then(r => toast(r.ok ? (on ? "Sección publicada" : "Sección sacada de la publicación") : "No se pudo guardar")); solapas(); if (!$("vExtra").hidden) renderExtra(); return; }
  if (t.dataset.editar){ EDIT = !EDIT; document.body.classList.toggle("editando", EDIT); barra(); irA(TAB); toast(EDIT ? "Tocá cualquier texto con borde punteado y escribí. Se guarda al salir del texto." : "Edición terminada"); return; }
  if (t.dataset.prop){ abrirProp(+t.dataset.prop); return; }
  if (t.dataset.subir){ abrirSubir(t.dataset.subir); return; }
  if (t.dataset.cdl !== undefined){ bajarSubida(t.dataset.cdl, t.dataset.cnom); return; }
  if (t.id === "ppEnv"){ enviarProp(+t.dataset.pi); return; }
  if (t.id === "suEnv"){ enviarSubir(t.dataset.modo); return; }
  if (t.dataset.mfp !== undefined){ MFP = t.dataset.mfp; renderExtra(); return; }
  if (t.dataset.dlsel){ bajarArch($("sel-" + t.dataset.dlsel).value); return; }
  if (t.dataset.tab) irA(t.dataset.tab);
  else if (t.dataset.dl) bajarArch(t.dataset.dl);
});

// ---------- estado de situación general a demanda ----------
const ESG_COL = {APROBADO: "#2E7D32", FALTA: "#C0392B", TRAMITE: "#B7791F", LOCAL: "#555B66", PORTAL: "#2E7D32", EJECUTADO: "#2E7D32", VIGENTE: "#2E7D32", VENCIDO: "#C0392B", PENDIENTE: "#B7791F", "EN PREPARACIÓN": "#B7791F"};
function esgDoc(gen){
  const x = X(), g = x.esg, d = v => v || "—", m = DATA.meses[0], s = x.sap;
  const stl = (st, l) => `<b style="color:${ESG_COL[st] || "#333"};font-size:8pt">${esc(l || st)}</b>`;
  const est = p => ultEstado(m, p) || "Pendiente";
  const f = m.temas.map(t => { const ps = m.puntos.filter(p => p.tema === t.key), c = fn => ps.filter(fn).length; return {n: t.nombre, t: ps.length, al: c(p => p.prio === "Inmediata" || p.prio === "Alta"), cu: c(p => est(p) === "En curso"), li: c(p => est(p) === "Listo para verificar"), re: c(p => est(p) === "Resuelto")}; }).filter(r => r.t);
  const tot = k => f.reduce((a, r) => a + r[k], 0);
  return `<table class="esg-pg"><tbody><tr><td>
  <div class="esg-mem"><b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo</span><small>M.P. 0656 C.P.I.I. · 15-4564-6462 · marcelo.a.elvira@gmail.com</small></div>
  <h1>Estado de situación general</h1>
  <div class="esg-fe">Higiene y Seguridad en el Trabajo · última actualización: ${esc(x.fecha)} · <b>informe generado el ${esc(gen)}</b></div>
  <table class="esg-t esg-dat"><tr><th>Cliente</th><td>${esc(g.razon)} · ${esc(g.establecimiento)}</td><th>CUIT</th><td>${esc(g.cuit)}</td></tr>
  <tr><th>Domicilio</th><td>${esc(x.local.dom)}, ${esc(x.local.barrio)}, C.A.B.A.</td><th>Encuadre</th><td>${esc(g.encuadre)}</td></tr></table>
  <div class="esg-bar">1. SISTEMA DE AUTOPROTECCIÓN</div>
  <table class="esg-t"><thead><tr><th>Expediente</th><th>Estado</th><th>Próximo simulacro</th><th>Vencimiento anual</th></tr></thead><tbody>
  <tr><td>${esc(s.exp)}<small>${esc(s.disp)} del ${esc(s.disp_fecha)}</small></td><td>${stl(s.estado)}</td><td>${(h => h ? fISO(h.f) + "<small>" + esc(h.t) + "</small>" : "—")(s.hitos.find(h => !h.ok && h.sim))}</td><td>${fISO(s.vig_anual)}<small>${falta(s.vig_anual)}</small></td></tr></tbody></table>
  <div class="esg-bar">2. PUNTOS DEL INFORME DE VISITA ${esc(m.etq)} POR TEMA</div>
  <table class="esg-t"><thead><tr><th>Tema</th><th>Puntos</th><th>Inmediata o alta</th><th>En curso</th><th>Listos para verificar</th><th>Resueltos</th></tr></thead><tbody>
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
  </td></tr></tbody><tfoot><tr><td><div class="esg-pie">Estado de situación general — ${esc(g.razon)} — ${esc(x.local.dom)}, C.A.B.A.</div></td></tr></tfoot></table>`;
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
  const t0 = document.title; document.title = `Estado de situación general NUVA ${dd(a.getDate())}-${dd(a.getMonth() + 1)}-${String(a.getFullYear()).slice(2)}`;
  document.body.classList.add("imprimiendo-esg");
  await new Promise(r => setTimeout(r, 200));
  window.print(); document.body.classList.remove("imprimiendo-esg"); document.title = t0;
}
document.addEventListener("click", e => { if (e.target.closest("[data-esg]")) imprimirEsg(); });

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {inicio: modInicio, estado: modEstado, prios: ["inmediata", "alta", "media"],
  prioTxt: n => ` · corrección inmediata ${n("inmediata")}, prioridad alta ${n("alta")} y media ${n("media")}`});
