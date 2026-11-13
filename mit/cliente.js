// ---------- Metalúrgica MIT: selector de planta + solapas (SAP, estudios, capacitación, EPP, máquinas, normas, documentación, descargas) ----------
const PLS = [["P1", "Planta 1", "Cnel. Ramón Lista 5076"], ["P2", "Planta 2", "Cnel. Ramón Lista 5158"], ["G", "General", "Lo común a las dos plantas"]];
const TABS = [["informe", "Informe de visita"], ["sap", "Autoprotección"], ["hys", "Estudios"], ["cap", "Capacitación"], ["epp", "EPP"], ["maq", "Máquinas"], ["normas", "Normas y AST"], ["docs", "Documentación pedida"], ["dl", "Descargas"]];
const DOCST = {FALTA: "Falta", PARCIAL: "Parcial", CONFIRMAR: "A confirmar", NUESTRO: "Lo hacemos nosotros", OK: "Presentado"};
let TAB = "informe", PL = "P1", TODOS = null, MAQ = "", MQQ = "", MQS = "";
const X = () => DATA.extra;
let TXT = {}, PUB = null, CONST_UP = [], PROPS = [], EDIT = false;
const PUB_DEF = {informe: true};                       // hasta que el Lic. publique otras secciones, el cliente ve sólo el informe
const pubOn = k => PUB && PUB[k] !== undefined ? PUB[k] : !!PUB_DEF[k];
const tabsVis = () => TABS.filter(([k]) => ADMIN || pubOn(k));
const getP = path => path.split(".").reduce((o, k) => o == null ? o : o[k], DATA.extra);
const T = (k, def) => TXT[k] !== undefined ? TXT[k] : (def !== undefined ? def : getP(k));
const E = (k, def) => `<span data-ed="${esc(k)}">${esc(T(k, def) ?? "")}</span>`;   // texto que el Lic. puede editar desde la página
const plTag = pl => `<i class="pl-tag pl-${pl}">${pl === "G" ? "P1 y P2" : pl}</i>`;
function mitEstado(j){
  TXT = j.textos || TXT; PUB = j.publicacion || PUB || {}; CONST_UP = j.constancias || []; PROPS = j.propuestas || [];
  solapas(); if (!tabsVis().some(t => t[0] === TAB)){ irA(tabsVis()[0][0]); return; }
  if (!$("vExtra").hidden) renderExtra();
}
const PNOM = () => (PLS.find(p => p[0] === PL) || [])[1] || "";
const enPl = x => PL === "G" ? x.pl === "G" : x.pl === PL;
const fISO = s => { const [a, m, d] = s.split("-"); return `${d}/${m}/${a}`; };
const dias = s => Math.round((new Date(s + "T12:00:00") - new Date(new Date().toDateString() + " 12:00")) / 864e5);
const falta = s => { const d = dias(s); return d > 1 ? `faltan ${d} días` : d === 1 ? "mañana" : d === 0 ? "hoy" : `hace ${-d} días`; };
const mesesPl = pl => (TODOS || DATA.meses).filter(m => m.planta === pl);

function plantaInicial(){
  if (!TODOS) TODOS = DATA.meses;
  const g = ls("mit-planta"); if (PLS.some(p => p[0] === g)) PL = g;
  aplicarPlanta(true);
}
function aplicarPlanta(inicio){
  DATA.meses = mesesPl(PL === "G" ? "P1" : PL);
  st.mes = DATA.meses[0].clave; st.sector = ""; st.tema = ""; st.ot = ""; st.q = ""; st.seg = "todos"; SEL.clear();
  const q = $("fQ"); if (q) q.value = "";
  document.body.dataset.planta = PL;
  $("plantasW").innerHTML = `<span class="pl-lbl">Ver</span>` + PLS.map(([k, n, d]) => `<button type="button" data-pl="${k}" aria-pressed="${k === PL}"><b>${n}</b><span>${d}</span></button>`).join("") + (X().archivos.video && (ADMIN || pubOn("video")) ? `<button type="button" class="pl-vid" data-video="1"><b>▶ Cómo se usa</b><span>Video de 2 minutos</span></button>` : "")
    + (ADMIN ? `<button type="button" class="pl-ed${EDIT ? " on" : ""}" data-editar="1"><b>✏ ${EDIT ? "Terminar de editar" : "Editar textos"}</b><span>${EDIT ? "Tocá un texto y escribí" : "Sólo el Lic. Elvira"}</span></button>` : "");
  if (!inicio){ ls("mit-planta", PL); solapas(); irA(TAB); }
}
function solapas(){
  const pend = X().docs.filter(d => d.estado === "FALTA" || d.estado === "PARCIAL").length;
  const nPts = PL === "G" ? mesesPl("P1")[0].puntos.length + mesesPl("P2")[0].puntos.length : DATA.meses[0].puntos.length;
  $("solapasW").innerHTML = tabsVis().map(([k, t]) => `<button type="button" data-tab="${k}" aria-pressed="${k === TAB}"${ADMIN && !pubOn(k) ? ' class="wip" title="En revisión: MIT no la ve"' : ""}>${ADMIN && !pubOn(k) ? "🚧 " : ""}${t}${k === "docs" && pend ? `<i>${pend}</i>` : ""}${k === "informe" ? `<i>${nPts}</i>` : ""}</button>`).join("");
  const pi = $("pubInf"); if (pi) pi.innerHTML = ADMIN ? pubCtl("informe") : "";
}
const pubCtl = k => ADMIN ? `<div class="pub ${pubOn(k) ? "on" : ""}"><span>${pubOn(k) ? "✔ Sección publicada: MIT la ve" : "🚧 En revisión: MIT todavía no la ve"}</span><button type="button" class="x-btn" data-pub="${k}">${pubOn(k) ? "Sacar de la publicación" : "Publicar esta sección"}</button></div>` : "";
function irA(k){
  TAB = k; solapas();
  const extra = k !== "informe" || PL === "G";
  document.body.classList.toggle("extra", extra);
  $("vInforme").hidden = extra; $("vExtra").hidden = !extra;
  if (extra){ renderExtra(); $("subt").textContent = PL === "G" ? "Plantas 1 y 2 · Cnel. Ramón Lista 5076 y 5158 · Villa Devoto" : cabPl(PL); } else render();
  scrollTo({top: 0});
}
async function bajarArch(clave){
  const a = X().archivos[clave]; if (!a) return;
  const html = a.tipo === "text/html", w = html ? window.open("", "_blank") : null;
  toast(html ? "Abriendo…" : "Preparando el archivo…");
  try {
    const ruta = a.ruta || ("arch/" + clave);
    const b = CIFRADO ? await bajarCifrado(ruta) : await (await fetch(ruta)).arrayBuffer();
    const u = URL.createObjectURL(new Blob([b], {type: a.tipo}));
    if (html && w){ w.location = u; return; }
    const el = document.createElement("a"); el.href = u; el.download = a.nombre; document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
  } catch(e){ if (w) w.close(); toast("No se pudo bajar el archivo"); }
}
const nomArch = k => X().archivos[k].nombre.replace(/^MIT( Planta [12])? - /, "").replace(/\.(pdf|html|xlsx?|jpg)$/, "");
const btnDl = (k, txt) => `<button type="button" class="x-btn" data-dl="${k}">${X().archivos[k].tipo === "text/html" ? "▶" : "↓"} ${esc(txt || nomArch(k))}</button>`;
const comun = qué => PL === "G" ? "" : `<div class="pl-aviso"><span>Estás viendo <b>${PNOM()}</b>. ${qué}</span><button type="button" class="x-btn" data-pl="G">Ver General</button></div>`;
const cabPl = pl => { const p = X().plantas[pl]; return `${p.nombre} · ${p.dom}`; };

