/**
 * iot.js — the "nervous system" of the complex.
 * Simulates player telemetry, building systems (energy, water, air), ambient
 * scenarios and the event log that the HUD streams while the film plays.
 * Everything the 3D model animates reads from this single runtime object.
 */
import { clamp, damp } from "./lib/util.js";

export const SCENARIOS = {
  training: {
    id: "training",
    label: { en: "TRAINING", fr: "ENTRAÎNEMENT", mg: "FIOFANANA" },
    accent: 0x5ce6ff,
    modeMix: [1, 0, 0],
    courtLight: 1.0,
    podPrivacy: 0.32,
  },
  game: {
    id: "game",
    label: { en: "GAME NIGHT", fr: "SOIR DE MATCH", mg: "LALAO" },
    accent: 0xffab5a,
    modeMix: [0, 1, 0],
    courtLight: 1.35,
    podPrivacy: 0.32,
  },
  recovery: {
    id: "recovery",
    label: { en: "RECOVERY", fr: "RÉCUPÉRATION", mg: "FITSABOANA" },
    accent: 0x9f8cff,
    modeMix: [0, 0, 1],
    courtLight: 0.62,
    podPrivacy: 0.8,
  },
};

export const LOG_EVENTS = [
  {
    at: 1.2,
    key: "approach",
    text: {
      en: "Arrival detected · 2 teams, coaches and VIP guests inbound",
      fr: "Arrivée détectée · 2 équipes, entraîneurs et invités VIP en approche",
      mg: "Voaray ny fisian'ny ekipa roa sy ny vahiny",
    },
  },
  {
    at: 4.4,
    key: "doors",
    text: {
      en: "Proximity sensors → 8 sliding glass leaves opening (0.4 s)",
      fr: "Capteurs de proximité → 8 vantaux vitrés coulissants (0,4 s)",
      mg: "Sensor akaiky → misokatra ny varavarana 8 (0,4 segondra)",
    },
  },
  {
    at: 6.0,
    key: "led",
    text: {
      en: "Kinetic LED floor online · 2 048 pressure cells calibrating",
      fr: "Sol LED cinétique en ligne · 2 048 capteurs de pression en calibration",
      mg: "Tany LED mandeha · 2 048 sensor tsindry manara-maso",
    },
  },
  {
    at: 8.6,
    key: "hoops",
    text: {
      en: "Automated hoops deployed to 3.05 m · rims locked",
      fr: "Paniers automatiques déployés à 3,05 m · cercles verrouillés",
      mg: "Harona mandeha ho 3,05 m · voahidy ny peratra",
    },
  },
  {
    at: 10.4,
    key: "gantry",
    text: {
      en: "Tracking gantry live · 6 × 240 fps pose cameras · 18 ms latency",
      fr: "Portique de capture actif · 6 caméras 240 i/s · latence 18 ms",
      mg: "Rafitra manara-maso mandeha · caméra 6 × 240 fps · 18 ms",
    },
  },
  {
    at: 12.2,
    key: "telemetry",
    text: {
      en: "Biometric uplink · 24 players streaming HR, load and hydration",
      fr: "Liaison biométrique · 24 joueurs transmettent FC, charge et hydratation",
      mg: "Angona biometrika · mpilalao 24 mandefa FC, enta-mavesatra, rano",
    },
  },
  {
    at: 14.0,
    key: "holo",
    text: {
      en: "Holographic scoreboard synced · heat maps + shot quality",
      fr: "Tableau holographique synchronisé · cartes de chaleur et qualité de tir",
      mg: "Tabilao holografika mifanaraka · sary hafanana sy kalitaon'ny tifitra",
    },
  },
  {
    at: 16.2,
    key: "corridor",
    text: {
      en: "Corridor mode: lighting hands over from dorm to training preset",
      fr: "Mode couloir : l'éclairage passe du dortoir au préréglage entraînement",
      mg: "Fomba lalana: mifindra ny jiro avy amin'ny efitra ho amin'ny fanofanana",
    },
  },
  {
    at: 19.0,
    key: "pods",
    text: {
      en: "Smart pods: PDLC partitions opaque · sleep score 82 avg",
      fr: "Smart-pods : cloisons PDLC opaques · score de sommeil 82 en moyenne",
      mg: "Farafara marani-tsaina: rindrina tsy mangarahara · torimaso 82",
    },
  },
  {
    at: 22.4,
    key: "water",
    text: {
      en: "Shower loop recycling 68 % of grey water · chromotherapy programme 2",
      fr: "Boucle de douche : 68 % des eaux grises recyclées · chromothérapie 2",
      mg: "Famerinana rano 68 % · chromothérapie faha-2",
    },
  },
  {
    at: 24.2,
    key: "cryo",
    text: {
      en: "Cryotherapy pods at −110 °C · 3 min protocol started",
      fr: "Caissons de cryothérapie à −110 °C · protocole de 3 min lancé",
      mg: "Cryothérapie −110 °C · manomboka ny protokola 3 min",
    },
  },
  {
    at: 27.0,
    key: "toc",
    text: {
      en: "TOC boot · curved strategy wall, 6 feeds and 24 telemetry feeds",
      fr: "TOC démarré · mur de stratégie courbe, 6 flux vidéo et 24 flux de télémétrie",
      mg: "TOC mandeha · rindrina tetika, sary 6 sy angona 24",
    },
  },
  {
    at: 31.4,
    key: "vip",
    text: {
      en: "VIP deck: electrochromic glazing switched to transparent for the finale",
      fr: "Salon VIP : vitrage électrochrome passé en transparent pour le final",
      mg: "Efitra VIP: fitaratra niova ho mangarahara ho an'ny farany",
    },
  },
  {
    at: 34.0,
    key: "recap",
    text: {
      en: "Session complete · 18 400 data points logged for the cohort",
      fr: "Session terminée · 18 400 points de données archivés pour la cohorte",
      mg: "Vita ny fotoam-piofanana · angona 18 400 voatahiry",
    },
  },
];

