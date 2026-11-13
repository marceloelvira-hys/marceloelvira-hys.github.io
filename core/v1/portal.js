// Núcleo de los portales de clientes · v1 (13/11/2026). Fuente única: _Gestion\_portales-core\core\v1\portal.js
// Lo propio de cada cliente llega por CFG (definido en su index.html) y por CLI (lo completa su cliente.js).
const CLI = {prios: ["alta", "media", "baja"],
  prioTxt: n => ` · prioridad alta ${n("alta")}, media ${n("media")} y baja ${n("baja")}`,
  inicio(){}, estado(){}, subt: () => ""};
// ---------- configuración ----------
// Versión publicada: los datos, las fotos y los PDF van cifrados (AES-256-GCM, clave derivada de la contraseña con PBKDF2).
// Vista previa: DATA va en la página y no se envía nada a la planilla.
const CIFRADO = CFG.cifrado;
const SAL = CFG.sal, ITER = CFG.iter;
// Cada persona tiene su clave: con ella se abre su llave (la de los datos + su nombre + su clave para la planilla).
const API_PUBLICA = CFG.api;   // el ingreso lo valida la planilla de Marcelo
let USUARIO = CIFRADO ? null : {nombre: "Vista previa", admin: /(^|[#&])lic=/.test(location.hash)};
let ADMIN = false;
let DATA = CFG.data;
let API_URL = "", API_TOKEN = "", CLAVE = null;

const st = {mes: "", sector:"", tema:"", tipo:"todos", seg:"todos", ot:"", orden:"tema", q:"", soloSel:false};
const SEL = new Set();                       // "mes|n"
const CERR = new Set();                      // grupos minimizados (por título)
let NOTAS = {}, ORDENES = [], AREAS_EXTRA = [];
const ESTADOS = ["Pendiente", "En curso", "Listo para verificar"];
const SLUG = {"Pendiente":"pendiente","En curso":"curso","Listo para verificar":"listo","Resuelto":"resuelto"};
let otNum = 0;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const M = () => DATA.meses.find(m => m.clave === st.mes);
const mesDe = c => DATA.meses.find(m => m.clave === c);
const mesIdx = c => DATA.meses.findIndex(m => m.clave === c);
const temaDe = (m, k) => m.temas.find(t => t.key === k);
const notas = (m, p) => ((NOTAS[m.clave] || {})[String(p.n)] || []);
const avance = (m, p) => notas(m, p).flatMap(x => (x.fotos || []).map(f => ({f, x})));
const ultEstado = (m, p) => { const n = notas(m, p); return n.length ? n[n.length - 1].estado : ""; };
const hecho = e => e === "Listo para verificar" || e === "Resuelto";
const hoy = () => new Date().toLocaleDateString("es-AR");
const key = (m, p) => m.clave + "|" + p.n;
const corto = s => s.replace("Instalación eléctrica — ", "Eléctrico · ");
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k) || ""; if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return ""; } }
// v2 (4/11/2026): se descartan los nombres que quedaron guardados de las pruebas
const quien = () => USUARIO ? USUARIO.nombre : "", setQuien = () => {};
ls(CFG.id + "-nombre", null);
function toast(t){ const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2800); }

// ---------- cifrado ----------
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const a64 = u => btoa(String.fromCharCode(...new Uint8Array(u)));
async function derivar(pw){
  pw = pw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw.trim()), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name: "PBKDF2", salt: b64(SAL), iterations: ITER, hash: "SHA-256"}, base, {name: "AES-GCM", length: 256}, false, ["decrypt"]);
}
async function descifrar(buf){
  const u = new Uint8Array(buf);
  return crypto.subtle.decrypt({name: "AES-GCM", iv: u.slice(0, 12)}, CLAVE, u.slice(12));
}
async function bajarCifrado(ruta){
  const r = await fetch(ruta + ".enc", {cache: "no-cache"}); if (!r.ok) throw new Error(ruta);
  return descifrar(await r.arrayBuffer());
}
// fotos: en la vista previa van directo; cifradas se bajan, se descifran y se muestran como blob
const BLOBS = new Map();
function urlFoto(ruta){
  if (ruta.startsWith("data:")) return Promise.resolve(ruta);
  if (ruta.startsWith("drive:")){      // foto de avance: está en el Drive de Marcelo, la trae el script
    if (!BLOBS.has(ruta)) BLOBS.set(ruta, fetch(API_URL + "?accion=foto&token=" + encodeURIComponent(API_TOKEN) + "&id=" + encodeURIComponent(ruta.slice(6)))
      .then(r => r.json()).then(j => j.ok ? URL.createObjectURL(new Blob([b64(j.b64)], {type: j.tipo || "image/jpeg"})) : "").catch(() => ""));
    return BLOBS.get(ruta);
  }
  if (!CIFRADO) return Promise.resolve(ruta);
  if (!BLOBS.has(ruta)) BLOBS.set(ruta, bajarCifrado(ruta).then(b => URL.createObjectURL(new Blob([b], {type: "image/jpeg"}))).catch(() => ""));
  return BLOBS.get(ruta);
}
const img = (ruta, extra = "") => `<img data-e="${esc(ruta)}" alt="" ${extra}>`;
function ponerFoto(el, ruta){ el.dataset.e = ruta; el.removeAttribute("src"); return urlFoto(ruta).then(u => { if (el.dataset.e === ruta && u) el.src = u; }); }
const visibles = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ visibles.unobserve(e.target); ponerFoto(e.target, e.target.dataset.e); } }), {rootMargin: "400px"}) : null;
function hidratar(root){ root.querySelectorAll("img[data-e]:not([src])").forEach(el => visibles ? visibles.observe(el) : ponerFoto(el, el.dataset.e)); }
function cargarTodas(root){
  return Promise.all([...root.querySelectorAll("img[data-e]")].map(el => (el.src ? Promise.resolve() : ponerFoto(el, el.dataset.e))
    .then(() => el.complete ? null : new Promise(r => { el.onload = el.onerror = r; }))));
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1){ if (n.matches("img[data-e]") && !n.src) hidratar(n.parentNode); else hidratar(n); } })))
  .observe(document.body, {childList: true, subtree: true});

async function bajarPdf(clave, nombre){
  if (!CIFRADO){ location.href = "pdf/" + encodeURIComponent(nombre); return; }
  toast("Preparando el PDF…");
  try {
    const b = await bajarCifrado("pdf/" + clave + ".pdf");
    const u = URL.createObjectURL(new Blob([b], {type: "application/pdf"}));
    const a = document.createElement("a"); a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
  } catch(e){ toast("No se pudo bajar el PDF"); }
}

