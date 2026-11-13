// Datos de la animación de evacuación por pisos — Escuela del Mirador
// Coordenadas en "unidades g": la imagen del plano llevada a 2000 px de ancho (grillas de revisión).
// f = ancho original / 2000 ; mg = unidades g por metro (estimado con aulas de ~7 m)
const PLANS = {
  B3: { img: 'img/B_3P.png', W: 3365, H: 1519, mg: 34.5, crop: [40, 30, 1990, 830], piso: 3, sector: 'B' },
  B2: { img: 'img/B_2P.png', W: 3396, H: 1505, mg: 32.4, crop: [40, 30, 1960, 830], piso: 2, sector: 'B' },
  A2: { img: 'img/A_2P.png', W: 1504, H: 1378, mg: 88, crop: [186, 173, 1822, 1649], piso: 2, sector: 'A' },
  B1: { img: 'img/B_1P.png', W: 3470, H: 1426, mg: 29.4, crop: [40, 30, 1960, 760], piso: 1, sector: 'B' },
  A1: { img: 'img/A_1P.png', W: 2873, H: 1276, mg: 39.7, crop: [1114, 104, 1921, 800], piso: 1, sector: 'A' },
  PB: { img: 'img/PB.png', W: 2809, H: 1599, mg: 29.2, crop: [43, 43, 1922, 1125], piso: 0, sector: 'PB' },
};

// Escaleras: punto de entrada (ring) en cada planta superior, y llegada a planta baja con su camino al portón
const SALIDA_PB = [[640, 598], [612, 575], [535, 500]];
// Afuera del portón: primaria dobla a la derecha (hacia Navarro), secundaria a la izquierda (hacia Segurola)
const AFUERA = { p: [[650, 380], [800, 237], [900, 141]], s: [[420, 600], [300, 715], [200, 811]] };
const NIVEL_LIDER = { B3a: 's', B3b: 's', B2: 's', A2: 'p', B1: 'p', A1: 'p', PB: 'p' };
const STAIRS = {
  principal: { nombre: 'Escalera principal', color: '#3C9A68',
    pb: [[1840, 195], [1770, 240], [1640, 240], [1615, 290], [1615, 598], ...SALIDA_PB] },
  caja: { nombre: 'Caja de escalera', color: '#3C9A68',
    pb: [[1425, 925], [1380, 870], [1330, 870], [1330, 825], [1240, 825], [1240, 598], ...SALIDA_PB] },
  ext: { nombre: 'Escalera exterior', color: '#1F5FA8',
    pb: [[345, 995], [455, 945], [455, 820], [560, 700], [640, 610], [612, 575], [535, 500]] },
};

// Tramos finales hacia cada escalera, por plano
const TO = {
  B3: { ext: [[1700, 147], [1790, 165], [1815, 172]] },
  B2: { ext: [[1650, 165], [1730, 170], [1765, 170]], caja: [[785, 165], [785, 375], [690, 375], [635, 315], [612, 270]] },
  B1: { caja: [[725, 155], [725, 350], [640, 350], [590, 300], [566, 252]] },
  A2: { principal: [[630, 700], [630, 325], [1355, 325], [1380, 420], [1470, 470], [1505, 482]] },
  A1: { principal: [[1640, 350], [1700, 300], [1762, 258]] },
};

