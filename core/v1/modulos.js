// Portales de clientes · módulos comunes (core/v1/modulos.js) · bloques 1 a 4, 15/11/2026
// Se carga después de portal.js y antes de cliente.js, en los portales con "modulos_js": true en su ficha.
// Trae lo que es igual en todos: textos editables, publicación por sección, descargas, subir constancia, proponer fecha, avisos y video (bloque 1),
// y las vistas Capacitación, EPP, «Ante una inspección» y el Estado de situación general, con sus textos como opciones (bloque 2),
// y Autoprotección (en trámite / vigente) y Estudios con matafuegos (tarjetas / tabla por piso), donde la variante sale del dato (bloque 3),
// y Descargas, con las cajas y la lista de informes como datos (bloque 4).
// Lo propio de cada cliente:
//   · MOD   → opciones; su cliente.js las completa con Object.assign(MOD, {...})
//   · una function con el mismo nombre en cliente.js pisa la de acá (MIT lo hace con las que llevan el selector de planta).
//     Sólo con function: un const o let repetido rompe la página entera.
//   · cliente.js define TABS, TAB y PL, que acá se usan al ejecutar.
const MOD = {
  archPref: null,                 // qué se le saca al nombre de un archivo para mostrarlo; por defecto «<nombre del cliente> - »
  propHorario: "16:00 a 16:45",   // ejemplo de horario al proponer la fecha de una capacitación
  quien: "la empresa",            // «Ante una inspección»: quién guarda los documentos («el local», «la empresa»)
  delLugar: "de la planta",       // «del local» / «de la planta», en EPP, Estudios y Autoprotección
  sapEncuadre: "",                // Autoprotección en trámite: aclaración debajo del encuadre (por ejemplo «con el subsuelo en uso»)
  capTitulo: "Programa de capacitación", capProg: null,   // Capacitación: título del cuadro y, si hay, [clave del archivo, texto] del programa en PDF
  capCuando: "Mes",               // … encabezado de la primera columna
  capReg: false,                  // … nota final con la constancia SAP para completar
  capIntro: "Programa anual: se puede proponer la fecha y el horario de cada charla. Abajo, las constancias firmadas; también se pueden subir desde acá.",
  esgAltas: ["Alta"], esgAltasTxt: "Prioridad alta",      // Estado de situación: qué prioridades cuenta la columna y cómo se llama
  esgPieNombre: false,            // … pie con «(nombre del cliente)» después de la razón social
  informes: null,                 // Descargas: lista de informes [[clave, texto]…]; sin esto salen los archivos guardados en pdf/
  descargas: null,                // … cajas [{t, c, de}]; ver dlCajas()
  vistas: null,                   // solapas propias del cliente: {clave: función que devuelve el HTML}
  esgCol: {FALTA: "#C0392B", TRAMITE: "#B7791F", LOCAL: "#555B66", PORTAL: "#2E7D32", EJECUTADO: "#2E7D32", VIGENTE: "#2E7D32", VENCIDO: "#C0392B", PENDIENTE: "#B7791F", "EN PREPARACIÓN": "#B7791F"}   // … color de cada estado
};

// ---------- Opciones y estado ----------
const X = () => DATA.extra;
let TXT = {}, PUB = null, CONST_UP = [], PROPS = [], EDIT = false;
const PUB_DEF = {informe: true};                       // hasta que el Lic. publique otras secciones, el cliente ve sólo el informe
const pubOn = k => PUB && PUB[k] !== undefined ? PUB[k] : !!PUB_DEF[k];
const tabsVis = () => TABS.filter(([k]) => ADMIN || pubOn(k));
const getP = path => path.split(".").reduce((o, k) => o == null ? o : o[k], DATA.extra);
const T = (k, def) => TXT[k] !== undefined ? TXT[k] : (def !== undefined ? def : getP(k));
const E = (k, def) => `<span data-ed="${esc(k)}">${esc(T(k, def) ?? "")}</span>`;   // texto que el Lic. puede editar desde la página
function PNOM(){ return CFG.nombre; }
const fISO = s => { const [a, m, d] = s.split("-"); return `${d}/${m}/${a}`; };
const dias = s => Math.round((new Date(s + "T12:00:00") - new Date(new Date().toDateString() + " 12:00")) / 864e5);
const falta = s => { const d = dias(s); return d > 1 ? `faltan ${d} días` : d === 1 ? "mañana" : d === 0 ? "hoy" : `hace ${-d} días`; };
const estEst = s => { if (s.estado !== "EJECUTADO") return [s.estado, ""]; if (!s.meses || !s.iso) return ["VIGENTE", ""];
  const d = new Date(s.iso + "T12:00:00"); d.setMonth(d.getMonth() + s.meses); const iso = d.toISOString().slice(0, 10);
  return [dias(iso) < 0 ? "VENCIDO" : "VIGENTE", "vence el " + fISO(iso)]; };