// ---------- ingreso ----------
async function pedir(ev){
  const r = await fetch(API_PUBLICA, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(ev)});
  return r.json();
}
async function usar(p){
  USUARIO = {nombre: p.n, admin: !!p.a, token: p.t}; ADMIN = USUARIO.admin;
  return abrirCon(await crypto.subtle.importKey("raw", b64(p.k), "AES-GCM", false, ["decrypt"]));
}
async function abrirCon(k){
  CLAVE = k;
  const d = JSON.parse(new TextDecoder().decode(await bajarCifrado("d")));
  return d;
}
async function iniciar(){
  if (!CIFRADO){ arrancar(); return; }
  ls(CFG.id + "-k", null); ls(CFG.id + "-nombre", null); ls(CFG.id + "-nombre-2", null);   // claves de la versión anterior
  const g = ls(CFG.id + "-u");
  if (g){
    try { DATA = await usar(JSON.parse(g)); arrancar(); return; }
    catch(e){ ls(CFG.id + "-u", null); }
  }
  $("login").hidden = false; $("usuario").focus();
}
let PASO = 1;
const ERRORES = {usuario: "No encontramos ese usuario. Probá con tu nombre de pila.", clave: "Clave incorrecta.", bloqueado: "Demasiados intentos. Probá de nuevo en 15 minutos o avisale al Lic. Elvira.", corta: "La clave nueva tiene que tener al menos 6 caracteres y no puede ser la inicial."};
async function entrar(s){
  DATA = await usar(s);
  if ($("recordar").checked) ls(CFG.id + "-u", JSON.stringify(s));
  $("login").hidden = true; arrancar();
}
$("loginForm").addEventListener("submit", async e => {
  e.preventDefault(); const err = $("loginErr"), u = $("usuario").value.trim(), c = $("clave").value;
  try {
    if (PASO === 1){
      err.textContent = "Entrando…";
      const r = await pedir({tipo: "login", usuario: u, clave: c});
      if (!r.ok){ err.textContent = ERRORES[r.error] || "No se pudo entrar."; return; }
      if (r.cambiar){
        PASO = 2; $("paso1").hidden = true; $("paso2").hidden = false; $("loginBtn").textContent = "Guardar mi clave y entrar";
        $("hola").innerHTML = `Hola, <b>${esc(r.nombre)}</b>. Es tu primer ingreso: elegí tu clave personal. Desde ahora entrás con ella.`;
        err.textContent = ""; $("nueva").focus(); return;
      }
      err.textContent = "Abriendo…"; await entrar(r.s);
    } else {
      const n1 = $("nueva").value.trim(), n2 = $("nueva2").value.trim();
      if (n1.length < 6){ err.textContent = ERRORES.corta; return; }
      if (n1 !== n2){ err.textContent = "Las dos claves no coinciden."; return; }
      err.textContent = "Guardando…";
      const r = await pedir({tipo: "cambiar-clave", usuario: u, clave: c, nueva: n1});
      if (!r.ok){ err.textContent = ERRORES[r.error] || "No se pudo guardar la clave."; return; }
      await entrar(r.s);
    }
  } catch(x){ err.textContent = "No se pudo conectar. Revisá internet y probá de nuevo."; }
});
function salir(){ ls(CFG.id + "-u", null); location.reload(); }

// ---------- envío a la planilla (registro + aviso por mail) ----------
async function enviar(ev){
  ev = Object.assign({ts: new Date().toISOString(), mes: st.mes, pagina: CFG.id}, ev);
  if (!API_URL && CIFRADO) return {ok: false};
  if (!API_URL){ (window.ENVIADOS = window.ENVIADOS || []).push(ev); return {ok: true, preview: true, n: ++otNum}; }
  try {
    const r = await fetch(API_URL, {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(Object.assign({token: API_TOKEN}, ev))});
    return await r.json();
  } catch(e){ return {ok: false}; }
}
async function cargarEstado(){
  if (!API_URL){ if (CIFRADO) $("offline").hidden = false; return; }
  try {
    const r = await fetch(API_URL + "?accion=estado&token=" + encodeURIComponent(API_TOKEN)); const j = await r.json();
    if (!j || !j.ok) throw 0;
    NOTAS = j.seguimiento || {}; ORDENES = j.ordenes || [];
    Object.values(NOTAS).forEach(pm => Object.values(pm).forEach(ns => ns.forEach(x => x.fotos = (x.fotos || []).map(id => "drive:" + id)))); AREAS_EXTRA = j.areas || []; CLI.estado(j);
    $("offline").hidden = true; render();
  } catch(e){ $("offline").hidden = false; }
}

// ---------- órdenes de trabajo ----------
const otsDe = (m, p) => ORDENES.filter(o => o.mes === m.clave && o.puntos.includes(p.n));
const otsMes = m => ORDENES.filter(o => o.mes === m.clave);
const otNombre = o => o.area + (o.cargo ? " · " + o.cargo : "");
function otAvance(o){ const m = mesDe(o.mes); if (!m) return [0, o.puntos.length]; return [o.puntos.filter(n => { const p = m.puntos.find(x => x.n === n); return p && hecho(ultEstado(m, p)); }).length, o.puntos.length]; }
function areas(){
  const out = []; [...(DATA.areas || []), ...AREAS_EXTRA, ...ORDENES.map(o => o.area)].forEach(a => { a = String(a || "").trim(); if (a && !out.some(x => x.toLowerCase() === a.toLowerCase())) out.push(a); });
  return out;
}

