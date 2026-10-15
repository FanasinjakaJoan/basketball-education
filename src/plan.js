/**
 * plan.js — single source of truth for the Super Smart Sports Complex & Residence.
 * All dimensions in metres (1 world unit = 1 m). The 3D builder, the 2D SVG
 * floor plan and the documentation all read from this file, so geometry can
 * never drift between deliverables.
 *
 * Basketball dimensions follow FIBA (2022) rules for a professional court.
 */

export const SITE = {
  groundSize: 420,
  plazaDepth: 46,
  pool: { x: -58, z: 44, width: 34, depth: 26 },
  park: { x: 62, z: -34, radius: 46 },
};

export const COURT = {
  length: 28,
  width: 15,
  centreCircle: 1.8,
  threePoint: 6.75,
  threePointCorner: 0.9, // distance from the sideline to the straight 3-pt line
  laneWidth: 4.9,
  laneLength: 5.8, // free-throw line distance from the baseline
  freeThrowCircle: 1.8,
  restrictedArc: 1.25,
  basketFromBaseline: 1.575,
  rimHeight: 3.05,
  rimDiameter: 0.45,
  backboardWidth: 1.8,
  backboardHeight: 1.05,
  backboardFromBaseline: 1.2,
  apron: 2.2,
};

export const HALL = {
  width: 34, // interior span on X
  length: 46, // interior span on Z
  wallHeight: 14,
  trussHeight: 1.8,
  mezzanine: 5.4, // VIP deck / tactical operations floor level
  mezzanineDepth: 6.4,
  entranceZ: -23,
  playerZ: 23,
};

export const WING = {
  innerX: 20,
  outerX: 38,
  halfLength: 16, // spans z = -16 … +16
  levelHeight: 3.8,
  levels: 3,
  height: 11.4,
  parapet: 0.7,
  corridorX: [27.4, 30.6],
  dormRows: [
    { x: 35.4, pods: 8 },
    { x: 24.6, pods: 5 },
  ],
  pod: { width: 2.6, depth: 3.2, height: 2.3 },
};

export const BRIDGE = {
  y: [0, 3.8],
  mezzanineY: [5.4, 7.6],
  z: [-4, 10],
  startX: HALL.width / 2, // 17 — meets the hall curtain wall
  endX: WING.innerX,
};

export const LEVELS = {
  ground: 0,
  dorm: WING.levelHeight, // 3.8
  lounge: WING.levelHeight * 2, // 7.6
  mezz: HALL.mezzanine, // 5.4
  roof: HALL.wallHeight,
};

export const TEAMS = [
  { id: "alpha", name: { en: "Team Alpha", fr: "Équipe Alpha", mg: "Ekipa Alpha" }, side: -1, accent: 0x5ce6ff },
  { id: "beta", name: { en: "Team Beta", fr: "Équipe Beta", mg: "Ekipa Beta" }, side: 1, accent: 0xffab5a },
];

/* ------------------------------------------------------------------ */
/* Zone register — drives camera presets, the zone browser and the UI  */
/* ------------------------------------------------------------------ */

