// ---------- solapas de La Madrileña: documentación, HyS, EPP, máquinas, descargas ----------
const TABS = [["informe", "Informe de visita"], ["docs", "Documentación pedida"], ["hys", "Documentación de HyS"], ["epp", "EPP"], ["maq", "Máquinas"], ["senal", "Señalización"], ["dl", "Descargas"]];
const DOCST = {FALTA: "Falta", PARCIAL: "Parcial", CONFIRMAR: "A confirmar", NUESTRO: "Lo hacemos nosotros", OK: "Presentado"};
let TAB = "informe", MAQ = "embaladora";
// 4/11/2026: la ficha de máquina todavía no se muestra en la página (sí el simulador)
const OCULTOS = ["ficha-emb"];
let XF = null;
// ---------- publicación por sección (6/11/2026, como MIT): el Lic. decide qué ve el cliente ----------
let PUB = null;
const PUB_DEF = {informe: true, docs: true, hys: true, epp: true, maq: true, dl: true, senal: false};   // lo que ya estaba a la vista sigue publicado; lo nuevo entra en revisión
const pubOn = k => PUB && PUB[k] !== undefined ? PUB[k] : !!PUB_DEF[k];
const tabsVis = () => TABS.filter(([k]) => ADMIN || pubOn(k));
const pubCtl = k => ADMIN ? `<div class="pub ${pubOn(k) ? "on" : ""}"><span>${pubOn(k) ? "✔ Sección publicada: La Madrileña la ve" : "🚧 En revisión: La Madrileña todavía no la ve"}</span><button type="button" class="x-btn" data-pub="${k}">${pubOn(k) ? "Sacar de la publicación" : "Publicar esta sección"}</button></div>` : "";
function lmEstado(j){
  PUB = j.publicacion || PUB || {};
  if (j.senal){ try { const n = JSON.parse(j.senal); if (!SN_EST || (n.ts || 0) >= (SN_EST.ts || 0)) SN_EST = n; } catch(e){} }
  solapas(); if (!tabsVis().some(t => t[0] === TAB)){ irA((tabsVis()[0] || ["informe"])[0]); return; }
  if (!$("vExtra").hidden) renderExtra();
}
const X = () => { const e = DATA.extra; if (e && XF !== e){ XF = e; e.maquinas.forEach(m => m.archivos = m.archivos.filter(k => !OCULTOS.includes(k))); e.grupos.forEach(g => g.items = g.items.filter(i => !OCULTOS.includes(i.k))); } return e; };
function solapas(){
  const pend = X().docs.filter(d => d.estado === "FALTA" || d.estado === "PARCIAL").length;
  $("solapasW").innerHTML = tabsVis().map(([k, t]) => `<button type="button" data-tab="${k}" aria-pressed="${k === TAB}"${ADMIN && !pubOn(k) ? ' class="wip" title="En revisión: La Madrileña no la ve"' : ""}>${ADMIN && !pubOn(k) ? "🚧 " : ""}${t}${k === "docs" && pend ? `<i>${pend}</i>` : ""}${k === "informe" ? `<i>${DATA.meses[0].puntos.length}</i>` : ""}</button>`).join("");
  const pi = $("pubInf"); if (pi) pi.innerHTML = ADMIN ? pubCtl("informe") : "";
}
function irA(k){
  TAB = k; solapas(); document.body.classList.toggle("extra", k !== "informe");
  $("vInforme").hidden = k !== "informe"; $("vExtra").hidden = k === "informe";
  if (k !== "informe") renderExtra(); else render();
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
const btnDl = (k, txt) => `<button type="button" class="x-btn" data-dl="${k}">↓ ${esc(txt || X().archivos[k].nombre.replace(/\.(pdf|html)$/, ""))}</button>`;
function vDocs(){
  const ds = X().docs, ord = {FALTA: 0, PARCIAL: 1, CONFIRMAR: 2, NUESTRO: 3, OK: 4}, c = k => ds.filter(d => d.estado === k).length;
  return `<h2>Documentación pedida a La Madrileña</h2><p class="x-intro">Lo que se pidió en el presupuesto del 24/8/2026 y en el informe 8-26, con su estado al ${esc(X().fecha)}. Cuando manden algo, avisen desde acá: queda registrado y le llega al Lic. Marcelo Elvira.</p>
  <div class="x-kpis">${["FALTA", "PARCIAL", "CONFIRMAR", "NUESTRO", "OK"].map(k => `<div class="x-kpi"><b class="x-st ${k}" style="background:none;padding:0;font-size:22px">${c(k)}</b><span>${DOCST[k].toLowerCase()}</span></div>`).join("")}</div>
  <div class="x-box"><div class="x-bh">Documentación pedida<span>ordenada por lo que falta</span></div>
  <div class="x-row x-docs h"><span>Documento</span><span>Para qué</span><span>Estado</span><span>Situación</span><span></span></div>
  ${[...ds].sort((a, b) => ord[a.estado] - ord[b.estado]).map((d, i) => `<div class="x-row x-docs"><div><div class="x-t">${esc(d.doc)}</div><div class="x-m">Lo pide: ${esc(d.pide)}</div></div><div class="x-m">${esc(d.para)}</div><div><span class="x-st ${d.estado}">${DOCST[d.estado]}</span></div><div class="x-m">${esc(d.sit) || "—"}</div><div>${d.estado === "OK" || d.estado === "NUESTRO" ? "" : `<button type="button" class="x-btn" data-aviso="${esc(d.doc)}">Avisar que lo envié</button>`}</div></div>`).join("")}</div>`;
}
function grupoBox(g){
  if (g.id === "est") return `<div class="g-box" style="--c:${g.color}"><h3>${esc(g.titulo)}</h3><span class="x-m">Se genera en el momento, con lo último cargado en el portal</span><div class="g-sel"><button type="button" class="g-btn" data-esg="1">Generar e imprimir</button></div></div>`;
  const sel = g.mes ? `<div class="g-sel"><select id="sel-${g.id}">${g.items.map(i => `<option value="${i.k}">${esc(i.t)}</option>`).join("")}</select><button type="button" class="g-btn" data-dlsel="${g.id}">Descargar</button></div>`
    : `<div class="g-list">${g.items.map(i => `<div class="g-it"><span>${esc(i.t)}</span><button type="button" class="g-btn" data-dl="${i.k}">${X().archivos[i.k].tipo === "text/html" ? "Abrir" : "Descargar"}</button></div>`).join("")}</div>`;
  return `<div class="g-box" style="--c:${g.color}"><h3>${esc(g.titulo)}</h3><span class="x-m">${esc(g.nota)}</span>${sel}</div>`;
}
const G = id => X().grupos.find(g => g.id === id);
function vHys(){
  const e = X().estudios;
  return `<h2>Documentación de higiene y seguridad</h2><p class="x-intro">Informes, estudios y formularios, con su estado al ${esc(X().fecha)}.</p>
  <div class="g-row">${grupoBox(G("inf"))}${grupoBox(G("est"))}</div>
  <div class="g-sec">Estudios</div>
  <div class="x-box" style="border-top:5px solid #2E5FA3"><div class="x-row x-est h"><span>Estudio</span><span>Norma</span><span>Vigencia</span><span>Estado</span><span>Situación</span><span>Documento</span></div>
  ${e.map(s => `<div class="x-row x-est"><div class="x-t">${esc(s.estudio)}</div><div class="x-m">${esc(s.norma)}</div><div class="x-m">${esc(s.vigencia)}</div><div class="x-e ${s.estado}">${esc(s.estado)}</div><div class="x-m">${esc(s.sit)}</div><div class="x-dl">${s.archivos.filter(k => k !== "11-26" && k !== "8-26").map(k => btnDl(k, ({pat: "Protocolo PAT", planos: "Planos de evacuación", ilu: "Estudio completo"})[k] || "")).join("") || (s.archivos.length ? `<span class="x-m">Arriba, en Informes de visita</span>` : `<span class="x-m">Se publica al terminar</span>`)}</div></div>`).join("")}</div>
  <div class="g-sec">Formularios para completar</div>
  <div class="x-box" style="border-top:5px solid #2F7D4A">${X().formularios.map(f => `<div class="x-row x-cot" style="grid-template-columns:1.3fr 1.4fr 230px"><div><div class="x-t">${esc(f.nombre)}</div><div class="x-m">${esc(f.uso)}</div></div><div class="x-m"><b>Normativa:</b> ${esc(f.norma)}</div><div>${btnDl(f.archivo, "Bajar la constancia (PDF)")}</div></div>`).join("")}</div>
  <div class="g-sec">Otros estudios que corresponden al establecimiento</div>
  <div class="x-box" style="border-top:5px solid #9AA0A6">${X().cotizar.map(c => `<div class="x-row x-cot"><div class="x-t">${esc(c.estudio)}</div><div class="x-m">${esc(c.norma)}</div><div><span class="x-st CONFIRMAR">A presupuestar</span></div></div>`).join("")}</div>`;
}
function vEpp(){
  const t = X().tareas;
  return `<h2>Elementos de protección personal</h2><p class="x-intro">Dónde hay que usar cada elemento, según las tareas relevadas el 3/11/2026.</p>
  <div class="x-box"><div class="x-bh">Elemento por tarea</div><div class="x-mxw"><table class="x-mx"><tr><th style="width:24%">Elemento</th>${t.map(x => `<th>${esc(x)}</th>`).join("")}</tr>
  ${X().epp.map(e => `<tr><td><b>${esc(e.elem)}</b><div class="x-m">${esc(e.det)}</div></td>${t.map((_, i) => e.tareas.includes(i) ? `<td><span class="x-dot" title="Se usa"></span></td>` : `<td class="x-no">—</td>`).join("")}</tr>`).join("")}</table></div></div>
  <div class="x-cards">${X().epp.map(e => `<div class="x-card"><b>${esc(e.elem)}</b><span class="x-m">${esc(e.cuando)}</span></div>`).join("")}</div>
  <div class="x-note"><span style="flex:1;min-width:240px">${esc(X().epp_nota)} La entrega de cada elemento se registra en la constancia de la Res. SRT 299/11, firmada por el trabajador.</span>${btnDl("epp299", "Constancia de entrega de EPP")}</div>`;
}
function vMaq(){
  const ms = X().maquinas, m = ms.find(x => x.id === MAQ) || ms[0], li = xs => xs.map(x => `<li>${esc(x)}</li>`).join("");
  return `<h2>Máquinas</h2><p class="x-intro">Equipos relevados en la visita del 3/11/2026. Tocá una máquina para ver sus datos, los EPP que hay que usar y las recomendaciones.</p>
  <div class="x-maqs">${ms.map(x => `<button type="button" class="x-maq${x.id === m.id ? " on" : ""}" data-maq="${x.id}">${img(x.foto)}<div><b>${esc(x.nombre)}</b><span class="x-m">${esc(x.marca)}</span></div></button>`).join("")}</div>
  <div class="x-det"><div>${img(m.foto, 'class="big"')}<div class="x-m" style="margin-top:6px">${esc(m.donde)}</div></div>
  <div><h4>Datos</h4><b style="font-size:16px">${esc(m.nombre)}</b><div class="x-m" style="margin-bottom:8px">${esc(m.marca)}</div><ul>${li(m.datos)}</ul><h4>Riesgos</h4><ul>${li(m.riesgos)}</ul></div>
  <div><h4>EPP obligatorios</h4><div class="x-epp">${m.epp.map(e => `<span>${esc(e)}</span>`).join("")}</div><h4>Recomendaciones</h4><ul>${li(m.rec)}</ul>
  ${m.archivos.length ? `<h4>Material</h4><div class="x-dl">${m.archivos.map(k => btnDl(k, k.startsWith("sim") ? "Abrir el simulador" : "Ficha de máquina (PDF)")).join("")}</div>` : ""}</div></div>`;
}
function vDl(){
  const gs = X().grupos;
  return `<h2>Descargas</h2><p class="x-intro">Todo lo de La Madrileña para bajar, agrupado por tipo.</p>
  <div class="g-row">${grupoBox(G("inf"))}${grupoBox(G("est"))}</div>
  <div class="g-row">${gs.filter(g => !g.mes).map(grupoBox).join("")}</div>`;
}
function renderExtra(){ $("vExtra").innerHTML = pubCtl(TAB) + ({docs: vDocs, hys: vHys, epp: vEpp, maq: vMaq, senal: vSenal, dl: vDl})[TAB](); if (TAB === "senal") cargarSnApp(); }
// ---------- señalización (6/11/2026): la app de carteles adentro del portal ----------
// El Lic. (modo admin) la edita y la guarda en la planilla; el cliente sólo la ve, la recorre e imprime/guarda en PDF.
let SN_EST = null, SN_HTML = null, SN_URL = null, SN_KEY = "";
function vSenal(){
  const s = X().senal || {};
  return `<h2>Señalización</h2><p class="x-intro">${esc(s.intro || "")}</p>
  <div class="x-note"><span style="flex:1;min-width:240px">${ADMIN ? "Movés, agregás o borrás carteles directamente en el plano y tocás <b>«Guardar en el portal»</b>: La Madrileña ve siempre la última versión guardada." : "Elegí la planta arriba del plano. Con «Imprimir / PDF» se baja la propuesta completa (los tres planos y el resumen); en el diálogo de impresión elegí «Guardar como PDF» y hoja A3 apaisada."}</span></div>
  <div class="sn-app"><iframe id="snFrame" title="Señalización"></iframe><div class="sn-carga" id="snCarga">Abriendo los planos…</div></div>`;
}
async function cargarSnApp(){
  const fr = $("snFrame"); if (!fr) return;
  try {
    if (!SN_HTML){ const b = CIFRADO ? await bajarCifrado("arch/senal_app") : await (await fetch("arch/senal_app")).arrayBuffer(); SN_HTML = new TextDecoder().decode(b); }
    const modo = ADMIN ? "admin" : "cliente", est = SN_EST ? JSON.stringify(SN_EST).replace(/<\//g, "<\\/") : null, key = modo + "|" + (est ? est.length + ":" + (SN_EST.ts || 0) : "base");
    if (key !== SN_KEY){
      let h = SN_HTML.replace("<head>", `<head><script>window.PORTAL_MODO=${JSON.stringify(modo)};<\/script>`);
      if (est) h = h.replace(/(<script id="estado" type="application\/json">)[\s\S]*?(<\/script>)/, (m, a, c) => a + est + c);
      if (SN_URL) URL.revokeObjectURL(SN_URL);
      SN_URL = URL.createObjectURL(new Blob([h], {type: "text/html"})); SN_KEY = key;
    }
    if (fr.src !== SN_URL) fr.src = SN_URL;
    fr.onload = () => { const c = $("snCarga"); if (c) c.hidden = true; };
  } catch(e){ const c = $("snCarga"); if (c) c.textContent = "No se pudieron abrir los planos. Recargá la página."; }
}
window.addEventListener("message", async e => {
  const m = e.data || {}, fr = $("snFrame"); if (m.tipo !== "senal-guardar" || !fr || e.source !== fr.contentWindow || !ADMIN) return;
  const txt = JSON.stringify(m.estado);
  const r = txt.length > 49000 ? {ok: false} : await enviar({tipo: "senal", estado: txt});
  if (r.ok){ SN_EST = m.estado; SN_KEY = (ADMIN ? "admin" : "cliente") + "|" + JSON.stringify(SN_EST).replace(/<\//g, "<\\/").length + ":" + (SN_EST.ts || 0); toast("Señalización guardada: La Madrileña ya ve esta versión"); }
  else toast("No se pudo guardar la señalización");
  fr.contentWindow.postMessage({tipo: "senal-ok", ok: !!r.ok}, "*");
});
document.addEventListener("click", e => {
  const p = e.target.closest("[data-pub]");
  if (p){ const k = p.dataset.pub, on = !pubOn(k); PUB = PUB || {}; PUB[k] = on;
    enviar({tipo: "publicar", seccion: k, on}).then(r => toast(r.ok ? (on ? "Sección publicada: La Madrileña ya la ve" : "Sección sacada de la publicación") : "No se pudo guardar"));
    solapas(); if (!$("vExtra").hidden) renderExtra(); return; }
});
function abrirAviso(doc){
  $("velo").innerHTML = `<div class="caja" role="dialog" aria-modal="true" aria-labelledby="avT" style="width:min(560px,100%)"><div class="cab"><h3 id="avT">Avisar que se envió</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="cpo">
    <div class="form"><label>Documento</label><input type="text" value="${esc(doc)}" readonly id="avD"></div>
    <div class="form"><label for="avC">Comentario (opcional)</label><textarea id="avC" rows="2" placeholder="Por dónde se mandó, si falta algo…"></textarea></div>
    <span class="aviso">Se guarda a nombre de <b>${esc(quien())}</b>.</span>
    <div style="display:flex;gap:10px"><button class="btn prim" type="button" id="avEnv">Avisar</button></div></div></div>`;
  $("velo").hidden = false;
}
async function enviarAviso(){
  const q = quien();
  setQuien(q); $("avEnv").disabled = true;
  const r = await enviar({tipo: "documento", sector: $("avD").value, texto: $("avC").value.trim(), quien: q});
  if (!r.ok){ toast("No se pudo enviar. Probá de nuevo."); $("avEnv").disabled = false; return; }
  $("velo").hidden = true; toast("Aviso enviado. Gracias.");
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-tab],[data-dl],[data-dlsel],[data-maq],[data-aviso],#avEnv"); if (!t) return;
  if (t.dataset.dlsel){ bajarArch($("sel-" + t.dataset.dlsel).value); return; }
  if (t.dataset.tab) irA(t.dataset.tab);
  else if (t.dataset.dl) bajarArch(t.dataset.dl);
  else if (t.dataset.maq){ MAQ = t.dataset.maq; renderExtra(); }
  else if (t.dataset.aviso) abrirAviso(t.dataset.aviso);
  else if (t.id === "avEnv") enviarAviso();
});

// ---------- estado de situación general a demanda (5/11/2026) ----------
const ESG_COL = {FALTA: "#C0392B", PARCIAL: "#B7791F", CONFIRMAR: "#555B66", NUESTRO: "#2E5FA3", OK: "#2E7D32", EJECUTADO: "#2E7D32", "EN CURSO": "#B7791F", "A PROGRAMAR": "#2E5FA3", "SIN FUENTES": "#777777", POSTERIOR: "#777777"};
const ESG_LBL = {FALTA: "FALTA", PARCIAL: "PARCIAL", CONFIRMAR: "A CONFIRMAR", NUESTRO: "LO HACEMOS NOSOTROS", OK: "PRESENTADO"};
let ESG_FIRMA = "";
function esgDoc(gen){
  const x = X(), g = x.esg || {}, m = DATA.meses[0];
  const est = p => { const e = ultEstado(m, p); return e || "Pendiente"; };
  const filas = m.temas.map(t => { const ps = m.puntos.filter(p => p.tema === t.key), c = f => ps.filter(f).length;
    return {nombre: t.nombre, n: ps.length, a: c(p => p.prio === "ALTA"), me: c(p => p.prio === "MEDIA"), b: c(p => p.prio === "BAJA"), cu: c(p => est(p) === "En curso"), li: c(p => est(p) === "Listo para verificar"), re: c(p => est(p) === "Resuelto")}; })
    .filter(f => f.n).sort((a, b) => b.n - a.n);
  const tot = k => filas.reduce((s, f) => s + f[k], 0), d = v => v || "—";
  const ord = {FALTA: 0, PARCIAL: 1, CONFIRMAR: 2, NUESTRO: 3, OK: 4};
  const st = (s, l) => `<b style="color:${ESG_COL[s] || "#333"};font-size:8pt">${esc(l || s)}</b>`;
  return `<table class="esg-pg"><tbody><tr><td>
  <div class="esg-mem"><b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo</span><small>M.P. 0656 C.P.I.I. · 15-4564-6462 · marcelo.a.elvira@gmail.com</small></div>
  <h1>Estado de situación general</h1>
  <div class="esg-fe">Higiene y Seguridad en el Trabajo · última actualización: ${esc(x.fecha)} · <b>informe generado el ${esc(gen)}</b></div>
  <table class="esg-t esg-dat"><tr><th>Cliente</th><td>${esc(g.razon || DATA.cliente)}</td><th>CUIT</th><td>${esc(g.cuit || "")}</td></tr>
  <tr><th>Establecimiento</th><td>${esc(g.establecimiento || "")}</td><th>Superficie</th><td>${esc(g.superficie || "")}</td></tr>
  <tr><th>Domicilio</th><td>${esc(g.domicilio || DATA.domicilio)}</td><th>Encuadre</th><td>${esc(g.encuadre || "")}</td></tr></table>
  <div class="esg-bar">1. PUNTOS DEL INFORME ${esc(m.clave)} POR TEMA</div>
  <table class="esg-t"><thead><tr><th>Tema</th><th>Puntos</th><th>Alta</th><th>Media</th><th>Baja</th><th>En curso</th><th>Listos para verificar</th><th>Resueltos</th></tr></thead><tbody>
  ${filas.map(f => `<tr><td>${esc(f.nombre)}</td><td class="c"><b>${f.n}</b></td><td class="c"${f.a ? ' style="color:#C0392B;font-weight:700"' : ""}>${d(f.a)}</td><td class="c">${d(f.me)}</td><td class="c">${d(f.b)}</td><td class="c">${d(f.cu)}</td><td class="c">${d(f.li)}</td><td class="c">${d(f.re)}</td></tr>`).join("")}
  <tr class="tot"><td>Total</td>${["n", "a", "me", "b", "cu", "li", "re"].map(k => `<td class="c">${tot(k)}</td>`).join("")}</tr></tbody></table>
  <p class="esg-n">El detalle de cada punto, con sus fotos y la acción a realizar, está en el informe de visita ${esc(m.clave)} y en el portal. El avance (en curso, listos para verificar y resueltos) es el cargado en el portal al momento de generar este informe.</p>
  <div class="esg-bar">2. ESTUDIOS DE HIGIENE Y SEGURIDAD</div>
  <table class="esg-t"><thead><tr><th style="width:31%">Estudio</th><th style="width:16%">Vigencia</th><th style="width:14%">Estado</th><th>Situación</th></tr></thead><tbody>
  ${x.estudios.map(s => `<tr><td><b>${esc(s.estudio)}</b><small>${esc(s.norma)}</small></td><td>${esc(s.vigencia)}</td><td>${st(s.estado)}</td><td>${esc(s.sit)}</td></tr>`).join("")}</tbody></table>
  <div class="esg-bar">3. DOCUMENTACIÓN SOLICITADA A ${esc((g.corto || "LA MADRILEÑA").toUpperCase())}</div>
  <table class="esg-t"><thead><tr><th style="width:43%">Documento</th><th style="width:15%">Estado</th><th>Situación</th></tr></thead><tbody>
  ${[...x.docs].sort((a, b) => ord[a.estado] - ord[b.estado]).map(o => `<tr><td><b>${esc(o.doc)}</b><small>Para: ${esc(o.para)}</small></td><td>${st(o.estado, ESG_LBL[o.estado])}</td><td>${esc(o.sit) || "—"}</td></tr>`).join("")}</tbody></table>
  ${(g.textos || []).length ? `<div class="esg-bar">4. MÁQUINAS Y ELEMENTOS DE PROTECCIÓN PERSONAL</div>${g.textos.map(t => `<p class="esg-p">${esc(t)}</p>`).join("")}` : ""}
  <div class="esg-fi">${ESG_FIRMA ? `<img src="${ESG_FIRMA}" alt="">` : ""}<b>Lic. Marcelo Elvira</b><span>Lic. en Higiene y Seguridad en el Trabajo · M.P. 0656 C.P.I.I.</span></div>
  </td></tr></tbody><tfoot><tr><td><div class="esg-pie">Estado de situación general — ${esc(g.razon || DATA.cliente)} — ${esc(g.corto_dom || DATA.domicilio)}</div></td></tr></tfoot></table>`;
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
  const t0 = document.title; document.title = `Estado de situación general La Madrileña ${dd(a.getDate())}-${dd(a.getMonth() + 1)}-${String(a.getFullYear()).slice(2)}`;
  document.body.classList.add("imprimiendo-esg");
  await new Promise(r => setTimeout(r, 200));
  window.print(); document.body.classList.remove("imprimiendo-esg"); document.title = t0;
}
document.addEventListener("click", e => { if (e.target.closest("[data-esg]")) imprimirEsg(); });

// ---------- video tutorial «Cómo se usa» (6/11/2026, como GALVASA) ----------
let VIDEO_URL = null;
(function(){
  const b = $("bCsv"); if (!b || $("bVid")) return;
  b.insertAdjacentHTML("afterend", `<button class="btn vidb" id="bVid" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/></svg>Cómo se usa (video)</button>`);
})();
document.addEventListener("click", e => {
  const t = e.target; if (!t || !t.closest) return;
  if (t.id === "velo" || t.closest("[data-cerrar]")) $("velo").querySelectorAll("video").forEach(v => v.pause());
  if (t.closest("#bVid")) verVideo();
}, true);
async function verVideo(){
  $("velo").innerHTML = `<div class="caja vidcaja" role="dialog" aria-modal="true" aria-labelledby="vT"><div class="cab"><h3 id="vT">Cómo se usa el portal</h3><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><video id="vid" controls playsinline preload="auto"></video></div>`;
  $("velo").hidden = false;
  try {
    if (!VIDEO_URL){
      if (!CIFRADO) VIDEO_URL = "video/tutorial.mp4";
      else { toast("Cargando el video…"); VIDEO_URL = URL.createObjectURL(new Blob([await bajarCifrado("video/tutorial.mp4")], {type: "video/mp4"})); }
    }
    const v = $("vid"); if (!v) return; v.src = VIDEO_URL; v.play().catch(() => {});
  } catch(e){ toast("No se pudo cargar el video"); }
}

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {estado: lmEstado, subtFin: m => ` · visita del ${m.visita} · emitido el ${m.emision}`});