// ---------- historial y filtros ----------
function refs(r){ return (String(r).match(/\d+/g) || []).map(Number); }
function historia(m, p){
  const out = [{mes: m.clave, n: p.n, fotos: p.fotos}];
  let cm = m, cp = p;
  while (cp && cp.ref){
    const prev = DATA.meses[mesIdx(cm.clave) + 1], rs = refs(cp.ref);
    if (!prev){ out.push({mes: cm.anterior, n: rs.join(" y "), fotos: [], solo: true}); break; }
    const pp = prev.puntos.find(x => x.n === rs[0]); if (!pp) break;
    out.push({mes: prev.clave, n: rs.join(" y "), fotos: pp.fotos}); cm = prev; cp = pp;
  }
  return out;
}
const desde = (m, p) => { const h = historia(m, p); return h[h.length - 1].mes; };
const ordenMes = c => { const [a, b] = c.split(" ")[0].split("-").map(Number); return b * 100 + a; };
const filtrando = () => !!(st.soloSel || st.sector || st.tema || st.tipo !== "todos" || st.seg !== "todos" || st.ot || st.q.trim());
function filtrar(){
  const m = M(), q = st.q.trim().toLowerCase();
  return m.puntos.filter(p => {
    const ots = otsDe(m, p);
    return (!st.soloSel || SEL.has(key(m, p))) &&
    (!st.sector || p.sectores.includes(st.sector)) &&
    (!st.tema || p.tema === st.tema) &&
    (st.tipo === "todos" || (st.tipo === "reinc" ? !!p.ref : !p.ref)) &&
    (st.seg === "todos" || (st.seg === "sin" ? !ultEstado(m, p) : ultEstado(m, p) === st.seg)) &&
    (!st.ot || (st.ot === "sin" ? !ots.length : st.ot === "con" ? ots.length : ots.some(o => o.numero === st.ot))) &&
    (!q || (p.titulo + " " + p.rec + " " + p.lugar + " " + ots.map(o => o.numero + " " + otNombre(o)).join(" ")).toLowerCase().includes(q));
  });
}
function chips(m, p){
  let s = p.ref ? `<span class="chip reinc">Reincidencia · punto ${esc(p.ref)} del ${esc(m.anterior)}${desde(m, p).split(" ")[0] !== m.anterior ? " · desde el " + esc(desde(m, p).split(" ")[0]) : ""}</span>` : `<span class="chip nuevo">Nuevo</span>`;
  if (p.prio) s += `<span class="chip prio prio-${p.prio.toLowerCase()}">Prioridad ${p.prio.toLowerCase()}</span>`;
  const e = ultEstado(m, p); if (e) s += `<span class="chip est-${SLUG[e]}">${e}</span>`;
  otsDe(m, p).forEach(o => s += `<button type="button" class="chip ot" data-otf="${esc(o.numero)}" title="Ver los puntos de esta orden">${esc(o.numero)} · ${esc(o.area)}</button>`);
  return s;
}
function fila(m, p){
  const n = notas(m, p), u = n[n.length - 1], on = SEL.has(key(m, p));
  return `<article class="fila${on ? " sel" : ""}" data-n="${p.n}">
    <span class="ck"><input type="checkbox" data-ck="${p.n}" ${on ? "checked" : ""} aria-label="Seleccionar punto ${p.n}"></span>
    <span class="num">${p.n}</span>
    <div><div class="meta">${chips(m, p)}</div><div class="obs">${esc(p.titulo)}</div><div class="sector">${esc(p.lugar)}</div></div>
    <div class="acc acc-col"><b>Acción</b>${esc(p.rec)}${u ? `<div class="nota-mini"><b>${esc(u.quien)}</b> · ${esc(u.fecha)}: ${esc(u.texto)}${avance(m, p).length ? ` <span class="cam">📷 ${avance(m, p).length} foto${avance(m, p).length === 1 ? "" : "s"} de avance</span>` : ""}</div>` : ""}</div>
    <div class="thumbs"><div class="tw">${p.fotos.slice(0, 3).map(x => img(x)).join("")}</div></div></article>`;
}
function grupos(m, lista){
  const g = [];
  if (st.orden === "tema") m.temas.forEach(t => { const ps = lista.filter(p => p.tema === t.key); if (ps.length) g.push({titulo: t.nombre, tema: t, ps}); });
  else if (st.orden === "sector"){ const o = []; lista.forEach(p => { const s = p.sectores[0]; if (!o.includes(s)) o.push(s); }); o.forEach(s => g.push({titulo: s, ps: lista.filter(p => p.sectores[0] === s)})); }
  else if (st.orden === "antig") g.push({titulo: "Más antiguos primero", ps: [...lista].sort((a, b) => (a.ref ? ordenMes(desde(m, a)) : 99999) - (b.ref ? ordenMes(desde(m, b)) : 99999) || a.n - b.n)});
  else g.push({titulo: "Por número", ps: lista});
  return g;
}
function otsGrupo(m, ps){
  const os = otsMes(m).filter(o => ps.some(p => o.puntos.includes(p.n)));
  if (!os.length) return "";
  return `<div class="ots">Órdenes de trabajo: ${os.map(o => { const k = ps.filter(p => o.puntos.includes(p.n)).length; return `<button type="button" class="chip ot" data-otf="${esc(o.numero)}">${esc(o.numero)} · ${esc(otNombre(o))} · ${k} de este grupo</button>`; }).join(" ")}</div>`;
}