// ---------- informe en General: resumen de las dos plantas ----------
function vInfG(){
  const card = pl => {
    const m = mesesPl(pl)[0], ps = m.puntos, h = ps.filter(p => hecho(ultEstado(m, p))).length;
    const tm = m.temas.map(t => [t, ps.filter(p => p.tema === t.key).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    const mx = Math.max(...tm.map(x => x[1]));
    return `<div class="g-box" style="--c:var(--brand)"><h3>${esc(cabPl(pl))}</h3><span class="x-m">Informe ${esc(m.etq)} · visita del ${esc(m.visita)} · ${ps.length} puntos${h ? ` · ${h} listos o resueltos` : ""}</span>
      <div class="ig-bars">${tm.map(([t, n]) => `<div><span>${esc(corto(t.nombre))}</span><i style="width:${100 * n / mx}%"></i><b>${n}</b></div>`).join("")}</div>
      <div class="g-sel"><button type="button" class="g-btn" data-pl="${pl}">Ver los puntos de ${esc(X().plantas[pl].nombre)}</button></div></div>`;
  };
  return `<h2>Informe de visita ${esc(mesesPl("P1")[0].etq)} · las dos plantas</h2><p class="x-intro">Cada planta tiene su lista de puntos, numerada desde 1 como en el informe. Elegí una planta para ver los puntos con sus fotos, cargar el seguimiento y armar órdenes de trabajo.</p>
  <div class="g-row">${card("P1")}${card("P2")}</div><div class="g-row">${grupoInf()}${grupoEsg()}</div>`;
}

// ---------- SAP ----------
function sapCard(pl, chico){
  const s = X().sap[pl], prox = s.hitos.find(h => !h.ok && h.sim), venc = s.hitos.find(h => h.venc);
  return `<div class="sap-c"><div class="sap-h"><div><b>${esc(cabPl(pl))}</b><span>Sistema de Autoprotección · ${esc(s.grupo)} · Ley 5920/17</span></div><span class="sap-ok">${esc(s.estado)}</span></div>
  <div class="sap-k">
    <div><span>Vencimiento anual</span><b>${fISO(s.vig_anual)}</b><em class="${dias(s.vig_anual) < 60 ? "pr" : ""}">${falta(s.vig_anual)}</em></div>
    <div><span>Próximo simulacro</span>${prox ? `<b>${fISO(prox.f)}</b><em>${falta(prox.f)}</em>` : `<b>—</b><em>Se fijan al renovar</em>`}</div>
    <div><span>Vigencia del SAP</span><b>${fISO(s.vig_bianual)}</b><em>${esc(s.disp)}</em></div>
  </div>
  ${chico ? "" : `<div class="sap-l">${s.hitos.map(h => `<div class="${h.ok ? "ok" : dias(h.f) < 0 ? "ok" : "pe"}${h.venc ? " ve" : ""}"><i></i><b>${fISO(h.f)}</b><span>${E("sap." + pl + ".hitos." + s.hitos.indexOf(h) + ".t")}</span>${!h.ok && dias(h.f) >= 0 ? `<em>${falta(h.f)}</em>` : ""}</div>`).join("")}</div>
  <p class="x-m" style="margin:10px 0">Expediente ${esc(s.exp)} · presentado el ${esc(s.presentado)} · aprobado el ${esc(s.disp_fecha)}. ${E("sap." + pl + ".nota")}</p>
  <div class="x-dl x-dlrow">${s.archivos.map(k => btnDl(k)).join("")}</div>`}</div>`;
}
function vSap(){
  if (PL === "G") return `<h2>Sistema de Autoprotección · las dos plantas</h2><p class="x-intro">Estado de cada SAP ante la Dirección General de Defensa Civil. Elegí una planta para ver el detalle y bajar la documentación.</p>
    <div class="g-row">${sapCard("P1", true)}${sapCard("P2", true)}</div>`;
  return `<h2>Sistema de Autoprotección · ${esc(PNOM())}</h2><p class="x-intro">Lo presentado y aprobado ante Defensa Civil, las fechas de los simulacros y del vencimiento anual, y la documentación para bajar.</p>${sapCard(PL)}`;
}

// ---------- estudios ----------
function grupoInf(){
  return `<div class="g-box" style="--c:var(--brand)"><h3>Informes de visita</h3><span class="x-m">${plTag("G")} Un solo informe por visita, con las dos plantas</span>
  <div class="g-sel"><select id="sel-inf">${["10-26", "9-26", "8-26", "4-26", "3-26", "1-26", "12-25"].map(k => `<option value="${k}">Informe ${k}</option>`).join("")}</select><button type="button" class="g-btn" data-dlsel="inf">Descargar</button></div></div>`;
}
function grupoEsg(){
  return `<div class="g-box" style="--c:#222529"><h3>Estado de situación general</h3><span class="x-m">Se genera en el momento, con lo último cargado en el portal</span>
  <div class="g-sel"><select id="esgPl"><option value="P1"${PL === "P1" ? " selected" : ""}>Planta 1</option><option value="P2"${PL === "P2" ? " selected" : ""}>Planta 2</option><option value="AMBAS"${PL === "G" ? " selected" : ""}>Las dos plantas</option></select><button type="button" class="g-btn" data-esg="1">Generar e imprimir</button></div></div>`;
}
const estEst = s => { if (s.estado !== "EJECUTADO") return [s.estado, ""]; if (!s.meses || !s.iso) return ["VIGENTE", ""];
  const d = new Date(s.iso + "T12:00:00"); d.setMonth(d.getMonth() + s.meses); const iso = d.toISOString().slice(0, 10);
  return [dias(iso) < 0 ? "VENCIDO" : "VIGENTE", "vence el " + fISO(iso)]; };
function vHys(){
  const e = X().estudios.filter(enPl);
  return `<h2>Estudios de higiene y seguridad · ${esc(PNOM())}</h2><p class="x-intro">Mediciones, protocolos y estudios${PL === "G" ? " comunes a las dos plantas" : " de la planta"}, con su estado al ${esc(X().fecha)}.</p>
  ${comun("El estrés térmico, la carga de fuego y el control de matafuegos son de las dos plantas y están en General.")}
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="x-box" style="border-top:5px solid var(--brand)"><div class="x-row x-est h"><span>Estudio</span><span>Norma</span><span>Fecha</span><span>Vigencia</span><span>Estado</span><span>Documento</span></div>
  ${e.map(s => { const i = X().estudios.indexOf(s), [st, ve] = estEst(s); return `<div class="x-row x-est"><div class="x-t">${E("estudios." + i + ".estudio")}</div><div class="x-m">${E("estudios." + i + ".norma")}</div><div class="x-m">${E("estudios." + i + ".fecha")}</div><div class="x-m">${E("estudios." + i + ".vigencia")}</div><div><span class="x-e ${st.replace(" ", "-")}">${st === "EN CURSO" ? "EN PREPARACIÓN" : st}</span>${ve ? `<div class="x-m">${ve}</div>` : ""}</div><div class="x-dl">${s.archivos.map(k => btnDl(k, "Descargar")).join("") || `<span class="x-m">Se publica al terminar</span>`}</div></div>`; }).join("")}</div>`;
}

// ---------- capacitación: programa con propuestas de fecha + constancias (las del Lic. y las que sube MIT) ----------
const PLN = {P1: "Planta 1", P2: "Planta 2", G: "Plantas 1 y 2", AMBAS: "Plantas 1 y 2"};
function vCap(){
  const c = X().cap, plOk = pl => PL === "G" || pl === PL || pl === "AMBAS" || pl === "G";
  const props = i => PROPS.filter(p => p.tema === c.prog[i].tema && plOk(p.planta));
  const prog = `<div class="x-box"><div class="x-bh">${E("ui.cap.prog", "Programa de capacitación 2026")}<span>${btnDl("prog", "Programa 2026 (PDF)").replace('class="x-btn"', 'class="x-btn x-inv"')}</span></div>
    <div class="x-row x-cap h"><span>Mes</span><span>Tema</span><span>Destinado a</span><span>Fecha a coordinar</span></div>
    ${c.prog.map((p, i) => `<div class="x-row x-cap"><b>${E("cap.prog." + i + ".mes")}</b><span>${E("cap.prog." + i + ".tema")}</span><span class="x-m">${E("cap.prog." + i + ".para")}</span>
      <div>${props(i).map(q => `<div class="prop"><b>${esc(q.fechas)}${q.horario ? " · " + esc(q.horario) : ""}</b><span>${esc(PLN[q.planta] || q.planta)} · propuso ${esc(q.quien)} el ${esc(q.cargada)}${q.estado && q.estado !== "Propuesta" ? " · " + esc(q.estado) : ""}</span></div>`).join("")}
      <button type="button" class="x-btn" data-prop="${i}">📅 Proponer fecha y horario</button></div></div>`).join("")}</div>`;
  const fijas = c.constancias.filter(x => PL === "G" || x.pl === PL).map(x => ({pl: x.pl, t: x.t, btn: btnDl(x.k, "Constancia (PDF)"), sub: "Cargada por el Lic. Marcelo Elvira"}));
  const subidas = CONST_UP.filter(x => PL === "G" || x.planta === PL || x.planta === "AMBAS").map(x => ({pl: x.planta === "AMBAS" ? "G" : x.planta, t: x.cap + (x.fecha ? " · " + x.fecha : ""), btn: `<button type="button" class="x-btn" data-cdl="${esc(x.id)}" data-cnom="${esc(x.nombre)}">↓ ${esc(x.nombre)}</button>`, sub: `Subida por ${x.quien} el ${x.subida}`}));
  const lista = fijas.concat(subidas);
  const cons = `<div class="g-sec">Constancias de capacitación${PL === "G" ? " de las dos plantas" : " · " + esc(PNOM())}</div>
  <div class="x-box">${lista.length ? lista.map(x => `<div class="x-row x-cot" style="grid-template-columns:1fr 280px"><div><div class="x-t">${plTag(x.pl)} ${esc(x.t)}</div><div class="x-m">${esc(x.sub)}</div></div><div>${x.btn}</div></div>`).join("") : `<div class="x-row x-m">Todavía no hay constancias cargadas.</div>`}
  <div class="x-row" style="background:#F6F8FB"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="x-btn p" data-subir="1">⬆ Subir una constancia de capacitación</button><span class="x-m">PDF o foto de la planilla firmada. Le llega al Lic. Marcelo Elvira y queda acá para todos.</span></div></div></div>`;
  const reg = `<div class="x-note"><span style="flex:1;min-width:240px">${E("ui.cap.reg", "Registro de capacitación de MIT (FOR-RH-05) para completar en cada charla: tema, fecha, asistentes y firma.")}</span>${btnDl("forrh05", "Registro FOR-RH-05 (Excel)")}</div>`;
  return `<h2>Capacitación · ${esc(PNOM())}</h2><p class="x-intro">${E("ui.cap.intro", "Programa anual: se puede proponer la fecha y el horario de cada charla. Abajo, las constancias firmadas de las capacitaciones dadas; también se pueden subir desde acá.")}</p>${prog}${cons}${reg}`;
}
function abrirProp(i){
  const p = X().cap.prog[i];
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="ppT" style="width:min(560px,100%)"><div class="cab"><h3 id="ppT">Proponer fecha · ${esc(T("cap.prog." + i + ".tema"))}</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="form"><label for="ppP">Planta</label><select id="ppP"><option value="P1"${PL === "P1" ? " selected" : ""}>Planta 1</option><option value="P2"${PL === "P2" ? " selected" : ""}>Planta 2</option><option value="AMBAS"${PL === "G" ? " selected" : ""}>Las dos plantas</option></select></div>
    <div class="dos"><div class="form"><label for="ppF1">Fecha propuesta</label><input type="date" id="ppF1"></div><div class="form"><label for="ppF2">Otra fecha posible (opcional)</label><input type="date" id="ppF2"></div></div>
    <div class="form"><label for="ppH">Horario</label><input type="text" id="ppH" placeholder="por ejemplo: 10:00 a 10:30, antes del almuerzo"></div>
    <div class="form"><label for="ppC">Comentario (opcional)</label><textarea id="ppC" rows="2" placeholder="Turno, cantidad de personas, lugar…"></textarea></div>
    <span class="aviso">Se guarda a nombre de <b>${esc(quien())}</b> y le llega al Lic. Marcelo Elvira para confirmarla.</span><span class="err" id="ppE"></span>
    <div style="display:flex;gap:10px"><button class="btn prim" type="button" id="ppEnv" data-pi="${i}">Enviar propuesta</button></div></div></div>`;
  $("velo").hidden = false;
}
async function enviarProp(i){
  const f = [$("ppF1").value, $("ppF2").value].filter(Boolean).map(x => fISO(x)), h = $("ppH").value.trim();
  if (!f.length){ $("ppE").textContent = "Elegí al menos una fecha."; return; }
  $("ppEnv").disabled = true;
  const ev = {tipo: "propuesta", cap: T("cap.prog." + i + ".tema"), planta: $("ppP").value, fechas: f.join(" o "), horario: h, texto: $("ppC").value.trim(), quien: quien()};
  const r = await enviar(ev);
  if (!r.ok){ toast("No se pudo enviar. Probá de nuevo."); $("ppEnv").disabled = false; return; }
  PROPS.push({tema: ev.cap, planta: ev.planta, fechas: ev.fechas, horario: h, comentario: ev.texto, quien: ev.quien, estado: "Propuesta", cargada: fISO(new Date().toISOString().slice(0, 10))});
  $("velo").hidden = true; toast("Propuesta enviada. Gracias."); renderExtra();
}
function abrirSubir(){
  const temas = X().cap.prog.map((p, i) => T("cap.prog." + i + ".tema"));
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="suT" style="width:min(560px,100%)"><div class="cab"><h3 id="suT">Subir constancia de capacitación</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="form"><label for="suC">Capacitación</label><select id="suC">${temas.map(t => `<option>${esc(t)}</option>`).join("")}<option value="">Otra…</option></select><input type="text" id="suO" placeholder="Nombre de la capacitación" hidden></div>
    <div class="dos"><div class="form"><label for="suP">Planta</label><select id="suP"><option value="P1"${PL === "P1" ? " selected" : ""}>Planta 1</option><option value="P2"${PL === "P2" ? " selected" : ""}>Planta 2</option><option value="AMBAS"${PL === "G" ? " selected" : ""}>Las dos plantas</option></select></div><div class="form"><label for="suF">Fecha de la charla</label><input type="date" id="suF"></div></div>
    <div class="form"><label for="suA">Archivo (PDF o foto, hasta 15 MB)</label><input type="file" id="suA" accept="application/pdf,image/*"></div>
    <span class="aviso">Se guarda a nombre de <b>${esc(quien())}</b>.</span><span class="err" id="suE"></span>
    <div style="display:flex;gap:10px"><button class="btn prim" type="button" id="suEnv">Subir</button></div></div></div>`;
  $("velo").hidden = false;
  $("suC").onchange = () => { $("suO").hidden = !!$("suC").value; };
}
async function enviarSubir(){
  const a = $("suA").files[0], cap = $("suC").value || $("suO").value.trim();
  if (!cap){ $("suE").textContent = "Indicá la capacitación."; return; }
  if (!a){ $("suE").textContent = "Elegí el archivo."; return; }
  if (a.size > 15 * 1024 * 1024){ $("suE").textContent = "El archivo pesa más de 15 MB."; return; }
  $("suEnv").disabled = true; $("suE").textContent = "Subiendo…";
  const url = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = mal; r.readAsDataURL(a); });
  const ev = {tipo: "constancia", cap, planta: $("suP").value, fecha: $("suF").value ? fISO($("suF").value) : "", nombre: a.name, archivo: url, quien: quien()};
  const r = await enviar(ev);
  if (!r.ok){ $("suE").textContent = "No se pudo subir. Probá de nuevo."; $("suEnv").disabled = false; return; }
  CONST_UP.push({id: r.id || "", planta: ev.planta, cap, fecha: ev.fecha, nombre: a.name, quien: ev.quien, subida: fISO(new Date().toISOString().slice(0, 10))});
  $("velo").hidden = true; toast("Constancia subida. Gracias."); renderExtra();
}
async function bajarSubida(id, nombre){
  if (!API_URL || !id){ toast("Disponible al publicar el portal"); return; }
  toast("Preparando el archivo…");
  try {
    const j = await (await fetch(API_URL + "?accion=archivo&id=" + encodeURIComponent(id) + "&token=" + encodeURIComponent(API_TOKEN))).json();
    if (!j.ok) throw 0;
    const b = Uint8Array.from(atob(j.b64), c => c.charCodeAt(0)), u = URL.createObjectURL(new Blob([b], {type: j.tipo}));
    const el = document.createElement("a"); el.href = u; el.download = nombre || j.nombre; document.body.appendChild(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
  } catch(e){ toast("No se pudo bajar el archivo"); }
}

// ---------- EPP ----------
function mxEpp(pl){
  const ss = X().sect[pl], es = X().epp.filter(e => (e.s[pl] || []).length);
  return `<div class="x-box"><div class="x-bh">${esc(cabPl(pl))}<span>elemento por sector</span></div><div class="x-mxw"><table class="x-mx"><tr><th style="width:26%">Elemento</th>${ss.map(x => `<th>${esc(x)}</th>`).join("")}</tr>
  ${es.map(e => `<tr><td><b>${E("epp." + X().epp.indexOf(e) + ".elem")}</b><div class="x-m">${E("epp." + X().epp.indexOf(e) + ".det")}</div></td>${ss.map((_, i) => e.s[pl].includes(i) ? `<td><span class="x-dot" title="Se usa"></span></td>` : `<td class="x-no">—</td>`).join("")}</tr>`).join("")}</table></div></div>`;
}
function vEpp(){
  const pls = PL === "G" ? ["P1", "P2"] : [PL], es = X().epp.filter(e => pls.some(pl => (e.s[pl] || []).length));
  return `<h2>Elementos de protección personal · ${esc(PNOM())}</h2><p class="x-intro">Dónde hay que usar cada elemento, por sector. La protección auditiva sale de las mediciones de ruido 2026.</p>
  ${pls.map(mxEpp).join("")}
  <div class="x-cards">${es.map(e => `<div class="x-card"><b>${E("epp." + X().epp.indexOf(e) + ".elem")}</b><span class="x-m">${E("epp." + X().epp.indexOf(e) + ".cuando")}</span></div>`).join("")}</div>
  <div class="x-note"><span style="flex:1;min-width:240px">${E("epp_nota")} La entrega de cada elemento se registra en la constancia de la Res. SRT 299/11 (formulario oficial), firmada por el trabajador.</span>${pls.map(pl => btnDl(pl.toLowerCase() + "-epp299", "Constancia de entrega de EPP · " + X().plantas[pl].nombre)).join("")}</div>`;
}

// ---------- máquinas ----------
const li = xs => xs.map(x => `<li>${esc(x)}</li>`).join("");
const liE = (p, xs) => xs.map((x, i) => `<li>${E(p + "." + i)}</li>`).join("");
const ptsChips = q => (q.pts || []).map(([c, n]) => `<button type="button" class="chip ot" data-irpt="${esc(c)}|${n}">Punto ${n} · ${esc(c.split(" ")[1] === "P1" ? "Planta 1" : "Planta 2")} · informe ${esc(c.split(" ")[0])}</button>`).join(" ");
function vMaq(){
  const L = X().listado.filter(enPl), T = X().tipos, ds = X().destacadas.filter(enPl), d = ds.find(x => x.c === MAQ) || ds[0];
  const det = d ? (() => { const t = T[d.t], q = X().listado.find(x => x.c === d.c) || {};
    return `<div class="x-maqs">${ds.map(x => `<button type="button" class="x-maq${x.c === d.c ? " on" : ""}" data-maq="${x.c}">${img(x.fotos[0])}<div><b>${esc(x.nombre)}</b><span class="x-m">${esc(x.donde)}</span></div></button>`).join("")}</div>
    <div class="x-det"><div>${img(d.fotos[0], 'class="big"')}<div class="mq-fs">${d.fotos.slice(1).map(f => img(f)).join("")}</div></div>
    <div><h4>Datos</h4><b style="font-size:16px">${esc(d.nombre)}</b><div class="x-m" style="margin-bottom:8px">${esc(d.marca)} · ${esc(d.donde)}</div><h4>Riesgos</h4><ul>${liE("tipos." + d.t + ".r", t.r)}</ul>${(q.pts || []).length ? `<h4>Puntos del informe</h4><div class="mq-pts">${ptsChips(q)}</div>` : ""}</div>
    <div><h4>EPP obligatorios</h4><ul>${liE("tipos." + d.t + ".e", t.e)}</ul><h4>Recomendaciones</h4><ul>${liE("destacadas." + X().destacadas.indexOf(d) + ".rec_extra", d.rec_extra)}${liE("tipos." + d.t + ".rec", t.rec)}</ul>
    <h4>Material</h4><div class="x-dl">${btnDl(d.sim, "Abrir el simulador")}</div></div></div>`; })() : "";
  const secs = [...new Set(L.map(x => x.s))], q = MQQ.trim().toLowerCase();
  const fl = L.filter(x => (!MQS || x.s === MQS) && (!q || (x.c + " " + x.m + " " + T[x.t].n).toLowerCase().includes(q)));
  const conPts = L.filter(x => (x.pts || []).length).length;
  return `<h2>Máquinas · ${esc(PNOM())}</h2><p class="x-intro">${d ? "Máquinas con simulador 3D para capacitación y " : ""}el listado de máquinas e instalaciones críticas de MIT por sector. Tocá una máquina del listado para ver los EPP, los riesgos y las recomendaciones${conPts ? `; ${conPts} tienen puntos en el informe` : ""}.</p>
  ${PL === "G" ? `<div class="pl-aviso"><span>En General están las instalaciones del edificio. Las máquinas de producción están en Planta 1 y Planta 2.</span><button type="button" class="x-btn" data-pl="P1">Planta 1</button><button type="button" class="x-btn" data-pl="P2">Planta 2</button></div>` : ""}
  ${det}
  <div class="x-box" style="margin-top:16px"><div class="x-bh">Listado de máquinas e instalaciones críticas<span>${esc(X().listado_rev)}</span></div>
  <div class="mq-f"><input type="search" id="mqQ" placeholder="Buscar por número o nombre (ej. 612, agujereadora)" value="${esc(MQQ)}"><div class="mq-ss"><button type="button" data-mqs="" aria-pressed="${!MQS}">Todos (${L.length})</button>${secs.map(s => `<button type="button" data-mqs="${esc(s)}" aria-pressed="${s === MQS}">${esc(s)} (${L.filter(x => x.s === s).length})</button>`).join("")}</div></div>
  <div class="mq-l">${secs.filter(s => fl.some(x => x.s === s)).map(s => `<div class="mq-sec">${esc(s)}</div>` + fl.filter(x => x.s === s).map(x => { const t = T[x.t];
    return `<details class="mq"><summary><b>${esc(x.c)}</b><span>${esc(x.m)}</span><em>${esc(t.n)}</em>${(x.pts || []).length ? `<i>${x.pts.length} punto${x.pts.length > 1 ? "s" : ""}</i>` : ""}</summary>
    <div class="mq-d"><div><h4>Riesgos</h4><ul>${liE("tipos." + x.t + ".r", t.r)}</ul></div><div><h4>EPP</h4><ul>${liE("tipos." + x.t + ".e", t.e) || "<li>No requiere</li>"}</ul></div><div><h4>Recomendaciones</h4><ul>${liE("tipos." + x.t + ".rec", t.rec)}</ul></div>${(x.pts || []).length ? `<div class="mq-pts">${ptsChips(x)}</div>` : ""}</div></details>`; }).join("")).join("") || `<div class="x-row x-m">No hay máquinas con ese criterio.</div>`}</div></div>`;
}

// ---------- normas y procedimientos ----------
function vNormas(){
  const fil = (t, xs, c) => xs.length ? `<div class="g-sec">${t}</div><div class="x-box" style="border-top:5px solid ${c}">${xs.map(x => `<div class="x-row x-cot" style="grid-template-columns:1fr 90px 220px"><div class="x-t">${E((X().normas.includes(x) ? "normas." + X().normas.indexOf(x) : "ast." + X().ast.indexOf(x)) + ".t")}</div><div class="x-m">${esc(x.a)}</div><div>${btnDl(x.k, "Descargar (PDF)")}</div></div>`).join("")}</div>` : "";
  return `<h2>Normas y procedimientos · ${esc(PNOM())}</h2><p class="x-intro">Normas internas de seguridad, análisis de seguridad de las tareas (AST) y planillas ATS de MIT.</p>
  ${comun("Las normas generales (balancines, escaleras, solventes, derrames, contratistas…) son de las dos plantas y están en General.")}
  ${fil("Normas de seguridad", X().normas.filter(enPl), "#16305A")}${fil("Análisis de seguridad de la tarea", X().ast.filter(enPl), "#00A5FF")}
  ${PL === "G" ? "" : (X().normas.filter(enPl).length + X().ast.filter(enPl).length ? "" : `<div class="x-note">No hay documentos propios de esta planta.</div>`)}`;
}

// ---------- documentación pedida ----------
function vDocs(){
  const ds = X().docs, ord = {FALTA: 0, PARCIAL: 1, CONFIRMAR: 2, NUESTRO: 3, OK: 4};
  return `<h2>Documentación pedida a MIT</h2><p class="x-intro">Lo que necesitamos de MIT para el legajo de higiene y seguridad de las dos plantas, con su estado al ${esc(X().fecha)}. Cuando manden algo, avisen desde acá: queda registrado y le llega al Lic. Marcelo Elvira.</p>
  <div class="x-box"><div class="x-row x-docs h"><span>Documento</span><span>Para qué</span><span>Estado</span><span>Situación</span><span></span></div>
  ${[...ds].sort((a, b) => ord[a.estado] - ord[b.estado]).map(d => `<div class="x-row x-docs"><div><div class="x-t">${E("docs." + ds.indexOf(d) + ".doc")}</div><div class="x-m">Lo pide: ${E("docs." + ds.indexOf(d) + ".pide")}</div></div><div class="x-m">${E("docs." + ds.indexOf(d) + ".para")}</div><div><span class="x-st ${d.estado}">${DOCST[d.estado]}</span></div><div class="x-m">${E("docs." + ds.indexOf(d) + ".sit")}</div><div>${d.estado === "OK" || d.estado === "NUESTRO" ? "" : `<button type="button" class="x-btn" data-aviso="${esc(d.doc)}">Avisar que lo envié</button>`}</div></div>`).join("")}</div>`;
}

// ---------- descargas: cada archivo dice si es de P1, de P2 o de las dos ----------
function vDl(){
  const x = X(), ok = pl => PL === "G" || pl === PL || pl === "G";
  const box = (t, c, ks) => ks.length ? `<div class="g-box" style="--c:${c}"><h3>${t}</h3><div class="g-list">${ks.map(([k, tx, pl]) => `<div class="g-it"><span>${plTag(pl)} ${esc(tx || nomArch(k))}</span><button type="button" class="g-btn" data-dl="${k}">${x.archivos[k].tipo === "text/html" ? "Abrir" : "Descargar"}</button></div>`).join("")}</div></div>` : "";
  const sap = ["P1", "P2"].filter(ok).flatMap(pl => x.sap[pl].archivos.map(k => [k, "", pl]));
  const est = x.estudios.filter(s => ok(s.pl)).flatMap(s => s.archivos.map(k => [k, T("estudios." + x.estudios.indexOf(s) + ".estudio") + " · " + s.fecha, s.pl]));
  const cap = [["prog", "Programa de capacitación 2026", "G"]].concat(x.cap.constancias.filter(c => ok(c.pl)).map(c => [c.k, c.t, c.pl]));
  const form = ["P1", "P2"].filter(ok).map(pl => [pl.toLowerCase() + "-epp299", "Constancia de entrega de EPP (Res. SRT 299/11)", pl]).concat([["forrh05", "Registro de capacitación FOR-RH-05", "G"]]);
  const nor = x.normas.filter(n => ok(n.pl)).concat(x.ast.filter(n => ok(n.pl))).map(n => [n.k, n.t, n.pl]);
  const maq = x.destacadas.filter(d => ok(d.pl)).map(d => [d.sim, d.nombre + " · simulador", d.pl]);
  return `<h2>Descargas · ${esc(PNOM())}</h2><p class="x-intro">${E("ui.dl.intro", "Todo para bajar, agrupado por tipo. Cada archivo indica si es de Planta 1 (P1), de Planta 2 (P2) o de las dos (P1 y P2).")}</p>
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="g-row">${box("Sistema de Autoprotección", "#16305A", sap)}${box("Estudios", "#0060B4", est)}${box("Capacitación", "#8A5A12", cap)}${box("Formularios para completar", "#2F7D4A", form)}${box("Normas y procedimientos", "#00A5FF", nor)}${box("Máquinas", "#6E1E2E", maq)}</div>`;
}
function renderExtra(){
  $("vExtra").innerHTML = pubCtl(TAB) + ({informe: vInfG, sap: vSap, hys: vHys, cap: vCap, epp: vEpp, maq: vMaq, normas: vNormas, docs: vDocs, dl: vDl})[TAB]();
  if (EDIT) $("vExtra").querySelectorAll("[data-ed]").forEach(e => e.contentEditable = "true");
}

function abrirAviso(doc){
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="avT" style="width:min(560px,100%)"><div class="cab"><h3 id="avT">Avisar que se envió</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="form"><label>Documento</label><input type="text" value="${esc(doc)}" readonly id="avD"></div>
    <div class="form"><label for="avC">Comentario (opcional)</label><textarea id="avC" rows="2" placeholder="Por dónde se mandó, si falta algo…"></textarea></div>
    <span class="aviso">Se guarda a nombre de <b>${esc(quien())}</b>.</span>
    <div style="display:flex;gap:10px"><button class="btn prim" type="button" id="avEnv">Avisar</button></div></div></div>`;
  $("velo").hidden = false;
}
async function enviarAviso(){
  const q = quien(); setQuien(q); $("avEnv").disabled = true;
  const r = await enviar({tipo: "documento", sector: $("avD").value, texto: $("avC").value.trim(), quien: q});
  if (!r.ok){ toast("No se pudo enviar. Probá de nuevo."); $("avEnv").disabled = false; return; }
  $("velo").hidden = true; toast("Aviso enviado. Gracias.");
}
document.addEventListener("click", e => {
  if (EDIT && e.target.closest("[data-ed]")) return;   // editando: el clic es para escribir
  const t = e.target.closest("[data-tab],[data-dl],[data-dlsel],[data-maq],[data-aviso],[data-pl],[data-mqs],[data-irpt],[data-pub],[data-editar],[data-prop],[data-subir],[data-cdl],#avEnv,#ppEnv,#suEnv"); if (!t) return;
  if (t.dataset.pub){ const k = t.dataset.pub, on = !pubOn(k); PUB = PUB || {}; PUB[k] = on; enviar({tipo: "publicar", seccion: k, on}).then(r => toast(r.ok ? (on ? "Sección publicada" : "Sección sacada de la publicación") : "No se pudo guardar")); solapas(); if (!$("vExtra").hidden) renderExtra(); return; }
  if (t.dataset.editar){ EDIT = !EDIT; document.body.classList.toggle("editando", EDIT); aplicarPlanta(); toast(EDIT ? "Tocá cualquier texto con borde punteado y escribí. Se guarda al salir del texto." : "Edición terminada"); return; }
  if (t.dataset.prop){ abrirProp(+t.dataset.prop); return; }
  if (t.dataset.subir){ abrirSubir(); return; }
  if (t.dataset.cdl !== undefined){ bajarSubida(t.dataset.cdl, t.dataset.cnom); return; }
  if (t.id === "ppEnv"){ enviarProp(+t.dataset.pi); return; }
  if (t.id === "suEnv"){ enviarSubir(); return; }
  if (t.dataset.pl !== undefined && t.dataset.pl){ if (t.dataset.pl !== PL){ PL = t.dataset.pl; if (TAB === "informe" && PL !== "G"){} aplicarPlanta(); } return; }
  if (t.dataset.dlsel){ bajarArch($("sel-" + t.dataset.dlsel).value); return; }
  if (t.dataset.tab) irA(t.dataset.tab);
  else if (t.dataset.dl) bajarArch(t.dataset.dl);
  else if (t.dataset.maq){ MAQ = t.dataset.maq; renderExtra(); }
  else if (t.dataset.mqs !== undefined){ MQS = t.dataset.mqs; renderExtra(); }
  else if (t.dataset.irpt){ const [c, n] = t.dataset.irpt.split("|"), pl = c.split(" ")[1]; if (pl !== PL){ PL = pl; TAB = "informe"; aplicarPlanta(); } else irA("informe"); setTimeout(() => abrir(Number(n)), 50); }
  else if (t.dataset.aviso) abrirAviso(t.dataset.aviso);
  else if (t.id === "avEnv") enviarAviso();
});
document.addEventListener("focusin", e => { const d = e.target.closest && e.target.closest("[data-ed]"); if (d) d.dataset.antes = d.innerText; });
document.addEventListener("focusout", async e => {
  const d = e.target.closest && e.target.closest("[data-ed]"); if (!d || !EDIT) return;
  const v = d.innerText.replace(/\s+\n/g, "\n").trim(); if (v === (d.dataset.antes || "").trim()) return;
  TXT[d.dataset.ed] = v; const r = await enviar({tipo: "textos", clave: d.dataset.ed, texto: v});
  toast(r.ok ? "Texto guardado" : "No se pudo guardar el texto");
});
document.addEventListener("keydown", e => { if (EDIT && e.key === "Enter" && !e.shiftKey && e.target.closest && e.target.closest("[data-ed]")){ e.preventDefault(); e.target.blur(); } });
document.addEventListener("input", e => { if (e.target.id === "mqQ"){ MQQ = e.target.value; const p = e.target.selectionStart; renderExtra(); const q = $("mqQ"); q.focus(); q.setSelectionRange(p, p); } });

// ---------- estado de situación general a demanda (por planta o las dos) ----------
const ESG_COL = {FALTA: "#C0392B", PARCIAL: "#B7791F", CONFIRMAR: "#555B66", NUESTRO: "#0060B4", OK: "#2E7D32", EJECUTADO: "#2E7D32", VIGENTE: "#2E7D32", VENCIDO: "#C0392B", "EN CURSO": "#B7791F", APROBADO: "#2E7D32"};
const ESG_LBL = {FALTA: "FALTA", PARCIAL: "PARCIAL", CONFIRMAR: "A CONFIRMAR", NUESTRO: "LO HACEMOS NOSOTROS", OK: "PRESENTADO"};
let ESG_FIRMA = "";
function esgDoc(gen, cual){
  const x = X(), g = x.esg, pls = cual === "AMBAS" ? ["P1", "P2"] : [cual], d = v => v || "—";
  const stl = (s, l) => `<b style="color:${ESG_COL[s] || "#333"};font-size:8pt">${esc(l || s)}</b>`;
  const tabla = pl => { const m = mesesPl(pl)[0], est = p => ultEstado(m, p) || "Pendiente";
    const f = m.temas.map(t => { const ps = m.puntos.filter(p => p.tema === t.key), c = fn => ps.filter(fn).length; return {n: t.nombre, t: ps.length, cu: c(p => est(p) === "En curso"), li: c(p => est(p) === "Listo para verificar"), re: c(p => est(p) === "Resuelto")}; }).filter(r => r.t).sort((a, b) => b.t - a.t);
    const tot = k => f.reduce((s, r) => s + r[k], 0);
    return `<table class="esg-t"><thead><tr><th>${esc(x.plantas[pl].nombre)} · tema</th><th>Puntos</th><th>En curso</th><th>Listos para verificar</th><th>Resueltos</th></tr></thead><tbody>
    ${f.map(r => `<tr><td>${esc(r.n)}</td><td class="c"><b>${r.t}</b></td><td class="c">${d(r.cu)}</td><td class="c">${d(r.li)}</td><td class="c">${d(r.re)}</td></tr>`).join("")}
    <tr class="tot"><td>Total</td>${["t", "cu", "li", "re"].map(k => `<td class="c">${tot(k)}</td>`).join("")}</tr></tbody></table>`; };
  const ests = x.estudios.filter(s => s.pl === "G" || pls.includes(s.pl));
  return `<table class="esg-pg"><tbody><tr><td>
  <div class="esg-mem"><b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo</span><small>M.P. 0656 C.P.I.I. · 15-4564-6462 · marcelo.a.elvira@gmail.com</small></div>
  <h1>Estado de situación general${pls.length === 1 ? " · " + esc(x.plantas[pls[0]].nombre) : ""}</h1>
  <div class="esg-fe">Higiene y Seguridad en el Trabajo · última actualización: ${esc(x.fecha)} · <b>informe generado el ${esc(gen)}</b></div>
  <table class="esg-t esg-dat"><tr><th>Cliente</th><td>${esc(g.razon)}</td><th>CUIT</th><td>${esc(g.cuit)}</td></tr>
  ${pls.map(pl => `<tr><th>${esc(x.plantas[pl].nombre)}</th><td>${esc(x.plantas[pl].dom)}, ${esc(x.plantas[pl].barrio)}, C.A.B.A.</td><th>Encuadre</th><td>${esc(g.encuadre[pl])}</td></tr>`).join("")}</table>
  <div class="esg-bar">1. SISTEMA DE AUTOPROTECCIÓN</div>
  <table class="esg-t"><thead><tr><th>Planta</th><th>Expediente</th><th>Estado</th><th>Próximo simulacro</th><th>Vencimiento anual</th></tr></thead><tbody>
  ${pls.map(pl => { const s = x.sap[pl], pr = s.hitos.find(h => !h.ok && h.sim); return `<tr><td><b>${esc(x.plantas[pl].nombre)}</b><small>${esc(s.grupo)}</small></td><td>${esc(s.exp)}<small>${esc(s.disp)} del ${esc(s.disp_fecha)}</small></td><td>${stl(s.estado)}</td><td>${pr ? fISO(pr.f) + "<small>" + esc(pr.t) + "</small>" : "Se fijan al renovar"}</td><td>${fISO(s.vig_anual)}<small>${falta(s.vig_anual)}</small></td></tr>`; }).join("")}</tbody></table>
  <div class="esg-bar">2. PUNTOS DEL INFORME DE VISITA ${esc(mesesPl("P1")[0].etq)} POR TEMA</div>
  ${pls.map(tabla).join('<div style="height:6px"></div>')}
  <p class="esg-n">El detalle de cada punto, con sus fotos y la acción a realizar, está en el informe de visita ${esc(mesesPl("P1")[0].etq)} y en el portal. El avance es el cargado en el portal al momento de generar este informe.</p>
  <div class="esg-bar">3. ESTUDIOS DE HIGIENE Y SEGURIDAD</div>
  <table class="esg-t"><thead><tr><th style="width:44%">Estudio</th><th style="width:18%">Fecha</th><th style="width:18%">Vigencia</th><th>Estado</th></tr></thead><tbody>
  ${ests.map(s => { const i = x.estudios.indexOf(s), [st, ve] = estEst(s); return `<tr><td><b>${esc(T("estudios." + i + ".estudio"))}</b><small>${esc(T("estudios." + i + ".norma"))}</small></td><td>${esc(T("estudios." + i + ".fecha"))}</td><td>${esc(T("estudios." + i + ".vigencia"))}</td><td>${stl(st, st === "EN CURSO" ? "EN PREPARACIÓN" : st)}${ve ? "<small>" + ve + "</small>" : ""}</td></tr>`; }).join("")}</tbody></table>
  <div class="esg-bar">4. DOCUMENTACIÓN SOLICITADA A MIT</div>
  <table class="esg-t"><thead><tr><th style="width:43%">Documento</th><th style="width:15%">Estado</th><th>Situación</th></tr></thead><tbody>
  ${x.docs.map((o, i) => `<tr><td><b>${esc(T("docs." + i + ".doc"))}</b><small>Para: ${esc(T("docs." + i + ".para"))}</small></td><td>${stl(o.estado, ESG_LBL[o.estado])}</td><td>${esc(T("docs." + i + ".sit")) || "—"}</td></tr>`).join("")}</tbody></table>
  <div class="esg-fi">${ESG_FIRMA ? `<img src="${ESG_FIRMA}" alt="">` : ""}<b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo · M.P. 0656 C.P.I.I.</span></div>
  </td></tr></tbody><tfoot><tr><td><div class="esg-pie">Estado de situación general — ${esc(g.razon)} — ${pls.map(pl => esc(x.plantas[pl].dom)).join(" y ")}, C.A.B.A.</div></td></tr></tfoot></table>`;
}
async function imprimirEsg(){
  const cual = ($("esgPl") || {}).value || (PL === "G" ? "AMBAS" : PL);
  toast("Generando el estado de situación…");
  try { await cargarEstado(); } catch(e){}
  if (!ESG_FIRMA && X().archivos.firma){ try { const b = CIFRADO ? await bajarCifrado("arch/firma") : await (await fetch("arch/firma")).arrayBuffer(); ESG_FIRMA = URL.createObjectURL(new Blob([b], {type: X().archivos.firma.tipo})); } catch(e){} }
  const a = new Date(), dd = n => String(n).padStart(2, "0");
  const gen = `${dd(a.getDate())}/${dd(a.getMonth() + 1)}/${a.getFullYear()} a las ${dd(a.getHours())}:${dd(a.getMinutes())} h`;
  let el = $("esg"); if (!el){ el = document.createElement("div"); el.id = "esg"; document.body.appendChild(el); }
  el.innerHTML = esgDoc(gen, cual);
  const im = el.querySelector("img"); if (im){ try { await im.decode(); } catch(e){} }
  const t0 = document.title; document.title = `Estado de situación general MIT ${cual === "AMBAS" ? "Plantas 1 y 2" : X().plantas[cual].nombre} ${dd(a.getDate())}-${dd(a.getMonth() + 1)}-${String(a.getFullYear()).slice(2)}`;
  document.body.classList.add("imprimiendo-esg");
  await new Promise(r => setTimeout(r, 200));
  window.print(); document.body.classList.remove("imprimiendo-esg"); document.title = t0;
}
document.addEventListener("click", e => { if (e.target.closest("[data-esg]")) imprimirEsg(); });

// ---------- video tutorial ----------
let VID_URL = "";
async function verVideo(){
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="vdT" style="width:min(1100px,100%)"><div class="cab"><h3 id="vdT">Cómo se usa el portal</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo"><div id="vdC" class="x-m">Cargando el video…</div></div></div>`;
  $("velo").hidden = false;
  try {
    if (!VID_URL){ const b = CIFRADO ? await bajarCifrado("arch/video") : await (await fetch("arch/video")).arrayBuffer(); VID_URL = URL.createObjectURL(new Blob([b], {type: "video/mp4"})); }
    $("vdC").outerHTML = `<video id="vdV" src="${VID_URL}" controls autoplay playsinline style="width:100%;border-radius:6px;background:#000"></video>`;
  } catch(e){ $("vdC").textContent = "No se pudo cargar el video."; }
}
new MutationObserver(() => { const v = document.getElementById("vdV"); if (v && $("velo").hidden) v.pause(); }).observe(document.getElementById("velo") || document.body, {attributes: true, attributeFilter: ["hidden"]});
document.addEventListener("click", e => { if (e.target.closest("[data-video]")) verVideo(); });

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {inicio: plantaInicial, estado: mitEstado, subt: () => PNOM() + " · "});