// ---------- Estado que llega de la planilla, barra de herramientas, solapas y publicación por sección ----------
function modEstado(j){
  TXT = j.textos || TXT; PUB = j.publicacion || PUB || {}; CONST_UP = j.constancias || []; PROPS = j.propuestas || [];
  barra(); solapas(); if (!tabsVis().some(t => t[0] === TAB)){ irA(tabsVis()[0][0]); return; }
  if (!$("vExtra").hidden) renderExtra();
}
function modInicio(){ barra(); }
function barra(){   // barra de herramientas: video (si está publicado) y edición de textos (sólo admin)
  const b = (X().archivos.video && (ADMIN || pubOn("video")) ? `<button type="button" class="pl-vid" data-video="1"><b>▶ Cómo se usa</b><span>Video de 2 minutos</span></button>` : "")
    + (ADMIN ? `<button type="button" class="pl-ed${EDIT ? " on" : ""}" data-editar="1"><b>✏ ${EDIT ? "Terminar de editar" : "Editar textos"}</b><span>${EDIT ? "Tocá un texto y escribí" : "Sólo el Lic. Elvira"}</span></button>` : "");
  $("plantasW").innerHTML = b; $("plantas").hidden = !b;
}
function solapas(){
  const pend = X().insp.flatMap(g => g.items).filter(d => d.estado === "FALTA").length;
  $("solapasW").innerHTML = tabsVis().map(([k, t]) => `<button type="button" data-tab="${k}" aria-pressed="${k === TAB}"${ADMIN && !pubOn(k) ? ` class="wip" title="En revisión: ${esc(CFG.nombre)} no la ve"` : ""}>${ADMIN && !pubOn(k) ? "🚧 " : ""}${t}${k === "insp" && pend ? `<i>${pend}</i>` : ""}${k === "informe" ? `<i>${DATA.meses[0].puntos.length}</i>` : ""}</button>`).join("");
  const pi = $("pubInf"); if (pi) pi.innerHTML = ADMIN ? pubCtl("informe") : "";
}
function pubCtl(k){ return ADMIN ? `<div class="pub ${pubOn(k) ? "on" : ""}"><span>${pubOn(k) ? `✔ Sección publicada: ${esc(CFG.nombre)} la ve` : `🚧 En revisión: ${esc(CFG.nombre)} todavía no la ve`}</span><button type="button" class="x-btn" data-pub="${k}">${pubOn(k) ? "Sacar de la publicación" : "Publicar esta sección"}</button></div>` : ""; }
function irA(k){
  TAB = k; solapas();
  const extra = k !== "informe";
  document.body.classList.toggle("extra", extra);
  $("vInforme").hidden = extra; $("vExtra").hidden = !extra;
  if (extra){ renderExtra(); $("subt").textContent = `${X().local.dom} · ${X().local.barrio}`; } else render();
  scrollTo({top: 0});
}