export function createIotModel() {
  const telemetry = new Float32Array(8);
  const phases = telemetry.map((_, i) => i * 1.7);

  const state = {
    time: 0,
    telemetry,
    telemetryAverage: 0.5,
    score: [0, 0],
    quarter: 1,
    gameClock: "10:00",
    shotClock: 24,
    scenario: "training",
    scenarioLabel: ["TRAINING", "ENTRAÎNEMENT", "FIOFANANA"],
    ledActivation: 0,
    hoopDeploy: 0,
    gantryActive: 0,
    podPrivacy: 0.32,
    vipPrivacy: 0,
    biometricPulse: 0.3,
    facadeSequence: 0,
    systems: {
      energy: { pv: 0.62, grid: 0.31, battery: 0.7, load: 0.48 },
      water: { recycle: 0.68, tank: 0.74, usage: 0.4 },
      air: { co2: 620, temp: 21.4, humidity: 45 },
    },
    log: [],
    counters: {
      sensorHits: 0,
      dataPoints: 0,
      doorsOpened: 0,
    },
    scenarioId: "training",
    get(i) {
      return telemetry[i % telemetry.length];
    },
    setScenario(id) {
      if (!SCENARIOS[id]) return;
      this.scenarioId = id;
      this.scenario = id;
      const scenario = SCENARIOS[id];
      this.scenarioLabel = [
        scenario.label.en,
        scenario.label.fr,
        scenario.label.mg,
      ];
    },
  };

  state.setScenario("training");

  let shotClockValue = 24;
  let gameSeconds = 600;
  let nextPoint = 12;
  let logIndex = 0;

  function pushLog(entry, translated) {
    state.log.push({
      key: entry.key,
      time: Math.round(state.time * 10) / 10,
      text: translated ?? entry.text?.en ?? "",
      translations: entry.text,
    });
    if (state.log.length > 26) state.log.shift();
  }

  function update(dt, time, options = {}) {
    state.time = time;
    const scenario = SCENARIOS[state.scenarioId];

    // telemetry: smooth pseudo-noise per player
    let sum = 0;
    for (let i = 0; i < telemetry.length; i++) {
      const target =
        (scenario.id === "recovery" ? 0.28 : scenario.id === "game" ? 0.72 : 0.52) +
        0.3 * Math.sin(time * (0.3 + i * 0.07) + phases[i]) +
        0.18 * Math.sin(time * (0.9 + i * 0.03) + phases[i] * 2);
      const value = clamp(target, 0.08, 1);
      telemetry[i] = damp(telemetry[i] || value, value, 1.6, dt);
      sum += telemetry[i];
    }
    state.telemetryAverage = sum / telemetry.length;

    // energy / water model
    const systems = state.systems;
    systems.energy.pv = clamp(0.58 + 0.22 * Math.sin(time * 0.06), 0, 1);
    systems.energy.load = clamp(
      (scenario.courtLight * 0.5 + state.telemetryAverage * 0.5) * (0.9 + 0.1 * Math.sin(time * 0.4)),
      0.1,
      1
    );
    systems.energy.battery = clamp(0.66 + 0.12 * Math.sin(time * 0.03 + 1), 0.2, 1);
    systems.water.recycle = clamp(0.68 + 0.05 * Math.sin(time * 0.08), 0.5, 0.8);
    systems.water.usage = clamp(0.32 + 0.24 * state.telemetryAverage + 0.05 * Math.sin(time * 0.5), 0.1, 1);
    systems.air.co2 = 560 + state.telemetryAverage * 220 + 20 * Math.sin(time * 0.2);
    systems.air.temp = 21.4 + Math.sin(time * 0.05) * 0.4;
    systems.air.humidity = 45 + Math.sin(time * 0.09) * 3;

    // score clock
    if (state.scenarioId === "game") {
      shotClockValue -= dt * 2.2;
      if (shotClockValue <= 0) {
        shotClockValue += 24;
        state.score[Math.random() > 0.5 ? 0 : 1] += Math.random() > 0.6 ? 3 : 2;
      }
      gameSeconds = Math.max(0, gameSeconds - dt * 4);
      nextPoint -= dt;
      if (nextPoint <= 0) {
        nextPoint = 14 + Math.random() * 10;
        state.score[Math.random() > 0.5 ? 0 : 1] += Math.random() > 0.55 ? 3 : 2;
        state.counters.dataPoints += 320;
      }
    } else if (state.scenarioId === "training") {
      shotClockValue = 24;
      gameSeconds = Math.max(0, gameSeconds - dt);
      if (Math.random() > 1 - dt * 0.4) {
        state.score[Math.random() > 0.5 ? 0 : 1] += Math.random() > 0.7 ? 3 : 1;
      }
    }
    state.shotClock = Math.max(0, Math.round(shotClockValue));
    state.quarter = 3;
    const minutes = Math.floor(gameSeconds / 60);
    const seconds = Math.floor(gameSeconds % 60);
    state.gameClock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    // counters
    state.counters.sensorHits += Math.round(state.telemetryAverage * 240 * dt);
    state.counters.dataPoints += Math.round(state.telemetryAverage * 90 * dt);
    state.biometricPulse = 0.3 + Math.abs(Math.sin(time * 1.6)) * 0.7;
    state.facadeSequence = (Math.sin(time * 0.5) + 1) / 2;

    // scripted log for the film
    if (options.followFilm) {
      while (logIndex < LOG_EVENTS.length && time >= LOG_EVENTS[logIndex].at) {
        pushLog(LOG_EVENTS[logIndex]);
        logIndex++;
        if (LOG_EVENTS[logIndex - 1].key === "doors") state.counters.doorsOpened += 8;
      }
    }
    if (options.resetLog) {
      logIndex = 0;
      state.log.length = 0;
    }
  }

  state.update = update;
  state.pushLog = pushLog;

  return state;
}
