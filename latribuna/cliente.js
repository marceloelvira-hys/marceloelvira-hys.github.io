// ---------- La Tribuna: solapas (informe, SAP, estudios y matafuegos, capacitación, EPP, ante una inspección, descargas) ----------
// Base: portal MIT sin selector de planta (un solo local). PL queda fijo para reusar el código del informe.
// Lo común (textos editables, publicación por sección, descargas, subir constancia, proponer fecha, video) está en core/v1/modulos.js;
// acá van las opciones de este cliente (MOD) y lo propio. Una función con el mismo nombre que una del módulo la pisa.
Object.assign(MOD, {propHorario: "16:00 a 16:45, entre turnos", quien: "el local", delLugar: "del local", sapEncuadre: "con el subsuelo en uso",
  capTitulo: "Capacitaciones propuestas para el local", capCuando: "Cuándo", capReg: true,
  capIntro: "Las capacitaciones previstas para el personal: se puede proponer la fecha y el horario de cada una. Abajo, las constancias firmadas; también se pueden subir desde acá.",
  esgPieNombre: true,
  descargas: [{t: "Habilitación y Autoprotección", c: "var(--brand)", de: [["oblea"], ["plano-hab"], ["sap-car"], ["ddjj"], ["planos-ev"]]},
    {t: "Estudios", c: "var(--celeste-dk)", de: ["@estudios"]},
    {t: "Formularios para completar", c: "#2F7D4A", de: [["dotacion"], ["cons-sap"], ["epp299"]]},
    {t: "Actas de inspección", c: "#6E1E2E", de: [["acta1"], ["acta2"]]}]});
const TABS = [["informe", "Informe de visita"], ["sap", "Autoprotección"], ["hys", "Estudios y matafuegos"], ["cap", "Capacitación"], ["epp", "EPP"], ["insp", "Ante una inspección"], ["dl", "Descargas"]];
let TAB = "informe", PL = "P1";

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {inicio: modInicio, estado: modEstado});