// ---------- Descargas ----------
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
function nomArch(k){ return X().archivos[k].nombre.replace(MOD.archPref || new RegExp("^" + CFG.nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " - "), "").replace(/\.(pdf|html|xlsx?|jpg)$/, ""); }
function btnDl(k, txt){ return `<button type="button" class="x-btn" data-dl="${k}">${X().archivos[k].tipo === "text/html" ? "▶" : "↓"} ${esc(txt || nomArch(k))}</button>`; }
function grupoEsg(){
  return `<div class="g-box" style="--c:var(--gold-dk)"><h3>Estado de situación general</h3><span class="x-m">Se genera en el momento, con lo último cargado en el portal</span>
  <div class="g-sel"><button type="button" class="g-btn" data-esg="1">Generar e imprimir</button></div></div>`;
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

// ---------- Proponer fecha de una capacitación ----------
function abrirProp(i){
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="ppT" style="width:min(560px,100%)"><div class="cab"><h3 id="ppT">Proponer fecha · ${esc(T("cap.prog." + i + ".tema"))}</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="dos"><div class="form"><label for="ppF1">Fecha propuesta</label><input type="date" id="ppF1"></div><div class="form"><label for="ppF2">Otra fecha posible (opcional)</label><input type="date" id="ppF2"></div></div>
    <div class="form"><label for="ppH">Horario</label><input type="text" id="ppH" placeholder="por ejemplo: ${esc(MOD.propHorario)}"></div>
    <div class="form"><label for="ppC">Comentario (opcional)</label><textarea id="ppC" rows="2" placeholder="Turno, cantidad de personas…"></textarea></div>
    <span class="aviso">Se guarda a nombre de <b>${esc(quien())}</b> y le llega al Lic. Marcelo Elvira para confirmarla.</span><span class="err" id="ppE"></span>
    <div style="display:flex;gap:10px"><button class="btn prim" type="button" id="ppEnv" data-pi="${i}">Enviar propuesta</button></div></div></div>`;
  $("velo").hidden = false;
}
async function enviarProp(i){
  const f = [$("ppF1").value, $("ppF2").value].filter(Boolean).map(x => fISO(x)), h = $("ppH").value.trim();
  if (!f.length){ $("ppE").textContent = "Elegí al menos una fecha."; return; }
  $("ppEnv").disabled = true;
  const ev = {tipo: "propuesta", cap: T("cap.prog." + i + ".tema"), planta: "G", fechas: f.join(" o "), horario: h, texto: $("ppC").value.trim(), quien: quien()};
  const r = await enviar(ev);
  if (!r.ok){ toast("No se pudo enviar. Probá de nuevo."); $("ppEnv").disabled = false; return; }
  PROPS.push({tema: ev.cap, planta: "G", fechas: ev.fechas, horario: h, comentario: ev.texto, quien: ev.quien, estado: "Propuesta", cargada: fISO(new Date().toISOString().slice(0, 10))});
  $("velo").hidden = true; toast("Propuesta enviada. Gracias."); renderExtra();
}

// ---------- Subir una constancia de capacitación (modo "cap") o un documento de «Ante una inspección» (modo = nombre del documento) ----------
function abrirSubir(modo){
  const esCap = modo === "cap", temas = X().cap.prog.map((p, i) => T("cap.prog." + i + ".tema"));
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="suT" style="width:min(560px,100%)"><div class="cab"><h3 id="suT">${esCap ? "Subir constancia de capacitación" : "Subir documento"}</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    ${esCap ? `<div class="form"><label for="suC">Capacitación</label><select id="suC">${temas.map(t => `<option>${esc(t)}</option>`).join("")}<option value="">Otra…</option></select><input type="text" id="suO" placeholder="Nombre de la capacitación" hidden></div>`
      : `<div class="form"><label>Documento</label><input type="text" id="suC" value="${esc(modo)}" readonly></div>`}
    <div class="form"><label for="suF">${esCap ? "Fecha de la charla" : "Fecha del documento o vencimiento (opcional)"}</label><input type="date" id="suF"></div>
    <div class="form"><label for="suA">Archivo (PDF o foto, hasta 15 MB)</label><input type="file" id="suA" accept="application/pdf,image/*"></div>
    <span class="aviso">Se guarda a nombre de <b>${esc(quien())}</b> y le llega al Lic. Marcelo Elvira.</span><span class="err" id="suE"></span>
    <div style="display:flex;gap:10px"><button class="btn prim" type="button" id="suEnv" data-modo="${esc(modo)}">Subir</button></div></div></div>`;
  $("velo").hidden = false;
  if (esCap) $("suC").onchange = () => { $("suO").hidden = !!$("suC").value; };
}
async function enviarSubir(modo){
  const esCap = modo === "cap", a = $("suA").files[0], cap = esCap ? ($("suC").value || $("suO").value.trim()) : "Ante una inspección · " + modo;
  if (!cap){ $("suE").textContent = "Indicá la capacitación."; return; }
  if (!a){ $("suE").textContent = "Elegí el archivo."; return; }
  if (a.size > 15 * 1024 * 1024){ $("suE").textContent = "El archivo pesa más de 15 MB."; return; }
  $("suEnv").disabled = true; $("suE").textContent = "Subiendo…";
  const url = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = mal; r.readAsDataURL(a); });
  const ev = {tipo: "constancia", cap, planta: "G", fecha: $("suF").value ? fISO($("suF").value) : "", nombre: a.name, archivo: url, quien: quien()};
  const r = await enviar(ev);
  if (!r.ok){ $("suE").textContent = "No se pudo subir. Probá de nuevo."; $("suEnv").disabled = false; return; }
  CONST_UP.push({id: r.id || "", planta: "G", cap, fecha: ev.fecha, nombre: a.name, quien: ev.quien, subida: fISO(new Date().toISOString().slice(0, 10))});
  $("velo").hidden = true; toast(esCap ? "Constancia subida. Gracias." : "Documento subido. Gracias."); renderExtra();
}

// ---------- Avisar que se envió un documento ----------
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

// ---------- Edición de textos (sólo admin): se guarda al salir del texto ----------
document.addEventListener("focusin", e => { const d = e.target.closest && e.target.closest("[data-ed]"); if (d) d.dataset.antes = d.innerText; });
document.addEventListener("focusout", async e => {
  const d = e.target.closest && e.target.closest("[data-ed]"); if (!d || !EDIT) return;
  const v = d.innerText.replace(/\s+\n/g, "\n").trim(); if (v === (d.dataset.antes || "").trim()) return;
  TXT[d.dataset.ed] = v; const r = await enviar({tipo: "textos", clave: d.dataset.ed, texto: v});
  toast(r.ok ? "Texto guardado" : "No se pudo guardar el texto");
});
document.addEventListener("keydown", e => { if (EDIT && e.key === "Enter" && !e.shiftKey && e.target.closest && e.target.closest("[data-ed]")){ e.preventDefault(); e.target.blur(); } });

// ---------- Estado de situación (la firma se baja una sola vez) y video «Cómo se usa» ----------
let ESG_FIRMA = "";
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