// ---------- pantalla ----------
function render(){
  const m = M(), lista = filtrar();
  $("subt").textContent = `${CLI.subt()}Informe ${m.etq || m.clave}`;
  $("tbR").innerHTML = (ADMIN ? `<span class="admin-badge">Modo Lic. Marcelo Elvira</span> ` : "") + (USUARIO ? `Ingresaste como <b>${esc(USUARIO.nombre)}</b> ` : "") + (CIFRADO ? `· <button class="link salir" type="button" id="salir">Salir</button>` : "");
  $("mesbar").innerHTML = `<span class="lbl">Informe</span>` + DATA.meses.map((x, i) => `<button class="mes" type="button" data-mes="${x.clave}" aria-pressed="${x.clave === st.mes}">${x.etq || x.clave}${i === 0 ? '<span class="tag">último</span>' : ""}</button>`).join("")
    + `<select class="mes" id="fArch" aria-label="Informes anteriores en PDF"><option value="">Anteriores (PDF) ▾</option>${DATA.archivo.map(a => `<option value="${esc(a.clave)}">Informe ${a.clave}</option>`).join("")}</select>`;
  const nr = m.puntos.filter(p => p.ref).length, cnt = e => m.puntos.filter(p => ultEstado(m, p) === e).length, nOt = m.puntos.filter(p => otsDe(m, p).length).length;
  $("stats").innerHTML = `<div class="stat"><b class="tab">${m.puntos.length}</b><span>puntos</span></div><div class="stat r"><b class="tab">${nr}</b><span>reincidencias</span></div><div class="stat n"><b class="tab">${m.puntos.length - nr}</b><span>nuevos</span></div><div class="stat"><b class="tab">${nOt}</b><span>con orden de trabajo</span></div><div class="stat"><b class="tab">${cnt("En curso")}</b><span>en curso</span></div><div class="stat l"><b class="tab">${cnt("Listo para verificar")}</b><span>listos para verificar</span></div><div class="stat ok"><b class="tab">${m.corregidos.length}</b><span>corregidos en la visita</span></div>`;
  const sects = []; m.puntos.forEach(p => p.sectores.forEach(s => { if (!sects.includes(s)) sects.push(s); }));
  $("fSector").innerHTML = `<option value="">Todos los sectores</option>` + sects.map(s => `<option ${s === st.sector ? "selected" : ""}>${esc(s)}</option>`).join("");
  $("fTema").innerHTML = `<option value="">Todos los temas</option>` + m.temas.map(t => `<option value="${t.key}" ${t.key === st.tema ? "selected" : ""}>${esc(corto(t.nombre))}</option>`).join("");
  const om = otsMes(m);
  $("fOT").innerHTML = `<option value="">Todas</option><option value="con" ${st.ot === "con" ? "selected" : ""}>Con orden de trabajo</option><option value="sin" ${st.ot === "sin" ? "selected" : ""}>Sin orden de trabajo</option>`
    + om.map(o => { const [h, t] = otAvance(o); return `<option value="${esc(o.numero)}" ${o.numero === st.ot ? "selected" : ""}>${esc(o.numero)} · ${esc(otNombre(o))} (${h}/${t} listos)</option>`; }).join("");
  const tms = m.temas.map(t => ({t, ps: m.puntos.filter(p => p.tema === t.key)})).filter(r => r.ps.length).sort((a, b) => b.ps.length - a.ps.length || m.temas.indexOf(a.t) - m.temas.indexOf(b.t));
  const mx = Math.max(...tms.map(r => r.ps.length)), top3 = tms.slice(0, 3).reduce((a, r) => a + r.ps.length, 0);
  const PR = CLI.prios, np = (ps, k) => ps.filter(p => (p.prio || "").toLowerCase() === k).length;
  const prs = ps => PR.map(k => [k, np(ps, k)]).filter(x => x[1]).map(([k, n]) => `<span class="pr prio-${k}">${n} ${k}</span>`).join("");
  const rkFila = (k, nom, ps) => { const h = ps.filter(p => hecho(ultEstado(m, p))).length; return `<div class="rkr${k === st.tema ? " on" : ""}" data-t="${esc(k)}" role="button" tabindex="0"><span class="nm">${esc(nom)}</span><span class="cn">${ps.length}</span>${k ? `<span class="br" title="${h} de ${ps.length} listos para verificar o resueltos"><i class="h" style="width:${100 * h / mx}%"></i><i class="p" style="width:${100 * (ps.length - h) / mx}%"></i></span><span class="prs">${prs(ps)}</span>` : ""}</div>`; };
  const hTot = m.puntos.filter(p => hecho(ultEstado(m, p))).length, conPr = PR.some(k => np(m.puntos, k));
  $("lateral").innerHTML = `<h3>Puntos por tema</h3><div class="rk"><div class="msg"><b>${m.puntos.length} puntos en ${tms.length} temas</b>${conPr ? CLI.prioTxt(k => np(m.puntos, k)) : ""}.${hTot ? ` ${hTot} ya están listos para verificar o resueltos.` : ""} Los ${Math.min(3, tms.length)} temas de arriba reúnen ${top3} de los ${m.puntos.length} puntos. Tocá un tema para ver sus puntos.</div>`
    + rkFila("", "Todos los temas", m.puntos) + tms.map(r => rkFila(r.t.key, corto(r.t.nombre), r.ps)).join("")
    + `<div class="ley"><span><i style="background:var(--ok)"></i>listo o resuelto</span><span><i style="background:#8FA3B1"></i>por hacer</span></div></div>`;
  const todas = [...ORDENES].sort((a, b) => ordenMes(b.mes) - ordenMes(a.mes) || (a.numero < b.numero ? -1 : 1));
  $("lateral").innerHTML += `<h3 style="margin-top:18px">Órdenes de trabajo</h3>` + (todas.length ? todas.map(o => { const [h, t] = otAvance(o); return `<button type="button" class="lot${o.numero === st.ot ? " on" : ""}" data-otf="${esc(o.numero)}" data-otm="${esc(o.mes)}"><b>${esc(o.numero)}</b><span>${esc(otNombre(o))} · ${esc(o.fecha)}</span><span class="barra"><i style="width:${Math.round(100 * h / t)}%"></i></span><span class="c">${h} de ${t} listos para verificar o resueltos</span></button>`; }).join("") : `<div class="ayuda">Todavía no hay órdenes. Seleccioná puntos y tocá «Armar orden de trabajo».</div>`);
  const act = [];
  if (st.soloSel) act.push("Sólo la selección");
  if (st.sector) act.push("Sector: " + st.sector);
  if (st.tema) act.push("Tema: " + corto(temaDe(m, st.tema).nombre));
  if (st.tipo !== "todos") act.push(st.tipo === "reinc" ? "Reincidencias" : "Nuevos");
  if (st.seg !== "todos") act.push("Seguimiento: " + (st.seg === "sin" ? "sin anotar" : st.seg));
  if (st.ot) act.push(st.ot === "sin" ? "Sin orden de trabajo" : st.ot === "con" ? "Con orden de trabajo" : "Orden " + st.ot);
  if (st.q) act.push("“" + st.q + "”");
  const otSel = om.find(o => o.numero === st.ot);
  $("activos").innerHTML = act.map(a => `<span class="pill">${esc(a)}</span>`).join("") + (act.length ? `<button class="link" type="button" id="limpiar">Limpiar filtros</button>` : "")
    + (otSel ? `<button class="link" type="button" data-verot="${esc(otSel.numero)}">Ver la orden ${esc(otSel.numero)}</button>` : "")
    + (st.sector ? `<button class="link" type="button" data-sug="${esc(st.sector)}">Sugerir otro nombre para este sector</button>` : "")
    + `<span class="cuenta"><span class="tab">${lista.length} de ${m.puntos.length} puntos</span><button class="link" type="button" id="selFilt">Seleccionar los ${lista.length}</button></span>`;
  $("lista").innerHTML = (otSel ? `<div class="otcab"><b>${esc(otSel.numero)}</b> · dirigida a <b>${esc(otNombre(otSel))}</b> · pedida por ${esc(otSel.quien)} el ${esc(otSel.fecha)}${otSel.texto ? `<br><span class="muted">${esc(otSel.texto)}</span>` : ""}</div>` : "")
    + (grupos(m, lista).map(g => { const ns = g.ps.filter(p => SEL.has(key(m, p))).length; return `<section class="grupo${CERR.has(g.titulo) ? " cerrado" : ""}"><div class="ghead" data-tg="${esc(g.titulo)}" title="Tocá para minimizar o desplegar"><h2><span class="tg">▾</span>${esc(g.titulo)}${ns ? `<span class="nsel">${ns} seleccionado${ns === 1 ? "" : "s"}</span>` : ""}</h2><span class="n tab">${g.ps.length} punto${g.ps.length === 1 ? "" : "s"}</span><button class="selg" type="button" data-selg="${g.ps.map(p => p.n).join(",")}">Seleccionar el grupo</button>${otsGrupo(m, g.ps)}</div>`
    + (g.tema ? `<details class="criterio"><summary>Criterio y normativa del tema</summary><p>${esc(g.tema.criterio)}</p><p><b>Encuadre:</b> ${esc(g.tema.enc)}</p></details>` : `<div style="height:8px"></div>`)
    + `<div class="filas">${g.ps.map(p => fila(m, p)).join("")}</div></section>`; }).join("") || `<p class="muted">Ningún punto coincide con los filtros.</p>`);
  $("verif").hidden = filtrando();
  $("verif").innerHTML = `<div class="ghead"><h2>Verificado como corregido o conforme en la visita</h2><span class="n tab">${m.corregidos.length}</span></div><div class="vlist">`
    + m.corregidos.map(c => `<div class="vitem">${c.fotos[0] ? img(c.fotos[0]) : ""}<span>${esc(c.texto)}</span></div>`).join("") + `</div>`;
  selbar();
}
function nsel(){
  document.querySelectorAll("#lista .grupo").forEach(g => {
    const n = g.querySelectorAll(".fila.sel").length, h2 = g.querySelector(".ghead h2"); let b = h2.querySelector(".nsel");
    if (!n){ if (b) b.remove(); return; }
    if (!b){ b = document.createElement("span"); b.className = "nsel"; h2.appendChild(b); }
    b.textContent = n + (n === 1 ? " seleccionado" : " seleccionados");
  });
}
function selbar(){
  const n = SEL.size; $("selbar").hidden = !n;
  $("selN").textContent = n; $("selTxt").textContent = n === 1 ? "punto seleccionado" : "puntos seleccionados";
  $("selVer").textContent = st.soloSel ? "Ver todos" : "Ver solo la selección";
}