export const ZONES = [
  {
    id: "facade",
    chapter: 0,
    fade: [0, 5.4],
    name: { en: "Glass facade & smart entrance", fr: "Façade vitrée et entrée intelligente", mg: "Rindrina fitaratra sy fidirana marani-tsaina" },
    desc: {
      en: "A 76 m glazed envelope of low-iron smart glass, matte black steel fins and brushed aluminium trims. Proximity sensors read arriving players and staff, then slide the doors open.",
      fr: "Une enveloppe vitrée de 76 m en verre intelligent, ailettes en acier noir mat et finitions aluminium brossé. Les capteurs détectent l'arrivée des joueurs et ouvrent les portes.",
      mg: "Rindrina fitaratra 76 m, vy mainty sy aliminiuma. Mahatsikaritra ny mpilalao ny sensor ary misokatra ny varavarana.",
    },
    preset: { pos: [30, 8.4, -44], target: [0, 6.4, -6], fov: 40 },
    specs: [
      { label: "spec.length", value: "76 × 46 m" },
      { label: "spec.glazing", value: "1 240 m²" },
      { label: "spec.sensors", value: "36 + 12 LiDAR" },
      { label: "spec.doors", value: "8 sliding leafs" },
    ],
  },
  {
    id: "court",
    chapter: 1,
    fade: [5, 15],
    name: { en: "IoT basketball court", fr: "Terrain de basketball IoT", mg: "Kianja basket IoT" },
    desc: {
      en: "Regulation FIBA court on a kinetic LED floor: 2 048 pressure cells, interactive line graphics that answer every step, retractable rigs and overhead tracking.",
      fr: "Terrain FIBA réglementaire sur sol LED cinétique : 2 048 capteurs de pression, tracés interactifs qui répondent à chaque appui, paniers escamotables.",
      mg: "Kianja FIBA eo amin'ny tany LED: 2 048 sensor tsindry, tsipika mavitrika, harona miforitra.",
    },
    preset: { pos: [10, 4.6, 12], target: [-2, 2.2, -6], fov: 46 },
    specs: [
      { label: "spec.court", value: "28 × 15 m · FIBA" },
      { label: "spec.floor", value: "2 048 sensors" },
      { label: "spec.hoops", value: "retractable · 3.05 m" },
      { label: "spec.pixels", value: "1.4 mm LED" },
    ],
  },
  {
    id: "gantry",
    chapter: 1,
    fade: [7, 15],
    name: { en: "Robotic tracking gantry", fr: "Portique robotisé de capture", mg: "Rafitra robotika manara-maso" },
    desc: {
      en: "Twin 24 m rails carry a translating cross-beam with six 240 fps pose cameras plus 4 LiDAR units, feeding the tactical engine in real time.",
      fr: "Deux rails de 24 m portent une poutre mobile avec six caméras 240 i/s et 4 LiDAR, connectés au moteur tactique en temps réel.",
      mg: "Rails 24 m roa mitondra caméra 240 fps enina sy LiDAR efatra, mifandray mivantana amin'ny rafitra tactika.",
    },
    preset: { pos: [-13, 6.6, -9], target: [0, 9.6, 2], fov: 42 },
    specs: [
      { label: "spec.cameras", value: "6 × 240 fps" },
      { label: "spec.axes", value: "12 servo axes" },
      { label: "spec.latency", value: "18 ms" },
      { label: "spec.coverage", value: "100 % court" },
    ],
  },
  {
    id: "scoreboard",
    chapter: 1,
    fade: [9, 15],
    name: { en: "Suspended holographic scoreboard", fr: "Tableau de marque holographique suspendu", mg: "Tabilao holografika mihantona" },
    desc: {
      en: "A 6 m aluminium ring holds four 4K panels and a volumetric hologram volume: live score, shot clock, player telemetry and heat maps, projected 4 m above the court.",
      fr: "Un anneau aluminium de 6 m porte quatre écrans 4K et un volume holographique : score, chrono, télémétrie et cartes de chaleur projetés à 4 m au-dessus du terrain.",
      mg: "Peratra aliminiuma 6 m misy efijery 4K efatra sy holograma: isa, chrono, angona mpilalao.",
    },
    preset: { pos: [6.5, 5.2, 3.5], target: [0, 11.2, 0], fov: 50 },
    specs: [
      { label: "spec.display", value: "4 × 4K · 6 m ring" },
      { label: "spec.holo", value: "100 000 pts" },
      { label: "spec.audio", value: "line array · 42 dB" },
      { label: "spec.light", value: "1 500 lux court" },
    ],
  },
  {
    id: "bridge",
    chapter: 2,
    fade: [15, 17.5],
    name: { en: "Link corridors & proximity doors", fr: "Couloirs de liaison et portes automatiques", mg: "Lalana mampifandray sy varavarana mandrefy" },
    desc: {
      en: "Two glazed bridges connect each wing to the hall. Sliding smart-glass doors open on approach and hand the player over from dorm mode to training mode lighting.",
      fr: "Deux passerelles vitrées relient chaque aile au hall. Les portes vitrées coulissantes s'ouvrent à l'approche et passent en mode entraînement.",
      mg: "Tetezana fitaratra roa mampifandray ny efitry ny ekipa sy ny kianja. Misokatra ny varavarana rehefa manatona.",
    },
    preset: { pos: [13.5, 3.4, 4.5], target: [22, 3.2, 4], fov: 58 },
    specs: [
      { label: "spec.bridge", value: "2 × 3 m wide" },
      { label: "spec.doors", value: "touchless · 0.4 s" },
      { label: "spec.identity", value: "biometric + NFC" },
      { label: "spec.traffic", value: "24 players/h" },
    ],
  },
  {
    id: "dormAlpha",
    chapter: 2,
    fade: [17.5, 21],
    name: { en: "Dormitory wing — Team Alpha", fr: "Aile dortoir — Équipe Alpha", mg: "Efitra fatoriana — Ekipa Alpha" },
    desc: {
      en: "West wing: 13 smart pods per level with biometric sleep tracking, automated frosted partitions, circadian lighting and integrated smart storage.",
      fr: "Aile ouest : 13 smart-pods par niveau, suivi biométrique du sommeil, cloisons opacifiantes automatiques, éclairage circadien et rangements connectés.",
      mg: "Efitra andrefana: farafara marani-tsaina 13 isaky ny ambaratonga, fanaraha-maso ny torimaso, rindrina miova.",
    },
    preset: { pos: [-32.4, 5.6, 6], target: [-35.4, 5.2, -2], fov: 55 },
    specs: [
      { label: "spec.pods", value: "26 per wing" },
      { label: "spec.sleep", value: "HRV · SpO₂ · 60 GHz" },
      { label: "spec.partitions", value: "PDLC · 0.2 s" },
      { label: "spec.lighting", value: "1 800–5 600 K" },
    ],
  },
  {
    id: "dormBeta",
    chapter: 2,
    fade: [18, 21],
    name: { en: "Dormitory wing — Team Beta", fr: "Aile dortoir — Équipe Beta", mg: "Efitra fatoriana — Ekipa Beta" },
    desc: {
      en: "East wing mirrors the west wing cell by cell, but flips its accent palette to energetic amber so players always read which side of the complex they are on.",
      fr: "L'aile est reproduit l'aile ouest à l'identique, avec une palette ambre énergique pour signaler à chacun son côté du complexe.",
      mg: "Ny efitra atsinanana mitovy amin'ny andrefana, fa mampiasa loko amber mba hamantarana ny lafiny.",
    },
    preset: { pos: [32.4, 5.6, 6], target: [35.4, 5.2, -2], fov: 55 },
    specs: [
      { label: "spec.pods", value: "26 per wing" },
      { label: "spec.acoustic", value: "38 dB(A) pod" },
      { label: "spec.storage", value: "RFID lockers" },
      { label: "spec.climate", value: "21 °C · 45 % RH" },
    ],
  },
  {
    id: "recovery",
    chapter: 2,
    fade: [21, 25],
    name: { en: "Showers, sanitary & cryotherapy", fr: "Douches, sanitaires et cryothérapie", mg: "Fandroana, fidiovana sy cryothérapie" },
    desc: {
      en: "Twelve water-recycling shower stalls with chromotherapy programmes, touchless smart mirrors showing hydration and recovery metrics, and two −110 °C cryo pods.",
      fr: "Douze douches à recyclage d'eau avec chromothérapie, miroirs intelligents sans contact affichant hydratation et récupération, deux caissons cryo à −110 °C.",
      mg: "Fandroana 12 mamerina rano miaraka amin'ny chromothérapie, fitaratra marani-tsaina, cryo −110 °C roa.",
    },
    preset: { pos: [-25.5, 2.6, -12.5], target: [-31, 2.0, -15], fov: 58 },
    specs: [
      { label: "spec.water", value: "−68 % water use" },
      { label: "spec.cryo", value: "2 pods · −110 °C" },
      { label: "spec.plunge", value: "2 ice baths · 4 °C" },
      { label: "spec.chromo", value: "6 programmes" },
      { label: "spec.mirror", value: "hydration index" },
    ],
  },
  {
    id: "warroom",
    chapter: 3,
    fade: [25, 30],
    name: { en: "Tactical operations centre", fr: "Centre d'opérations tactiques", mg: "Efitra fanaraha-maso tactika" },
    desc: {
      en: "Hanging over the north end of the court: curved holographic strategy wall, 8 coach workstations, live IoT health telemetry of every player and 6 camera feeds.",
      fr: "Suspendu au-dessus de l'extrémité nord du terrain : mur holographique de stratégie courbe, 8 postes d'entraîneurs, télémétrie de santé en direct.",
      mg: "Mihantona eo amin'ny farany avaratry ny kianja: rindrina holografika, toeram-piasana 8, angona ara-pahasalamana mivantana.",
    },
    preset: { pos: [5.5, 7.6, -13], target: [-3, 6.2, -21.5], fov: 48 },
    specs: [
      { label: "spec.screens", value: "1 × 9 m curved" },
      { label: "spec.workstations", value: "8 coaches" },
      { label: "spec.telemetry", value: "24 players live" },
      { label: "spec.feeds", value: "6 × 4K multiview" },
    ],
  },
  {
    id: "vip",
    chapter: 3,
    fade: [30, 35],
    name: { en: "VIP & guest lounge deck", fr: "Salon VIP et invités", mg: "Efitra VIP sy vahiny" },
    desc: {
      en: "A glass box on the south mezzanine: electrochromic partitions switch from transparent to opaque, an automated hospitality bar serves guests, and biometric entry keeps the deck private.",
      fr: "Une boîte de verre sur la mezzanine sud : cloisons électrochromes opacifiantes à la demande, bar automatisé, entrée biométrique privée.",
      mg: "Efitra fitaratra eo amin'ny mezzanine atsimo: rindrina miova, bar automatique, fidirana biometrika.",
    },
    preset: { pos: [-2, 7.4, 15], target: [0, 2.4, 0], fov: 42 },
    specs: [
      { label: "spec.glazing", value: "electrochromic" },
      { label: "spec.capacity", value: "48 guests" },
      { label: "spec.bar", value: "robotic service" },
      { label: "spec.access", value: "face + tag" },
    ],
  },
  {
    id: "study",
    chapter: 2,
    fade: [19.5, 24],
    name: { en: "Study hall & team lounge", fr: "Salle d'étude et salon d'équipe", mg: "Efitra fianarana sy fialam-boly" },
    desc: {
      en: "Because education comes first: the top level of each wing holds a study hall with holo-whiteboards, tutoring booths, a library wall and a team lounge — 90 min of school per day, guaranteed.",
      fr: "L'éducation d'abord : le dernier niveau de chaque aile abrite une salle d'étude avec tableaux holographiques, alcôves de tutorat, bibliothèque et salon d'équipe.",
      mg: "Fanabeazana aloha: ny ambaratonga faha-3 misy efitra fianarana, tabilao holografika, tranomboky sy efitra fialam-boly.",
    },
    preset: { pos: [31, 9.8, 12], target: [34.5, 9.2, 4], fov: 52 },
    specs: [
      { label: "spec.study", value: "90 min/day" },
      { label: "spec.desks", value: "18 seats" },
      { label: "spec.library", value: "1 200 titles" },
      { label: "spec.tutoring", value: "4 booths" },
    ],
  },
  {
    id: "roof",
    chapter: 0,
    fade: [0.5, 4],
    name: { en: "Roof, PV array & skylights", fr: "Toiture, panneaux PV et verrières", mg: "Tafo, panneau PV sy varavarankely" },
    desc: {
      en: "Six structural skylight strips bring daylight over the court while 1 850 m² of photovoltaics and a rainwater tank keep the complex 62 % self-sufficient.",
      fr: "Six verrières structurelles éclairent le terrain, 1 850 m² de photovoltaïque et une cuve d'eau de pluie rendent le complexe autonome à 62 %.",
      mg: "Verrières enina mitondra hazavana, 1 850 m² PV sy fitahirizana ranonorana: 62 % mahaleo tena.",
    },
    preset: { pos: [6, 34, 30], target: [0, 13.6, -2], fov: 42 },
    specs: [
      { label: "spec.pv", value: "1 850 m² · 380 kWp" },
      { label: "spec.water", value: "240 m³ tank" },
      { label: "spec.roof", value: "green + PV mix" },
      { label: "spec.autonomy", value: "62 %" },
    ],
  },
  {
    id: "landscape",
    chapter: 0,
    fade: [0, 3.5],
    name: { en: "Landscape & smart lighting", fr: "Paysage et éclairage intelligent", mg: "Tontolo sy jiro marani-tsaina" },
    desc: {
      en: "A 420 m smart site: reflecting pool, outdoor training court, jogging loop and 180 adaptive light poles that wake in sequence as players walk the campus.",
      fr: "Un site intelligent de 420 m : bassin miroir, terrain extérieur, boucle de jogging et 180 candélabres adaptatifs qui s'allument en séquence.",
      mg: "Toerana 420 m: farihy, kianja ivelany, lalana jogging ary jiro 180 mifoha tsikelikely.",
    },
    preset: { pos: [58, 16, -54], target: [4, 6, 2], fov: 44 },
    specs: [
      { label: "spec.site", value: "420 × 420 m" },
      { label: "spec.lighting", value: "180 adaptive poles" },
      { label: "spec.path", value: "1.2 km loop" },
      { label: "spec.trees", value: "310 planted" },
    ],
  },
];