// ---------- Capacitación ----------
function vCap(){
  const c = X().cap, props = i => PROPS.filter(p => p.tema === T("cap.prog." + i + ".tema"));
  const prog = `<div class="x-box"><div class="x-bh">${E("ui.cap.prog", MOD.capTitulo)}${MOD.capProg ? `<span>${btnDl(MOD.capProg[0], MOD.capProg[1]).replace('class="x-btn"', 'class="x-btn x-inv"')}</span>` : ""}</div>
    <div class="x-row x-cap h"><span>${esc(MOD.capCuando)}</span><span>Tema</span><span>Destinado a</span><span>Fecha a coordinar</span></div>
    ${c.prog.map((p, i) => `<div class="x-row x-cap"><b>${E("cap.prog." + i + ".mes")}</b><span>${E("cap.prog." + i + ".tema")}</span><span class="x-m">${E("cap.prog." + i + ".para")}</span>
      <div>${props(i).map(q => `<div class="prop"><b>${esc(q.fechas)}${q.horario ? " · " + esc(q.horario) : ""}</b><span>propuso ${esc(q.quien)} el ${esc(q.cargada)}${q.estado && q.estado !== "Propuesta" ? " · " + esc(q.estado) : ""}</span></div>`).join("")}
      <button type="button" class="x-btn" data-prop="${i}">📅 Proponer fecha y horario</button></div></div>`).join("")}</div>`;
  const subidas = CONST_UP.filter(x => !x.doc && !/^Ante una inspección/.test(x.cap)).map(x => ({t: x.cap + (x.fecha ? " · " + x.fecha : ""), btn: `<button type="button" class="x-btn" data-cdl="${esc(x.id)}" data-cnom="${esc(x.nombre)}">↓ ${esc(x.nombre)}</button>`, sub: `Subida por ${x.quien} el ${x.subida}`}));
  const lista = c.constancias.map(x => ({t: x.t, btn: btnDl(x.k, "Constancia (PDF)"), sub: "Cargada por el Lic. Marcelo Elvira"})).concat(subidas);
  const cons = `<div class="g-sec">Constancias de capacitación</div>
  <div class="x-box">${lista.length ? lista.map(x => `<div class="x-row x-cot" style="grid-template-columns:1fr 280px"><div><div class="x-t">${esc(x.t)}</div><div class="x-m">${esc(x.sub)}</div></div><div>${x.btn}</div></div>`).join("") : `<div class="x-row x-m">Todavía no hay constancias cargadas.</div>`}
  <div class="x-row" style="background:var(--crema)"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="x-btn p" data-subir="cap">⬆ Subir una constancia de capacitación</button><span class="x-m">PDF o foto de la planilla firmada. Le llega al Lic. Marcelo Elvira y queda acá.</span></div></div></div>`;
  const reg = !MOD.capReg ? "" : `<div class="x-note"><span style="flex:1;min-width:240px">${E("ui.cap.reg", "Planilla de asistencia de la capacitación del Sistema de Autoprotección, para completar el día de la charla: rol, horario, nombre y apellido, DNI y firma.")}</span>${btnDl("cons-sap", "Constancia SAP para completar (PDF)")}</div>`;
  return `<h2>Capacitación</h2><p class="x-intro">${E("ui.cap.intro", MOD.capIntro)}</p>${prog}${cons}${reg}`;
}

// ---------- EPP ----------
function vEpp(){
  const ss = X().sect, es = X().epp;
  return `<h2>Elementos de protección personal</h2><p class="x-intro">${E("ui.epp.intro", "Dónde hay que usar cada elemento, por sector " + MOD.delLugar + ".")}</p>
  <div class="x-box"><div class="x-bh">${esc(CFG.nombre)}<span>elemento por sector</span></div><div class="x-mxw"><table class="x-mx"><tr><th style="width:28%">Elemento</th>${ss.map(x => `<th>${esc(x)}</th>`).join("")}</tr>
  ${es.map((e, i) => `<tr><td><b>${E("epp." + i + ".elem")}</b><div class="x-m">${E("epp." + i + ".det")}</div></td>${ss.map((_, j) => e.s.includes(j) ? `<td><span class="x-dot" title="Se usa"></span></td>` : `<td class="x-no">—</td>`).join("")}</tr>`).join("")}</table></div></div>
  <div class="x-cards">${es.map((e, i) => `<div class="x-card"><b>${E("epp." + i + ".elem")}</b><span class="x-m">${E("epp." + i + ".cuando")}</span></div>`).join("")}</div>
  <div class="x-note"><span style="flex:1;min-width:240px">${E("epp_nota")}</span>${btnDl("epp299", "Constancia de entrega de EPP (Excel)")}</div>`;
}