// ---------- detalle y seguimiento ----------
let cur = null, fi = 0, fotosDet = [], NUEVAS = [];
function achicar(file){      // máx. 1600 px, JPEG 0,8 → unos 300 KB
  return new Promise((ok, mal) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.8)); };
    im.onerror = () => { URL.revokeObjectURL(u); mal(); }; im.src = u;
  });
}
function prevNuevas(){ $("sPrev").innerHTML = NUEVAS.map((d, i) => `<span><img src="${d}" alt=""><button type="button" class="x" data-qf="${i}" aria-label="Quitar foto">✕</button></span>`).join(""); }
function abrir(n){
  const m = M(), p = m.puntos.find(x => x.n === n); if (!p) return;
  cur = p; fi = 0; const h = historia(m, p), t = temaDe(m, p.tema), ns = notas(m, p), os = otsDe(m, p);
  fotosDet = h.flatMap((x, i) => x.fotos.map(f => ({f, mes: x.mes})).concat(i ? [] : avance(m, p).map(a => ({f: a.f, ley: `Avance cargado por ${a.x.quien} el ${a.x.fecha}`}))));
  NUEVAS = [];
  $("velo").innerHTML = `<div class="det" role="dialog" aria-modal="true" aria-labelledby="dTit"><div class="visor"><div class="grande"><button class="nav izq" type="button" id="pPrev" aria-label="Foto anterior">‹</button><img id="pBig" alt=""><button class="nav der" type="button" id="pNext" aria-label="Foto siguiente">›</button></div><div class="leyenda" id="pLey"></div><div class="tira" id="pTira"></div></div>
  <div class="info"><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button>
    <div class="meta"><span class="num">Punto ${p.n}</span><span class="sector">${esc(p.lugar)}</span></div><div class="meta">${chips(m, p)}</div>
    <h3 id="dTit">${esc(p.titulo)}</h3>
    <div class="acc"><b>Acción a realizar</b><br>${esc(p.rec)}</div>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px;cursor:pointer"><input type="checkbox" data-ck="${p.n}" ${SEL.has(key(m, p)) ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)">Sumar este punto a la selección (orden de trabajo)</label>
    ${os.length ? `<div class="bloque ots-det"><h4>Órdenes de trabajo</h4>${os.map(o => `<div class="o"><b>${esc(o.numero)}</b><span>${esc(otNombre(o))} · pedida por ${esc(o.quien)} el ${esc(o.fecha)}</span><span style="flex:1"></span><button class="link" type="button" data-otf="${esc(o.numero)}">Ver sus puntos</button><button class="link" type="button" data-verot="${esc(o.numero)}">Ver la orden</button></div>`).join("")}</div>` : ""}
    <div class="bloque"><h4>Tema · ${esc(t.nombre)}</h4><div class="muted">${esc(t.criterio)}</div><div class="muted" style="margin-top:4px"><b>Encuadre:</b> ${esc(t.enc)}</div></div>
    <div class="bloque"><h4>Historial del punto</h4><div class="hist">${h.map((x, i) => `<div class="hrow ${i ? "" : "actual"}"><div class="m">${esc(x.mes)}<small>punto ${esc(x.n)}</small></div><div class="ph">${x.fotos.length ? x.fotos.slice(0, 4).map(f => img(f, `data-f="${esc(f)}"`)).join("") : `<span class="muted">${x.solo ? "Informe en PDF" : "sin fotos"}</span>`}</div></div>`).join("")}</div></div>
    <div class="bloque"><h4>Seguimiento de ${esc(CFG.nombre)}</h4>
      ${ns.map(x => `<div class="nota-mini" style="margin-bottom:6px"><span class="chip est-${SLUG[x.estado] || "pendiente"}">${esc(x.estado)}</span> <b>${esc(x.quien)}</b> · ${esc(x.fecha)}<br>${esc(x.texto)}${x.ejemplo ? ' <span class="ejemplo">· ejemplo</span>' : ""}${(x.fotos || []).length ? `<div class="avf">${x.fotos.map(f => img(f, `data-f="${esc(f)}"`)).join("")}</div>` : ""}</div>`).join("")}
      <div class="form" id="fSegForm"><div class="estados">${ESTADOS.map(e => `<button type="button" aria-pressed="false" data-est="${e}">${e}</button>`).join("")}${ADMIN ? `<button type="button" class="adm" aria-pressed="false" data-est="Resuelto">Resuelto (verificado)</button>` : ""}</div>
      <textarea id="sTxt" rows="2" placeholder="Qué se hizo o qué falta (por ejemplo: pedimos presupuesto al electricista)"></textarea>
      <div class="subir"><label class="btn" for="sFotos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Agregar fotos del avance</label><input id="sFotos" type="file" accept="image/*" multiple hidden><div class="prev" id="sPrev"></div></div>
      <span class="aviso">Se guarda a nombre de <b>${esc(quien())}</b>.</span>
      <button class="btn prim" type="button" id="sGuardar" style="align-self:flex-start">Guardar seguimiento</button>
      <span class="aviso">«Listo para verificar» avisa que ya está hecho; el Lic. Elvira lo verifica en la próxima visita y lo marca como resuelto.</span></div></div>
  </div></div>`;
  foto(); $("velo").hidden = false;
}
function foto(){
  if (!fotosDet.length){ $("pBig").removeAttribute("src"); $("pTira").innerHTML = ""; $("pLey").textContent = "Sin fotos"; return; }
  ponerFoto($("pBig"), fotosDet[fi].f);
  $("pLey").textContent = `${fotosDet[fi].ley || "Visita " + fotosDet[fi].mes + (fotosDet[fi].mes !== st.mes ? " (informe anterior)" : "")} · foto ${fi + 1} de ${fotosDet.length}`;
  $("pTira").innerHTML = fotosDet.map((x, i) => img(x.f, `class="${i === fi ? "on" : ""}" data-i="${i}"`)).join("");
}
async function guardarSeg(){
  const est = document.querySelector("#fSegForm [data-est][aria-pressed='true']"), txt = $("sTxt").value.trim(), q = quien();
  if (!est){ toast("Elegí un estado"); return; }
  const m = M(), nota = {estado: est.dataset.est, quien: q, fecha: hoy(), texto: txt};
  $("sGuardar").disabled = true; if (NUEVAS.length) toast("Subiendo " + NUEVAS.length + (NUEVAS.length === 1 ? " foto…" : " fotos…"));
  const r = await enviar({tipo: "seguimiento", punto: cur.n, sector: cur.lugar, titulo: cur.titulo, estado: nota.estado, texto: txt, quien: q, fotos: NUEVAS});
  if (!r.ok){ toast("No se pudo guardar. Revisá la conexión y probá de nuevo."); $("sGuardar").disabled = false; return; }
  const sinFotos = NUEVAS.length && API_URL && !r.fotos;
  nota.fotos = r.fotos ? r.fotos.map(id => "drive:" + id) : (API_URL ? [] : NUEVAS.slice()); NUEVAS = [];
  if (sinFotos){ ((NOTAS[m.clave] = NOTAS[m.clave] || {})[cur.n] = NOTAS[m.clave][cur.n] || []).push(nota); toast("Se guardó el seguimiento, pero las fotos todavía no se pueden subir. Probá más tarde."); const n = cur.n; render(); abrir(n); return; }
  ((NOTAS[m.clave] = NOTAS[m.clave] || {})[cur.n] = NOTAS[m.clave][cur.n] || []).push(nota);
  toast("Seguimiento guardado"); const n = cur.n; render(); abrir(n);
}

