// Portales de clientes · módulos comunes (core/v1/modulos.js) · bloque 1, 15/11/2026
// Se carga después de portal.js y antes de cliente.js, en los portales con "modulos_js": true en su ficha.
// Trae lo que es igual en todos: textos editables, publicación por sección, descargas, subir constancia, proponer fecha, avisos y video.
// Lo propio de cada cliente:
//   · MOD   → opciones; su cliente.js las completa con Object.assign(MOD, {...})
//   · una function con el mismo nombre en cliente.js pisa la de acá (MIT lo hace con las que llevan el selector de planta).
//     Sólo con function: un const o let repetido rompe la página entera.
//   · cliente.js define TABS, TAB, PL, INSST y renderExtra(), que acá se usan al ejecutar.
const MOD = {
  archPref: null,                 // qué se le saca al nombre de un archivo para mostrarlo; por defecto «<nombre del cliente> - »
  propHorario: "16:00 a 16:45"    // ejemplo de horario al proponer la fecha de una capacitación
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