// ---------- Ante una inspección ----------
const INSST = {PORTAL: "Está en el portal", get LOCAL(){ return "Lo guarda " + MOD.quien; }, FALTA: "Falta", TRAMITE: "En trámite"};   // estados de «Ante una inspección»
function vInsp(){
  const gs = X().insp, todos = gs.flatMap(g => g.items), cnt = k => todos.filter(d => d.estado === k).length;
  const sub = doc => CONST_UP.filter(x => x.cap === "Ante una inspección · " + doc);
  const item = (g, gi, d, i) => { const p = `insp.${gi}.items.${i}`, ups = sub(d.doc);
    return `<div class="x-row lt-ins"><div><div class="x-t">${E(p + ".doc")}</div><div class="x-m">${E(p + ".sit")}</div>
      ${ups.length ? `<div class="lt-ups">${ups.map(x => `<button type="button" class="x-btn" data-cdl="${esc(x.id)}" data-cnom="${esc(x.nombre)}">↓ ${esc(x.nombre)}</button><span class="x-m">subido por ${esc(x.quien)} el ${esc(x.subida)}${x.fecha ? " · " + esc(x.fecha) : ""}</span>`).join("")}</div>` : ""}</div>
      <div><span class="x-st ${d.estado}">${INSST[d.estado]}</span></div>
      <div class="x-dl">${d.k.map(k => btnDl(k, d.k.length > 1 ? nomArch(k).replace(/^SAP - /, "") : "Descargar")).join("")}${d.estado !== "PORTAL" ? `<button type="button" class="x-btn" data-subir="${esc(d.doc)}">⬆ Subir</button>` : ""}</div></div>`; };
  return `<h2>Ante una inspección</h2><p class="x-intro">${E("ui.insp.intro", "Todo lo que conviene tener a mano si llega un inspector, agrupado según quién suele pedirlo. Lo que dice «Está en el portal» se baja desde acá, incluso desde el celular. Lo que guarda " + MOD.quien + " se puede subir acá para tenerlo todo junto.")}</p>
  <div class="lt-sum"><div class="ok"><b>${cnt("PORTAL")}</b><span>en el portal</span></div><div class="lo"><b>${cnt("LOCAL")}</b><span>los guarda ${esc(MOD.quien)}</span></div><div class="tr"><b>${cnt("TRAMITE")}</b><span>en trámite</span></div><div class="fa"><b>${cnt("FALTA")}</b><span>faltan</span></div></div>
  <div class="lt-guia"><h3>${E("ui.insp.guia", "Si llega un inspector")}</h3><ol>${X().guia.map((g, i) => `<li>${E("guia." + i)}</li>`).join("")}</ol>
  <a class="x-btn p" href="tel:+5491145646462">📞 Llamar al Lic. Marcelo Elvira · 15-4564-6462</a></div>
  ${gs.map((g, gi) => `<div class="g-sec">${E("insp." + gi + ".t")} <span class="lt-quien">${E("insp." + gi + ".quien")}</span></div><div class="x-box lt-g-${g.g}">${g.items.map((d, i) => item(g, gi, d, i)).join("")}</div>`).join("")}`;
}

// ---------- Estado de situación general a demanda (MIT tiene el suyo, por planta) ----------
function esgDoc(gen){
  const x = X(), g = x.esg, d = v => v || "—", m = DATA.meses[0], s = x.sap;
  const stl = (st, l) => `<b style="color:${MOD.esgCol[st] || "#333"};font-size:8pt">${esc(l || st)}</b>`;
  const est = p => ultEstado(m, p) || "Pendiente";
  const f = m.temas.map(t => { const ps = m.puntos.filter(p => p.tema === t.key), c = fn => ps.filter(fn).length; return {n: t.nombre, t: ps.length, al: c(p => MOD.esgAltas.includes(p.prio)), cu: c(p => est(p) === "En curso"), li: c(p => est(p) === "Listo para verificar"), re: c(p => est(p) === "Resuelto")}; }).filter(r => r.t);
  const tot = k => f.reduce((a, r) => a + r[k], 0);
  return `<table class="esg-pg"><tbody><tr><td>
  <div class="esg-mem"><b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo</span><small>M.P. 0656 C.P.I.I. · 15-4564-6462 · marcelo.a.elvira@gmail.com</small></div>
  <h1>Estado de situación general</h1>
  <div class="esg-fe">Higiene y Seguridad en el Trabajo · última actualización: ${esc(x.fecha)} · <b>informe generado el ${esc(gen)}</b></div>
  <table class="esg-t esg-dat"><tr><th>Cliente</th><td>${esc(g.razon)} · ${esc(g.establecimiento)}</td><th>CUIT</th><td>${esc(g.cuit)}</td></tr>
  <tr><th>Domicilio</th><td>${esc(x.local.dom)}, ${esc(x.local.barrio)}, C.A.B.A.</td><th>Encuadre</th><td>${esc(g.encuadre)}</td></tr></table>
  <div class="esg-bar">1. SISTEMA DE AUTOPROTECCIÓN</div>
  ${esgSap(s, stl)}
  <div class="esg-bar">2. PUNTOS DEL INFORME DE VISITA ${esc(m.etq)} POR TEMA</div>
  <table class="esg-t"><thead><tr><th>Tema</th><th>Puntos</th><th>${esc(MOD.esgAltasTxt)}</th><th>En curso</th><th>Listos para verificar</th><th>Resueltos</th></tr></thead><tbody>
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
  </td></tr></tbody><tfoot><tr><td><div class="esg-pie">Estado de situación general — ${esc(g.razon)}${MOD.esgPieNombre ? " (" + esc(CFG.nombre) + ")" : ""} — ${esc(x.local.dom)}, C.A.B.A.</div></td></tr></tfoot></table>`;
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
  const t0 = document.title; document.title = `Estado de situación general ${CFG.nombre} ${dd(a.getDate())}-${dd(a.getMonth() + 1)}-${String(a.getFullYear()).slice(2)}`;
  document.body.classList.add("imprimiendo-esg");
  await new Promise(r => setTimeout(r, 200));
  window.print(); document.body.classList.remove("imprimiendo-esg"); document.title = t0;
}
document.addEventListener("click", e => { if (e.target.closest("[data-esg]")) imprimirEsg(); });