// ---------- orden de trabajo ----------
function selPuntos(){ const m = M(); return m.puntos.filter(p => SEL.has(key(m, p))); }
function abrirOT(){
  const ps = selPuntos(), m = M();
  const ya = ps.filter(p => otsDe(m, p).length);
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="otT"><div class="cab"><h3 id="otT">Orden de trabajo</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="dos"><div class="form"><label for="otA">Área</label><input id="otA" type="text" list="otAreas" autocomplete="off" placeholder="Elegí de la lista o escribí una nueva"><datalist id="otAreas">${areas().map(a => `<option value="${esc(a)}">`).join("")}</datalist></div>
    <div class="form"><label for="otC">A cargo de (opcional)</label><input id="otC" type="text" placeholder="Nombre del responsable"></div></div>
    <div class="dos"><div class="form"><label for="otP">Pedida por</label><input id="otP" type="text" value="${esc(quien())}" placeholder="Quién la pide"></div><div></div></div>
    <div class="form"><label for="otO">Observaciones para esta orden</label><textarea id="otO" rows="3" placeholder="Indicaciones, prioridades, a quién avisar al terminar…"></textarea></div>
    ${ya.length ? `<div class="aviso">Ojo: ${ya.length === 1 ? "el punto" : "los puntos"} ${ya.map(p => p.n).join(", ")} ya ${ya.length === 1 ? "está" : "están"} en otra orden (${[...new Set(ya.flatMap(p => otsDe(m, p).map(o => o.numero)))].join(", ")}). Se pueden repetir si hace falta.</div>` : ""}
    <div class="form"><label>Puntos incluidos (${ps.length})</label><div class="lsel">${ps.map(p => `<div><span class="num" style="font-size:16px">${p.n}</span><span><b>${esc(p.titulo)}</b><br><span class="muted">${esc(p.lugar)}</span></span><button class="x" type="button" data-quitar="${p.n}" aria-label="Quitar el punto ${p.n}">✕</button></div>`).join("")}</div></div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn prim" type="button" id="otGen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"/></svg>Generar la orden (PDF)</button><span class="aviso">Queda numerada y asociada a cada punto, para filtrarla y seguirla después. Sale un PDF para imprimir o mandar.</span></div>
  </div></div>`;
  $("velo").hidden = false;
}
async function generarOT(){
  const ps = selPuntos(), a = $("otA").value.trim(), c = $("otC").value.trim(), pp = $("otP").value.trim(), o = $("otO").value.trim(), m = M();
  if (!a){ toast("Indicá el área"); $("otA").focus(); return; }
  if (!pp){ toast("Indicá quién la pide"); $("otP").focus(); return; }
  setQuien(pp); $("otGen").disabled = true;
  const area = areas().find(x => x.toLowerCase() === a.toLowerCase()) || a;
  const r = await enviar({tipo: "orden", puntos: ps.map(p => p.n), area, cargo: c, dirigida: area + (c ? " · " + c : ""), quien: pp, texto: o});
  if (!r.ok){ toast("No se pudo registrar la orden. Revisá la conexión y probá de nuevo."); $("otGen").disabled = false; return; }
  const ot = {numero: r.numero || `OT ${m.clave}-${String(r.n || 1).padStart(3, "0")}`, mes: m.clave, fecha: hoy(), area, cargo: c, quien: pp, texto: o, puntos: ps.map(p => p.n)};
  ORDENES.push(ot); SEL.clear(); st.soloSel = false;
  $("velo").hidden = true; render();
  verOT(ot.numero); toast("Orden " + ot.numero + " generada");
}
async function imprimirOT(ot){
  const m = mesDe(ot.mes); if (!m) return;
  const ps = ot.puntos.map(n => m.puntos.find(p => p.n === n)).filter(Boolean);
  $("ot").innerHTML = otDoc(m, ps, ot);
  toast("Preparando la orden…");
  await cargarTodas($("ot"));
  document.body.classList.add("imprimiendo-ot");
  await new Promise(r => setTimeout(r, 200));
  window.print(); document.body.classList.remove("imprimiendo-ot");
}
function otDoc(m, ps, ot){
  const temas = m.temas.filter(t => ps.some(p => p.tema === t.key));
  return `<div class="otdoc"><div class="oth"><span class="g">${document.querySelector(".logo-g").innerHTML}</span><span class="prof"><b>Lic. Marcelo Elvira</b><br>Lic. en Higiene y Seguridad en el Trabajo · M.P. 0656 C.P.I.I.</span></div>
  <h1>Orden de trabajo</h1><div class="sub">${esc(ot.numero)} · Higiene y Seguridad · según el informe de visita ${m.clave} (visita del ${m.visita})</div>
  <div class="datos"><div><b>Dirigida a</b>${esc(otNombre(ot))}</div><div><b>Fecha</b>${esc(ot.fecha)}</div><div><b>Pedida por</b>${esc(ot.quien)}</div><div><b>Puntos</b>${ps.length}</div></div>
  ${ot.texto ? `<div class="obsot"><b>Observaciones:</b> ${esc(ot.texto)}</div>` : ""}
  ${temas.map(t => `<div class="tema"><h2>${esc(t.nombre)}</h2><div class="crit">${esc(t.criterio)}<br><b>Encuadre:</b> ${esc(t.enc)}</div></div>`
    + ps.filter(p => p.tema === t.key).map(p => `<div class="p"><span class="nn">${p.n}</span><div><div class="t">${esc(p.titulo)}</div><div class="s">${esc(p.lugar)}</div><div class="a"><b>Acción:</b> ${esc(p.rec)}</div></div><div class="ff">${p.fotos.slice(0, 2).map(f => img(f)).join("")}</div><div class="hecho">☐ Hecho · Fecha: ____/____/______ · Firma: ______________________ · Observaciones: ____________________________________</div></div>`).join("")).join("")}
  <div class="firmas"><div>Entregó (${esc(CFG.nombre)})<span>Aclaración:</span><span>Fecha:</span></div><div>Recibió<span>Aclaración:</span><span>Fecha:</span></div></div>
  <div class="pie">Al terminar cada punto, marcarlo «Listo para verificar» en el portal de Higiene y Seguridad (filtro «Orden de trabajo» → ${esc(ot.numero)}). Las fotos en grande de cada punto van en las hojas siguientes.</div>
  <div class="anexo"><h1>Fotos de los puntos</h1><div class="sub">${esc(ot.numero)} · dirigida a ${esc(otNombre(ot))} · una hoja por punto</div>
  ${ps.map((p, i) => `<div class="ap${i ? "" : " prim"}"><div class="cab"><span class="nn">${p.n}</span><span class="t">${esc(p.titulo)}</span></div><div class="s">${esc(p.lugar)} · ${esc(corto(temaDe(m, p.tema).nombre))}</div><div class="a"><b>Acción:</b> ${esc(p.rec)}</div><div class="gal${p.fotos.length === 1 ? " una" : ""}">${p.fotos.map(f => img(f)).join("")}</div>${avance(m, p).length ? `<div class="avt">Avance cargado en el portal</div><div class="gal">${avance(m, p).map(a => img(a.f)).join("")}</div>` : ""}</div>`).join("")}</div></div>`;
}
function verOT(num){
  const o = ORDENES.find(x => x.numero === num); if (!o) return;
  const m = mesDe(o.mes); if (!m) return;
  const ps = o.puntos.map(n => m.puntos.find(p => p.n === n)).filter(Boolean);
  $("velo").innerHTML = `<div class="caja otvista" role="dialog" aria-modal="true" aria-labelledby="ovT"><div class="cab"><h3 id="ovT">${esc(o.numero)}</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="otacc"><button class="btn prim" type="button" data-bajot="${esc(o.numero)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"/></svg>Imprimir o guardar en PDF</button>
      <button class="btn" type="button" data-otf="${esc(o.numero)}" data-otm="${esc(o.mes)}">Ver sus puntos en la lista</button><span style="flex:1"></span>
      <button class="btn peligro" type="button" id="otBorrarA">Borrar esta orden</button></div>
    <div class="borrar" id="otBorrar" hidden><b>¿Borrar ${esc(o.numero)}?</b><span class="aviso">Deja de aparecer en el portal. Sirve para órdenes armadas por error.</span>
      <input id="obM" type="text" placeholder="Motivo (por ejemplo: la armé con puntos equivocados)">
      <div style="display:flex;gap:10px"><button class="btn peligro" type="button" data-borrarot="${esc(o.numero)}">Sí, borrarla</button><button class="link" type="button" id="otBorrarNo">No, dejarla</button></div></div>
    ${otDoc(m, ps, o)}</div></div>`;
  $("velo").hidden = false;
}
async function borrarOT(num){
  const q = quien(), mot = $("obM").value.trim();
  if (!mot){ toast("Escribí el motivo"); $("obM").focus(); return; }
  setQuien(q);
  const o = ORDENES.find(x => x.numero === num);
  const r = await enviar({tipo: "borrar-orden", numero: num, mes: o ? o.mes : st.mes, puntos: o ? o.puntos : [], dirigida: o ? otNombre(o) : "", quien: q, texto: mot});
  if (!r.ok){ toast("No se pudo borrar. Probá de nuevo."); return; }
  ORDENES = ORDENES.filter(x => x.numero !== num); if (st.ot === num) st.ot = "";
  $("velo").hidden = true; render(); toast("Orden " + num + " borrada");
}

// ---------- sugerir nombre de sector ----------
function abrirSug(s){
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="sgT" style="width:min(560px,100%)"><div class="cab"><h3 id="sgT">Sugerir otro nombre</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="form"><label>Nombre en el informe</label><input type="text" value="${esc(s)}" readonly id="sgA"></div>
    <div class="form"><label for="sgN">Cómo lo llaman en ${esc(CFG.nombre)}</label><input id="sgN" type="text" placeholder="Por ejemplo: Taller de mantenimiento"></div>
    <div class="form"><label for="sgC">Comentario (opcional)</label><textarea id="sgC" rows="2" placeholder="Dónde queda, si incluye otro sector…"></textarea></div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn prim" type="button" id="sgEnv">Enviar sugerencia</button><span class="aviso">Le llega al Lic. Elvira; si la valida, el nombre cambia en los próximos informes y en esta página.</span></div>
  </div></div>`;
  $("velo").hidden = false;
}
async function enviarSug(){
  const n = $("sgN").value.trim(), q = quien();
  if (!n){ toast("Escribí el nombre sugerido"); $("sgN").focus(); return; }
  setQuien(q);
  const r = await enviar({tipo: "sector", sector: $("sgA").value, sugerido: n, texto: $("sgC").value.trim(), quien: q});
  if (!r.ok){ toast("No se pudo enviar. Probá de nuevo."); return; }
  $("velo").hidden = true; toast("Sugerencia enviada. ¡Gracias!");
}

