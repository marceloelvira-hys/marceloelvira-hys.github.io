// GALVASA · lo propio del portal (el motor está en core/v1/portal.js)
// Portal de informe solo: no tiene otras solapas.
function solapas(){ $("solapas").hidden = true; }

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

// ---- enganche con el núcleo ----
Object.assign(CLI, {subtFin: m => ` · visita del ${m.visita} · emitido el ${m.emision}`});