// ---------- Autoprotección ----------
// La variante sale del dato: con fecha de vencimiento anual (sap.vig_anual) el SAP está vigente; sin ella, en trámite.
function vSap(){ const s = X().sap; return s.vig_anual ? sapVigente(s) : sapTramite(s); }
function sapTramite(s){   // SAP todavía sin aprobar: expediente, encuadre y lo que falta para presentar
  return `<h2>Sistema de Autoprotección</h2><p class="x-intro">${E("ui.sap.intro", "En qué está el Sistema de Autoprotección " + MOD.delLugar + " ante Defensa Civil (Ley 5920/17), qué falta y quién lo hace.")}</p>
  <div class="sap-c"><div class="sap-h"><div><b>${esc(CFG.nombre)} · ${esc(X().local.dom)}</b><span>Sistema de Autoprotección · ${esc(s.grupo)} · Ley 5920/17</span></div><span class="sap-ok pe">${esc(s.estado)}</span></div>
  <div class="sap-k">
    <div><span>Expediente</span><b style="font-size:14px">${esc(s.exp)}</b><em>caratulado el ${esc(s.caratulado)}</em></div>
    <div><span>Encuadre</span><b>${esc(s.grupo)}</b><em>${esc(MOD.sapEncuadre)}</em></div>
    <div><span>Pendientes</span><b>${s.pend.length}</b><em>para presentar el SAP</em></div>
  </div>
  <div class="sap-l">${s.hitos.map((h, i) => `<div class="ok"><i></i><b>${fISO(h.f)}</b><span>${E("sap.hitos." + i + ".t")}</span></div>`).join("")}</div>
  <div class="g-sec">Lo que falta para presentar</div>
  <div class="x-box">${s.pend.map((p, i) => `<div class="x-row lt-pend"><span class="lt-n">${i + 1}</span><div><div class="x-t">${E("sap.pend." + i + ".t")}</div><div class="x-m">${E("sap.pend." + i + ".q")}</div></div><div>${p.k ? btnDl(p.k, "Planilla (Excel)") : ""}</div></div>`).join("")}</div>
  <p class="x-m" style="margin:12px 0">${E("sap.nota")}</p>
  <div class="x-dl x-dlrow">${s.archivos.map(k => btnDl(k)).join("")}</div></div>`;
}
function sapVigente(s){   // SAP aprobado: vencimiento anual, próximo simulacro y vigencia
  const prox = s.hitos.find(h => !h.ok && h.sim);
  return `<h2>Sistema de Autoprotección</h2><p class="x-intro">${E("ui.sap.intro", "Lo presentado y aprobado ante Defensa Civil, las fechas de los simulacros y del vencimiento anual, y la documentación para bajar.")}</p>
  <div class="sap-c"><div class="sap-h"><div><b>${esc(CFG.nombre)} · ${esc(X().local.dom)}</b><span>Sistema de Autoprotección · ${esc(s.grupo)}</span></div><span class="sap-ok">${esc(s.estado)}</span></div>
  <div class="sap-k">
    <div><span>Vencimiento anual</span><b>${fISO(s.vig_anual)}</b><em class="${dias(s.vig_anual) < 60 ? "pr" : ""}">${falta(s.vig_anual)}</em></div>
    <div><span>Próximo simulacro</span>${prox ? `<b>${fISO(prox.f)}</b><em>${falta(prox.f)}</em>` : `<b>—</b><em>Se fijan al renovar</em>`}</div>
    <div><span>Vigencia del SAP</span><b>${fISO(s.vig_bianual)}</b><em>${esc(s.disp)}</em></div>
  </div>
  <div class="sap-l">${s.hitos.map((h, i) => `<div class="${h.ok || dias(h.f) < 0 ? "ok" : "pe"}${h.venc ? " ve" : ""}"><i></i><b>${fISO(h.f)}</b><span>${E("sap.hitos." + i + ".t")}</span>${!h.ok && dias(h.f) >= 0 ? `<em>${falta(h.f)}</em>` : ""}</div>`).join("")}</div>
  <p class="x-m" style="margin:10px 0">Expediente ${esc(s.exp)} · aprobado el ${esc(s.disp_fecha)}. ${E("sap.nota")}</p>
  <div class="x-dl x-dlrow">${s.archivos.map(k => btnDl(k)).join("")}</div></div>`;
}
// cuadro del SAP dentro del estado de situación general
function esgSap(s, stl){ return s.vig_anual ? esgSapVigente(s, stl) : esgSapTramite(s, stl); }
function esgSapTramite(s, stl){
  return `<table class="esg-t"><thead><tr><th style="width:30%">Expediente</th><th style="width:18%">Estado</th><th>Lo que falta para presentar</th></tr></thead><tbody>
  <tr><td>${esc(s.exp)}<small>caratulado el ${esc(s.caratulado)} · ${esc(s.grupo)}</small></td><td>${stl(s.estado)}</td><td>${s.pend.map((p, i) => `${i + 1}. ${esc(T("sap.pend." + i + ".t"))} <small style="display:inline">(${esc(T("sap.pend." + i + ".q"))})</small>`).join("<br>")}</td></tr></tbody></table>`;
}
function esgSapVigente(s, stl){
  return `<table class="esg-t"><thead><tr><th>Expediente</th><th>Estado</th><th>Próximo simulacro</th><th>Vencimiento anual</th></tr></thead><tbody>
  <tr><td>${esc(s.exp)}<small>${esc(s.disp)} del ${esc(s.disp_fecha)}</small></td><td>${stl(s.estado)}</td><td>${(h => h ? fISO(h.f) + "<small>" + esc(h.t) + "</small>" : "—")(s.hitos.find(h => !h.ok && h.sim))}</td><td>${fISO(s.vig_anual)}<small>${falta(s.vig_anual)}</small></td></tr></tbody></table>`;
}