function csv(){
  const m = M(), l = SEL.size ? selPuntos() : filtrar(), q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const rows = [["Informe", "N.º", "Tema", "Planta / sector", "Observación", "Acción a realizar", "Reincidencia", "Seguimiento", "Órdenes de trabajo"]]
    .concat(l.map(p => [m.clave, p.n, temaDe(m, p.tema).nombre, p.lugar, p.titulo, p.rec, p.ref ? "Punto " + p.ref + " del " + m.anterior : "Nuevo", ultEstado(m, p), otsDe(m, p).map(o => o.numero + " (" + otNombre(o) + ")").join(" / ")]));
  const b = new Blob(["﻿" + rows.map(r => r.map(q).join(";")).join("\r\n")], {type: "text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${CFG.nombre} informe ${m.clave}${st.ot && st.ot.startsWith("OT") ? " " + st.ot : ""}.csv`; a.click();
}
async function imprimirLista(){ toast("Preparando…"); await cargarTodas($("lista")); window.print(); }

// ---------- eventos ----------
document.addEventListener("click", e => {
  const t = e.target;
  if (t.matches("[data-ck]")){ const m = M(), k = m.clave + "|" + t.dataset.ck; t.checked ? SEL.add(k) : SEL.delete(k); const f = document.querySelector(`.fila[data-n="${t.dataset.ck}"]`); if (f) f.classList.toggle("sel", t.checked); selbar(); nsel(); return; }
  if (t.closest(".ck")) return;
  if (t.closest("#salir")){ salir(); return; }
  const of = t.closest("[data-otf]"); if (of){ if (of.dataset.otm && of.dataset.otm !== st.mes && mesDe(of.dataset.otm)){ st.mes = of.dataset.otm; st.sector = ""; st.tema = ""; st.soloSel = false; } st.ot = st.ot === of.dataset.otf && of.classList.contains("lot") ? "" : of.dataset.otf; $("velo").hidden = true; render(); scrollTo(0, 0); return; }
  const vo = t.closest("[data-verot]"); if (vo){ verOT(vo.dataset.verot); return; }
  if (t.closest("#otBorrarA")){ $("otBorrar").hidden = false; $("obM").focus(); return; }
  if (t.closest("#otBorrarNo")){ $("otBorrar").hidden = true; return; }
  const bb = t.closest("[data-borrarot]"); if (bb){ borrarOT(bb.dataset.borrarot); return; }
  const rk = t.closest(".rkr"); if (rk){ st.tema = st.tema === rk.dataset.t ? "" : rk.dataset.t; render(); return; }
  const tg = t.closest("[data-tg]"); if (tg && !t.closest("button")){ const k = tg.dataset.tg; CERR.has(k) ? CERR.delete(k) : CERR.add(k); tg.parentNode.classList.toggle("cerrado", CERR.has(k)); return; }
  const bo = t.closest("[data-bajot]"); if (bo){ const o = ORDENES.find(x => x.numero === bo.dataset.bajot); if (o){ $("velo").hidden = true; imprimirOT(o); } return; }
  const sug = t.closest("[data-sug]"); if (sug){ abrirSug(sug.dataset.sug); return; }
  const mb = t.closest("[data-mes]"); if (mb){ st.mes = mb.dataset.mes; st.sector = ""; st.tema = ""; st.ot = ""; st.soloSel = false; render(); return; }
  const tb = t.closest("#fTipo button"); if (tb){ st.tipo = tb.dataset.v; document.querySelectorAll("#fTipo button").forEach(b => b.setAttribute("aria-pressed", b === tb)); render(); return; }
  if (t.closest("#limpiar")){ Object.assign(st, {sector: "", tema: "", tipo: "todos", seg: "todos", ot: "", q: "", soloSel: false}); $("fQ").value = ""; $("fSeg").value = "todos"; document.querySelectorAll("#fTipo button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === "todos")); render(); return; }
  if (t.closest("#selFilt")){ const m = M(); filtrar().forEach(p => SEL.add(key(m, p))); render(); return; }
  const sg = t.closest("[data-selg]"); if (sg){ const m = M(); sg.dataset.selg.split(",").forEach(n => SEL.add(m.clave + "|" + n)); render(); return; }
  if (t.closest("#selLimpiar")){ SEL.clear(); st.soloSel = false; render(); return; }
  if (t.closest("#selVer")){ st.soloSel = !st.soloSel; render(); scrollTo(0, 0); return; }
  if (t.closest("#selOT")){ abrirOT(); return; }
  const qt = t.closest("[data-quitar]"); if (qt){ SEL.delete(M().clave + "|" + qt.dataset.quitar); render(); if (SEL.size) abrirOT(); else $("velo").hidden = true; return; }
  if (t.closest("#otGen")){ generarOT(); return; }
  if (t.closest("#sgEnv")){ enviarSug(); return; }
  if (t.closest("#sGuardar")){ guardarSeg(); return; }
  const qf = t.closest("[data-qf]"); if (qf){ NUEVAS.splice(Number(qf.dataset.qf), 1); prevNuevas(); return; }
  const es = t.closest("[data-est]"); if (es){ es.parentNode.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === es)); return; }
  const c = t.closest(".fila[data-n]"); if (c){ abrir(Number(c.dataset.n)); return; }
  if (t.id === "velo" || t.closest("[data-cerrar]")){ $("velo").hidden = true; return; }
  if (t.closest("#pPrev")){ fi = (fi - 1 + fotosDet.length) % fotosDet.length; foto(); return; }
  if (t.closest("#pNext")){ fi = (fi + 1) % fotosDet.length; foto(); return; }
  const ti = t.closest("[data-i]"); if (ti){ fi = Number(ti.dataset.i); foto(); return; }
  const hf = t.closest("[data-f]"); if (hf){ fi = Math.max(0, fotosDet.findIndex(x => x.f === hf.dataset.f)); foto(); return; }
  if (t.closest("#bPdf")){ const m = M(); bajarPdf(m.pdfk || m.clave, m.pdf); return; }
  if (t.closest("#bFilt")){ imprimirLista(); return; }
  if (t.closest("#bCsv")){ csv(); return; }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "sFotos" && t.files.length){ const fs = [...t.files].slice(0, 6 - NUEVAS.length); t.value = ""; (async () => { for (const f of fs){ try { NUEVAS.push(await achicar(f)); } catch(e){ toast("No se pudo leer una foto"); } } prevNuevas(); })(); if (NUEVAS.length + fs.length >= 6) toast("Hasta 6 fotos por vez"); }
  if (t.id === "fArch" && t.value){ const a = DATA.archivo.find(x => x.clave === t.value); t.value = ""; if (a) bajarPdf(a.clave, a.pdf); }
  if (t.id === "fSector"){ st.sector = t.value; render(); }
  if (t.id === "fTema"){ st.tema = t.value; render(); }
  if (t.id === "fSeg"){ st.seg = t.value; render(); }
  if (t.id === "fOT"){ st.ot = t.value; render(); }
  if (t.id === "fOrden"){ st.orden = t.value; render(); }
  if (t.name === "ls"){ st.sector = t.dataset.s; render(); }
});
$("fQ").addEventListener("input", e => { st.q = e.target.value; render(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") $("velo").hidden = true; if (e.key === "Enter" && e.target.classList && e.target.classList.contains("rkr")) e.target.click(); });

function arrancar(){
  if (!CIFRADO) ADMIN = USUARIO.admin;
  st.mes = DATA.meses[0].clave;
  if (DATA.api){ API_URL = DATA.api.url || ""; API_TOKEN = (USUARIO && USUARIO.token) || ""; }
  if (!API_URL){ NOTAS = JSON.parse(JSON.stringify(DATA.ejemplo || {})); ORDENES = JSON.parse(JSON.stringify(DATA.ejemplo_ot || [])); otNum = ORDENES.length; }
  CLI.inicio(); solapas(); render(); cargarEstado();
}

window.PORTAL = {st, SEL, render, abrir, abrirOT, abrirSug, otDoc, imprimirOT, cargarTodas, verOT, M, selPuntos, get ORDENES(){ return ORDENES; }};