export function zoneById(id) {
  return ZONES.find((zone) => zone.id === id) || ZONES[0];
}

/* ------------------------------------------------------------------ */
/* Guided jumps — the nine viewpoints the HUD offers as quick buttons.  */
/* Seven reuse the zone presets; the wet zone is split into two, because */
/* the showers and the cryotherapy pods deserve their own framing.       */
/* ------------------------------------------------------------------ */

const zonePreset = (id) => ({ ...zoneById(id).preset });

export const QUICK_VIEWS = [
  { id: "court", label: { en: "Court", fr: "Terrain", mg: "Kianja" }, preset: zonePreset("court") },
  { id: "alpha", label: { en: "Team Alpha", fr: "Équipe Alpha", mg: "Ekipa Alpha" }, preset: zonePreset("dormAlpha") },
  { id: "beta", label: { en: "Team Beta", fr: "Équipe Beta", mg: "Ekipa Beta" }, preset: zonePreset("dormBeta") },
  {
    id: "showers",
    label: { en: "Showers", fr: "Douches", mg: "Fandroana" },
    preset: { pos: [-29.0, 2.7, -6.2], target: [-34.6, 1.7, -11.6], fov: 60 },
  },
  {
    id: "recovery",
    label: { en: "Cryotherapy", fr: "Cryothérapie", mg: "Cryothérapie" },
    preset: { pos: [-28.0, 2.3, -18.8], target: [-30.6, 1.4, -15.4], fov: 58 },
  },
  { id: "command", label: { en: "Command", fr: "PC tactique", mg: "Baiko" }, preset: zonePreset("warroom") },
  { id: "vip", label: { en: "VIP lounge", fr: "Salon VIP", mg: "Efitra VIP" }, preset: zonePreset("vip") },
  { id: "exterior", label: { en: "Exterior", fr: "Extérieur", mg: "Ivelany" }, preset: zonePreset("landscape") },
  {
    id: "entrance",
    label: { en: "Entrance", fr: "Entrée", mg: "Fidirana" },
    preset: { pos: [0, 3.4, -36], target: [0, 3.2, -20], fov: 52 },
  },
];

export function quickViewById(id) {
  return QUICK_VIEWS.find((view) => view.id === id) || QUICK_VIEWS[0];
}