// ---------- Estudios y matafuegos ----------
function vHys(){
  const e = X().estudios;
  return `<h2>Estudios de higiene y seguridad</h2><p class="x-intro">${E("ui.hys.intro", "Mediciones y estudios " + MOD.delLugar + ", con su estado al " + X().fecha + ".")}</p>
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="x-box" style="border-top:5px solid var(--brand)"><div class="x-row x-est h"><span>Estudio</span><span>Norma</span><span>Fecha</span><span>Vigencia</span><span>Estado</span><span>Documento</span></div>
  ${e.map((s, i) => { const [st, ve] = estEst(s); return `<div class="x-row x-est"><div><div class="x-t">${E("estudios." + i + ".estudio")}</div><div class="x-m">${E("estudios." + i + ".sit")}</div></div><div class="x-m">${E("estudios." + i + ".norma")}</div><div class="x-m">${E("estudios." + i + ".fecha")}</div><div class="x-m">${E("estudios." + i + ".vigencia")}</div><div><span class="x-e ${st.replace(" ", "-")}">${st === "EN CURSO" ? "EN PREPARACIÓN" : st === "PENDIENTE" ? "A REALIZAR" : st}</span>${ve ? `<div class="x-m">${ve}</div>` : ""}</div><div class="x-dl">${s.archivos.map(k => btnDl(k, k === "cf-plan" ? "Planillas" : "Descargar")).join("") || `<span class="x-m">—</span>`}</div></div>`; }).join("")}</div>
  ${vMf()}
  <div class="x-note"><span style="flex:1;min-width:240px">${E("mf_nota")}</span></div>`;
}
// La vista sale del dato: si cada matafuego trae su puesto, tabla con filtro por piso; si vienen agrupados por lugar (con cantidad), tarjetas.
let MFP = "";   // piso elegido en la tabla
function vMf(){
  const mf = X().matafuegos;
  if (!(mf.length && mf[0].puesto !== undefined)){
    const tot = mf.reduce((a, m) => a + m.n, 0);
    return `<div class="g-sec">Matafuegos · ${tot} equipos</div>
  <div class="lt-mf">${mf.map((m, i) => `<div class="lt-mfc${/K/.test(m.tipo) ? " k" : ""}"><div class="lt-mfi"><svg viewBox="0 0 24 40" aria-hidden="true"><rect x="5" y="9" width="14" height="29" rx="5"/><rect x="9" y="3" width="6" height="7" rx="1"/><path d="M15 6h6v3" fill="none" stroke-width="2.4" stroke-linecap="round"/></svg><b>${m.n}</b></div><div><div class="x-t">${E("matafuegos." + i + ".tipo")}</div><div class="x-m"><b>${E("matafuegos." + i + ".lugar")}</b></div><div class="x-m">${E("matafuegos." + i + ".obs")}</div></div></div>`).join("")}</div>`;
  }
  const tot = mf.length, pisos = [...new Set(mf.map(m => m.piso))];
  return `<div class="g-sec">Matafuegos · ${tot} equipos${X().mf_fecha ? " · control del " + esc(X().mf_fecha) : ""}</div>
  <div class="lt-pisos">${pisos.map(p => `<button type="button" class="lt-piso${MFP === p ? " on" : ""}" data-mfp="${esc(p)}"><b>${mf.filter(m => m.piso === p).length}</b><span>${esc(p)}</span></button>`).join("")}<button type="button" class="lt-piso${!MFP ? " on" : ""}" data-mfp=""><b>${tot}</b><span>Todos</span></button></div>
  <div class="x-box"><div class="x-row lt-mfr h"><span>N.º</span><span>Puesto</span><span>Piso</span><span>Equipo</span><span>Observación</span></div>
  ${mf.filter(m => !MFP || m.piso === MFP).map(m => `<div class="x-row lt-mfr"><b>${m.n}</b><span>${esc(m.puesto)}</span><span class="x-m">${esc(m.piso)}</span><span class="x-m">${esc(m.agente)} · ${esc(m.cap)}${m.num ? " · n.º " + esc(m.num) : ""}</span><span class="x-m">${esc(m.obs)}</span></div>`).join("")}
  ${X().archivos.mf ? `<div class="x-row" style="background:var(--crema)">${btnDl("mf", "Control de extintores (PDF)")}</div>` : ""}</div>`;
}
document.addEventListener("click", e => { const t = e.target.closest("[data-mfp]"); if (t){ MFP = t.dataset.mfp; renderExtra(); } });