// Aulas: c = centro, d = puerta, via = puntos entre la puerta y el tramo final
// nivel p = primaria (verde), s = secundaria (azul)
const AULAS = [
  // 3.er piso (sólo secundaria) → escalera exterior
  { id: '3-1', pl: 'B3', c: [188, 245], d: [280, 186], nv: 's', st: 'ext', via: [[280, 147]] },
  { id: '3-2', pl: 'B3', c: [462, 245], d: [370, 186], nv: 's', st: 'ext', via: [[370, 147]] },
  { id: '3-3', pl: 'B3', c: [1057, 240], d: [985, 190], nv: 's', st: 'ext', via: [[985, 147]] },
  { id: '3-4', pl: 'B3', c: [1263, 240], d: [1385, 190], nv: 's', st: 'ext', via: [[1385, 147]] },
  { id: '3-5', pl: 'B3', c: [1529, 240], d: [1450, 190], nv: 's', st: 'ext', via: [[1450, 147]] },
  { id: '3-6', pl: 'B3', c: [732, 705], d: [905, 600], nv: 's', st: 'ext', via: [[905, 375], [820, 375], [820, 147]] },
  // 2.º piso ala Av. Beiró (mixto)
  { id: '2a-1', pl: 'B2', c: [198, 232], d: [280, 190], nv: 's', st: 'ext', via: [[280, 165]] },
  { id: '2a-2', pl: 'B2', c: [442, 232], d: [360, 190], nv: 's', st: 'ext', via: [[360, 165]] },
  { id: '2a-4', pl: 'B2', c: [1295, 232], d: [1200, 190], nv: 's', st: 'ext', via: [[1200, 165]] },
  { id: '2a-5', pl: 'B2', c: [1520, 232], d: [1430, 190], nv: 's', st: 'ext', via: [[1430, 165]] },
  { id: '2a-6', pl: 'B2', c: [731, 615], d: [760, 470], nv: 'p', st: 'caja', via: [[785, 420], [785, 375]], cajaJoin: true },
  { id: '2a-7', pl: 'B2', c: [881, 615], d: [850, 470], nv: 'p', st: 'caja', via: [[785, 420], [785, 375]], cajaJoin: true },
  // 2.º piso sector Navarro (primaria) → escalera principal
  { id: '2b-1', pl: 'A2', c: [535, 1250], d: [900, 830], nv: 'p', st: 'principal', via: [[900, 745], [700, 745]] },
  { id: '2b-2', pl: 'A2', c: [1273, 1250], d: [1070, 830], nv: 'p', st: 'principal', via: [[1070, 745], [700, 745]] },
  // 1.er piso ala Av. Beiró (sólo primaria) → caja de escalera
  { id: '1a-1', pl: 'B1', c: [200, 215], d: [270, 178], nv: 'p', st: 'caja', via: [[270, 155]] },
  { id: '1a-2', pl: 'B1', c: [410, 215], d: [330, 178], nv: 'p', st: 'caja', via: [[330, 155]] },
  { id: '1a-3', pl: 'B1', c: [985, 215], d: [1045, 178], nv: 'p', st: 'caja', via: [[1045, 155]] },
  { id: '1a-4', pl: 'B1', c: [1180, 215], d: [1105, 178], nv: 'p', st: 'caja', via: [[1105, 155]] },
  { id: '1a-5', pl: 'B1', c: [1402, 215], d: [1310, 178], nv: 'p', st: 'caja', via: [[1310, 155]], musica: true },
  { id: '1a-6', pl: 'B1', c: [654, 600], d: [665, 470], nv: 'p', st: 'caja', via: [[725, 420], [725, 350]], cajaJoin: true },
  { id: '1a-7', pl: 'B1', c: [795, 600], d: [775, 470], nv: 'p', st: 'caja', via: [[725, 420], [725, 350]], cajaJoin: true },
  // 1.er piso sector Navarro (primaria) → escalera principal
  { id: '1b-1', pl: 'A1', c: [1318, 600], d: [1495, 420], nv: 'p', st: 'principal', via: [[1495, 375], [1600, 362]] },
  { id: '1b-2', pl: 'A1', c: [1677, 600], d: [1550, 420], nv: 'p', st: 'principal', via: [[1550, 375], [1600, 362]] },
  // Planta baja (primaria) → portón
  { id: '0-1', pl: 'PB', c: [602, 975], d: [670, 880], nv: 'p', st: null, via: [[670, 825], [855, 825], [855, 598]] },
  { id: '0-2', pl: 'PB', c: [799, 975], d: [870, 880], nv: 'p', st: null, via: [[870, 825], [855, 825], [855, 598]] },
];

