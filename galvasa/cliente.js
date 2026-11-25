// GALVASA · lo propio del portal (el motor está en core/v1/portal.js)

// ---- video «Cómo se usa», junto a «Planilla (Excel)» ----
$("bCsv").insertAdjacentHTML("afterend", `<button class="btn vidb" id="bVid" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/></svg>Cómo se usa (video)</button>`);
let VIDEO_URL = null;
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
document.addEventListener("click", e => { if (e.target.closest("#bVid")) verVideo(); });
new MutationObserver(() => { if ($("velo").hidden) $("velo").querySelectorAll("video").forEach(v => v.pause()); }).observe($("velo"), {attributes: true, attributeFilter: ["hidden"]});

// ---- solapas: «Informes de visita» e «Investigaciones» (25/11/2026) ----
// Las investigaciones vienen en los datos cifrados (DATA.inv). Cada una con pub:false la ve sólo el Lic. (modo admin), marcada «En revisión».
let TAB = "informe";
const INVS = () => (DATA.inv || []).filter(i => i.pub || ADMIN);
function solapas(){
  const inv = INVS(), s = $("solapas");
  s.hidden = !inv.length;
  if (!inv.length){ if (TAB !== "informe") irA("informe"); return; }
  $("solapasW").innerHTML = [["informe", "Informes de visita", `<i>${DATA.meses[0].puntos.length}</i>`], ["inv", "Investigaciones de accidentes", `<i>${inv.length}</i>`]]
    .map(([k, t, n]) => `<button type="button" data-tab="${k}" aria-pressed="${k === TAB}">${t}${n}</button>`).join("");
}
function irA(k){
  TAB = k; solapas();
  const extra = k !== "informe";
  document.body.classList.toggle("extra", extra);
  $("vInforme").hidden = extra; $("vExtra").hidden = !extra;
  const h1 = document.querySelector(".head .titulo h1"); if (h1){ h1.dataset.orig = h1.dataset.orig || h1.textContent; h1.textContent = extra ? "Investigaciones" : h1.dataset.orig; }
  if (extra){ vInv(); $("subt").textContent = "Investigaciones de accidentes · " + DATA.domicilio; } else render();
  scrollTo({top: 0});
}
const INV_URL = {};
async function invArchivo(ruta, tipo){
  if (INV_URL[ruta]) return INV_URL[ruta];
  const b = CIFRADO ? await bajarCifrado(ruta) : await (await fetch(ruta)).arrayBuffer();
  return INV_URL[ruta] = URL.createObjectURL(new Blob([b], {type: tipo}));
}
function vInv(){
  const inv = INVS(), sel = inv.find(i => i.id === vInv.abierta);
  $("vExtra").innerHTML = sel ? invLeer(sel) : `<h2 class="inv-h2">Investigaciones de accidentes</h2><p class="inv-intro">Informes de investigación de los accidentes ocurridos en el establecimiento, con su reconstrucción en 3D. Se leen acá mismo o se bajan en PDF.</p>
    <div class="inv-lista">${inv.map(i => `<article class="inv-card">
      <div class="inv-top"><span class="inv-fecha">${esc(i.fecha)}</span>${i.pub ? "" : `<span class="inv-wip" title="${esc(CFG.nombre)} todavía no la ve">🚧 En revisión · sólo la ves vos</span>`}<span class="inv-est ${i.final ? "fin" : ""}">${esc(i.estado)}</span></div>
      <h3>${esc(i.titulo)}</h3>
      <dl class="inv-datos">${(i.datos || []).map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>
      ${i.resumen ? `<p class="inv-res">${esc(i.resumen)}</p>` : ""}
      <div class="inv-acc"><button type="button" class="btn prim" data-inv-leer="${esc(i.id)}">📄 Leer el informe</button><button type="button" class="btn" data-inv-pdf="${esc(i.id)}">↓ Bajar el PDF</button>${i.maqueta ? `<button type="button" class="btn" data-inv-tres="${esc(i.id)}">🧊 Ver la reconstrucción 3D</button>` : ""}</div>
    </article>`).join("")}</div>`;
  if (sel) invCargar(sel);
}
function invLeer(i){
  return `<div class="inv-barra"><button type="button" class="btn" data-inv-volver>← Investigaciones</button><b>${esc(i.titulo)} · ${esc(i.fecha)}</b><span class="sp"></span>
    <button type="button" class="btn" data-inv-pdf="${esc(i.id)}">↓ Bajar el PDF</button>${i.maqueta ? `<button type="button" class="btn" data-inv-tres="${esc(i.id)}">🧊 Reconstrucción 3D</button>` : ""}</div>
    ${i.pub ? "" : `<div class="pub"><span>🚧 En revisión: ${esc(CFG.nombre)} todavía no ve esta investigación</span></div>`}
    <div class="inv-doc"><div class="inv-cargando" id="invCarg">Cargando el informe…</div><iframe id="invFr" title="Informe de investigación" hidden></iframe></div>`;
}
async function invCargar(i){
  try {
    const u = await invArchivo(i.informe, "text/html"), fr = $("invFr"); if (!fr) return;
    fr.onload = () => { $("invCarg") && $("invCarg").remove(); fr.hidden = false; const alto = () => { try { fr.style.height = fr.contentDocument.documentElement.scrollHeight + 20 + "px"; } catch(e){} }; alto(); setTimeout(alto, 600); setTimeout(alto, 2000); };
    fr.src = u;
  } catch(e){ const c = $("invCarg"); if (c) c.textContent = "No se pudo cargar el informe. Probá con «Bajar el PDF»."; }
}
async function invPdf(i){
  toast("Preparando el PDF…");
  try { const u = await invArchivo(i.pdf, "application/pdf"), a = document.createElement("a"); a.href = u; a.download = i.pdfNombre || "Investigacion.pdf"; document.body.appendChild(a); a.click(); a.remove(); }
  catch(e){ toast("No se pudo bajar el PDF"); }
}
async function inv3d(i){
  $("velo").innerHTML = `<div class="caja inv3d" role="dialog" aria-modal="true" aria-labelledby="i3T"><div class="cab"><h3 id="i3T">Reconstrucción 3D · ${esc(i.titulo)}</h3><button class="btn" type="button" id="i3Full">⤢ Pantalla completa</button><button class="cerrar" type="button" data-cerrar>Cerrar ✕</button></div><div class="inv3d-c"><div class="inv-cargando">Cargando la maqueta 3D…</div><iframe id="i3Fr" title="Reconstrucción 3D" allow="fullscreen" allowfullscreen hidden></iframe></div></div>`;
  $("velo").hidden = false;
  try { const u = await invArchivo(i.maqueta, "text/html"), fr = $("i3Fr"); if (!fr) return; fr.onload = () => { fr.hidden = false; const c = fr.previousElementSibling; if (c) c.remove(); fr.focus(); }; fr.src = u; }
  catch(e){ toast("No se pudo cargar la maqueta 3D"); }
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-tab],[data-inv-leer],[data-inv-pdf],[data-inv-tres],[data-inv-volver],#i3Full"); if (!t) return;
  const de = id => INVS().find(i => i.id === id);
  if (t.dataset.tab){ vInv.abierta = null; irA(t.dataset.tab); }
  else if (t.dataset.invLeer){ vInv.abierta = t.dataset.invLeer; vInv(); scrollTo({top: 0}); }
  else if (t.dataset.invVolver !== undefined){ vInv.abierta = null; vInv(); }
  else if (t.dataset.invPdf) invPdf(de(t.dataset.invPdf));
  else if (t.dataset.invTres) inv3d(de(t.dataset.invTres));
  else if (t.id === "i3Full"){ const c = document.querySelector(".inv3d-c"); if (c && c.requestFullscreen) c.requestFullscreen().catch(() => {}); }
});

// ---- enganche con el núcleo ----
Object.assign(CLI, {subtFin: m => ` · visita del ${m.visita} · emitido el ${m.emision}`});