// ---------- Descargas ----------
// Informes para bajar: los de extra.informes o MOD.informes ([clave, texto]); si no hay, los archivos guardados en pdf/ («Informe <clave>»).
function dlInformes(){ return X().informes || MOD.informes || Object.entries(X().archivos).filter(([k, a]) => /^pdf\//.test(a.ruta || "")).map(([k]) => [k, "Informe " + k]); }
function grupoInf(){
  return `<div class="g-box" style="--c:var(--brand)"><h3>Informes de visita</h3><span class="x-m">El último y los anteriores, en PDF</span>
  <div class="g-sel"><select id="sel-inf">${dlInformes().map(([k, t]) => `<option value="${esc(k)}">${esc(t)}</option>`).join("")}</select><button type="button" class="g-btn" data-dlsel="inf">Descargar</button></div></div>`;
}
// Cajas de Descargas: extra.descargas o MOD.descargas = [{t: título, c: color, de: [...]}]. Cada elemento de «de» es [clave] o [clave, texto],
// o una fuente que sale de los datos: "@sap" (archivos del SAP), "@estudios", "@mf" (control de extintores), "@constancias", "@procs".
function dlCajas(){ return X().descargas || MOD.descargas || [{t: "Autoprotección", c: "var(--brand)", de: ["@sap"]}, {t: "Estudios", c: "var(--celeste-dk)", de: ["@estudios", "@mf"]}, {t: "Capacitación", c: "#8A5A12", de: ["@constancias"]}]; }
function dlItems(d){
  const x = X();
  if (typeof d !== "string") return [d];
  if (d === "@sap") return x.sap.archivos.map(k => [k]);
  if (d === "@estudios") return x.estudios.flatMap((s, i) => s.archivos.map(k => [k, (k === "cf-plan" ? "Planillas · " : "") + T("estudios." + i + ".estudio") + " · " + s.fecha]));
  if (d === "@mf") return x.archivos.mf ? [["mf", "Control de extintores" + (x.mf_fecha ? " · " + x.mf_fecha : "")]] : [];
  if (d === "@constancias") return x.cap.constancias.map(c => [c.k, c.t]);
  if (d === "@procs") return (x.procs || []).map(p => [p.k, p.t]);
  return [];
}
function vDl(){
  const x = X();
  const box = (t, c, ks) => ks.length ? `<div class="g-box" style="--c:${c}"><h3>${t}</h3><div class="g-list">${ks.map(([k, tx]) => `<div class="g-it"><span>${esc(tx || nomArch(k))}</span><button type="button" class="g-btn" data-dl="${k}">Descargar</button></div>`).join("")}</div></div>` : "";
  return `<h2>Descargas</h2><p class="x-intro">${E("ui.dl.intro", "Todo para bajar, agrupado por tipo.")}</p>
  <div class="g-row">${grupoInf()}${grupoEsg()}</div>
  <div class="g-row">${dlCajas().map(c => box(esc(c.t), c.c, c.de.flatMap(dlItems))).join("")}</div>`;
}
// Vista de cada solapa; las propias del cliente se suman con MOD.vistas = {clave: función}
function renderExtra(){
  $("vExtra").innerHTML = pubCtl(TAB) + Object.assign({sap: vSap, hys: vHys, cap: vCap, epp: vEpp, insp: vInsp, dl: vDl}, MOD.vistas)[TAB]();
  if (EDIT) $("vExtra").querySelectorAll("[data-ed]").forEach(e => e.contentEditable = "true");
}