// Espacios sin alumnos que el líder también revisa
const OTROS = {
  'pre': { pl: 'B3', c: [760, 530] }, 'comp': { pl: 'B2', c: [1052, 225] }, 'enf': { pl: 'B1', c: [822, 227] },
  'sum': { pl: 'PB', c: [1575, 870] }, 'san': { pl: 'PB', c: [1000, 925] },
};

// Líderes de piso: recorrido con paradas de verificación (c = dónde se para, a = aula que revisa)
const LIDERES = [
  { k: 'B3a', pl: 'B3', st: 'ext', start: [640, 147], ruta: [
    [820, 147], [820, 375], [905, 375], { c: [905, 515], a: 'pre' }, { c: [905, 585], a: '3-6' }, [905, 375], [820, 375], [820, 147],
    { c: [370, 172], a: '3-2' }, { c: [280, 172], a: '3-1' }, [280, 147]] },
  { k: 'B3b', pl: 'B3', st: 'ext', start: [1560, 147], ruta: [
    { c: [1450, 172], a: '3-5' }, { c: [1385, 172], a: '3-4' }, { c: [985, 172], a: '3-3' }, [985, 147]] },
  { k: 'B2', pl: 'B2', st: 'ext', start: [700, 165], ruta: [
    [785, 165], [785, 400], { c: [770, 450], a: '2a-6' }, { c: [835, 450], a: '2a-7' }, [785, 400], [785, 165],
    { c: [360, 175], a: '2a-2' }, { c: [280, 175], a: '2a-1' }, [280, 165],
    { c: [985, 175], a: 'comp' }, { c: [1200, 175], a: '2a-4' }, { c: [1430, 175], a: '2a-5' }] },
  { k: 'A2', pl: 'A2', st: 'principal', start: [640, 640], ruta: [
    [700, 745], { c: [900, 790], a: '2b-1' }, { c: [1070, 790], a: '2b-2' }, [700, 745]] },
  { k: 'B1', pl: 'B1', st: 'caja', start: [760, 155], ruta: [
    [725, 155], [725, 410], { c: [770, 445], a: '1a-7' }, { c: [670, 445], a: '1a-6' }, [725, 410], [725, 155],
    { c: [1045, 166], a: '1a-3' }, { c: [1105, 166], a: '1a-4' }, { c: [822, 166], a: 'enf' },
    { c: [330, 166], a: '1a-2' }, { c: [270, 166], a: '1a-1' }, [270, 155], { c: [1310, 166], a: '1a-5' }, [1310, 155], [725, 155]] },
  { k: 'A1', pl: 'A1', st: 'principal', start: [1250, 350], ruta: [
    [1495, 370], { c: [1550, 395], a: '1b-2' }, { c: [1495, 395], a: '1b-1' }, [1600, 362]] },
  { k: 'PB', pl: 'PB', st: null, start: [1240, 720], ruta: [
    [1240, 825], [1330, 840], { c: [1440, 860], a: 'sum' }, [1240, 825], { c: [1010, 840], a: 'san' },
    { c: [870, 850], a: '0-2' }, { c: [670, 850], a: '0-1' }, [670, 825], [855, 825], [855, 598]] },
];

const NOMBRES = {
  manana: { B3a: 'Romina Sánchez', B3b: 'Agustín Cambarieri', B2: 'Javier Greco', A2: 'Fernando Pavón', B1: 'Micaela Sonzogni', A1: 'Fiona Vinaccia', PB: 'Sabrina Gaddi' },
  tarde: { B3a: 'Romina Sánchez', B3b: 'Agustín Cambarieri', B2: 'Javier Greco', A2: 'Emilia Canepa', B1: 'Analía Peón', A1: 'Verónica Tarricone', PB: 'Brenda Asad' },
};

// Alumnos por aula: constancia del simulacro del 12/05/2026 (210 de primaria, 193 de secundaria)
// repartidos entre las aulas de cada nivel (15 de primaria, 10 de secundaria)
const ALUMNOS = { p: 210, s: 193 };

// Posiciones de las otras salidas de planta baja (quedan disponibles)
const ALTERNATIVAS = [[860, 268], [965, 128], [372, 722]];
const PORTON = [612, 560];
