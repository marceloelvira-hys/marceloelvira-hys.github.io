// ---------- OSTRILAP: solapas (informe, SAP, estudios y matafuegos, capacitación, EPP, ante una inspección, descargas) ----------
// Primer portal nuevo sobre el núcleo con módulos (27/11/2026). Un solo establecimiento: PL queda fijo para reusar el código del informe.
// Lo común está en core/v1/modulos.js; acá van sólo las opciones de este cliente (MOD), las solapas y el enganche.
Object.assign(MOD, {propHorario: "a coordinar, dentro del turno de 8 a 16", quien: "la empresa", delLugar: "de la planta",
  capTitulo: "Programa de capacitación 2026", capProg: ["prog", "Programa 2026 (PDF)"], capCuando: "Mes", capReg: false,
  capIntro: "Programa anual: se puede proponer la fecha y el horario de cada charla. Abajo, las constancias firmadas de las capacitaciones dadas; también se pueden subir desde acá.",
  esgAltas: ["Inmediata", "Alta"], esgAltasTxt: "Inmediata o alta",
  informes: [["10-26", "Informe 10-26"], ["4-26", "Informe 4-26"], ["1-26", "Informe 1-26"], ["10-25", "Informe 10-25"], ["8-25", "Informe 8-25"]],
  descargas: [{t: "Autoprotección", c: "var(--brand)", de: ["@sap"]},
    {t: "Estudios", c: "var(--celeste-dk)", de: ["@estudios"]},
    {t: "Capacitación", c: "var(--gold-dk)", de: [["prog"], "@constancias"]},
    {t: "Documentación ante la ART", c: "#6E1E2E", de: [["rar"], ["rgrl"], ["epp299"]]}]});
MOD.esgCol.APROBADO = "#2E7D32";
const TABS = [["informe", "Informe de visita"], ["sap", "Autoprotección"], ["hys", "Estudios y matafuegos"], ["cap", "Capacitación"], ["epp", "EPP"], ["insp", "Ante una inspección"], ["dl", "Descargas"]];
let TAB = "informe", PL = "P1";

// ---- enganche con el núcleo (core/v1/portal.js) ----
Object.assign(CLI, {inicio: modInicio, estado: modEstado, prios: ["inmediata", "alta", "media"],
  prioTxt: n => ` · corrección inmediata ${n("inmediata")}, prioridad alta ${n("alta")} y media o baja ${n("media")}`});
