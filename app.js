const languageData = {
  en: {
    deckLabel: "Pilot business plan",
    deckSubtitle: "Madagascar · Pilot plan",
    overline: "A youth development playbook",
    languageLabel: "Choose presentation language",
    navLabel: "Slide navigation",
    brandAria: "Hoop Horizons Madagascar, slide one",
    footerSlogan: "EDUCATION FIRST · BASKETBALL SECOND",
    slideAria: (number, total) => `Slide ${number} of ${total}`,
    present: "Present",
    exitPresent: "Exit presentation",
    previous: "Previous slide",
    next: "Next slide",
    footer: "Pilot concept · Partner and funding assumptions require validation",
    progress: "Slide",
    allSlides: "Choose a slide",
    sourceLabel: "Sources",
  },
  fr: {
    deckLabel: "Plan d’affaires pilote",
    deckSubtitle: "Madagascar · Projet pilote",
    overline: "Un parcours pour la jeunesse",
    languageLabel: "Choisir la langue de présentation",
    navLabel: "Navigation des diapositives",
    brandAria: "Hoop Horizons Madagascar, première diapositive",
    footerSlogan: "L’ÉDUCATION D’ABORD · LE BASKETBALL ENSUITE",
    slideAria: (number, total) => `Diapositive ${number} sur ${total}`,
    present: "Présenter",
    exitPresent: "Quitter la présentation",
    previous: "Diapositive précédente",
    next: "Diapositive suivante",
    footer: "Concept pilote · Partenariats et hypothèses financières à valider",
    progress: "Diapositive",
    allSlides: "Choisir une diapositive",
    sourceLabel: "Sources",
  },
  mg: {
    deckLabel: "Drafitra fandraharahana andrana",
    deckSubtitle: "Madagasikara · Tetikasa andrana",
    overline: "Lalana fampandrosoana ny tanora",
    languageLabel: "Misafidiana ny fitenin’ny fampisehoana",
    navLabel: "Fifindrana eo amin’ny slide",
    brandAria: "Hoop Horizons Madagascar, slide voalohany",
    footerSlogan: "FANABEAZANA ALOHA · BASKET MANARAKA",
    slideAria: (number, total) => `Slide ${number} amin’ny ${total}`,
    present: "Asehoy",
    exitPresent: "Mialà amin’ny fampisehoana",
    previous: "Slide teo aloha",
    next: "Slide manaraka",
    footer: "Tetikasa andrana · Hamarino ny fiaraha-miasa sy ny vinavina ara-bola",
    progress: "Slide",
    allSlides: "Misafidiana slide",
    sourceLabel: "Loharano",
  },
};

const slides = [
  {
    id: "vision",
    type: "cover",
    kicker: { en: "THE VISION", fr: "LA VISION", mg: "NY VINA" },
    brand: {
      en: "Hoop Horizons Madagascar",
      fr: "Hoop Horizons Madagascar",
      mg: "Hoop Horizons Madagascar",
    },
    subbrand: {
      en: "Trano Fanabeazana amin'ny Basket",
      fr: "Trano Fanabeazana amin'ny Basket · centre d’éducation par le basketball",
      mg: "Trano Fanabeazana amin'ny Basket",
    },
    title: {
      en: "Every game opens a horizon.",
      fr: "Chaque match ouvre un horizon.",
      mg: "Manokatra faravodilanitra ny lalao tsirairay.",
    },
    lead: {
      en: "We use basketball to help young people learn, stay healthy and find pathways to opportunity—on court, in class and beyond.",
      fr: "Nous utilisons le basketball pour aider les jeunes à apprendre, à rester en bonne santé et à accéder à de nouvelles possibilités — sur le terrain, en classe et au-delà.",
      mg: "Ampiasainay ny basket hanohanana ny tanora hianatra, hikolokolo fahasalamana ary hahita lalana mankany amin’ny fahafahana — eny an-kianja, any an-dakilasy ary any ankoatra.",
    },
    missionLabel: { en: "OUR MISSION", fr: "NOTRE MISSION", mg: "NY IRAKA" },
    sticker: { en: "PLAY WITH PURPOSE", fr: "JOUER AVEC UN BUT", mg: "MILALAO AMIN-KENDRENA" },
    visualLabel: { en: "COURT TO CLASSROOM", fr: "DU TERRAIN À LA CLASSE", mg: "AVY AN-KIANJA HO ANY AN-DÀKILASY" },
  },
  {
    id: "opportunity",
    type: "opportunity",
    kicker: { en: "THE OPPORTUNITY", fr: "L’OPPORTUNITÉ", mg: "NY FAHAFANA" },
    title: {
      en: "A young nation. A proven 3x3 moment.",
      fr: "Une nation jeune. Un élan 3x3 confirmé.",
      mg: "Firenena tanora. Efa hita ny fandrosoana amin’ny 3x3.",
    },
    lead: {
      en: "A strong basketball culture can become a safe, structured pathway that connects training with school support.",
      fr: "La forte culture du basketball à Madagascar peut devenir un parcours sûr et structuré, reliant l’entraînement au soutien scolaire.",
      mg: "Ny kolontsaina matanjaka momba ny basket eto Madagasikara dia azo avadika ho lalana azo antoka sy voalamina, mampifandray ny fiofanana sy ny fanohanana ny fianarana.",
    },
    stats: [
      {
        value: "14.4M",
        tag: { en: "Under 18", fr: "Moins de 18 ans", mg: "Latsaky ny 18 taona" },
        label: { en: "children in Madagascar", fr: "enfants à Madagascar", mg: "ankizy eto Madagasikara" },
        note: { en: "UNICEF · 2024", fr: "UNICEF · 2024", mg: "UNICEF · 2024" },
      },
      {
        value: "20.9M",
        tag: { en: "Under 30", fr: "Moins de 30 ans", mg: "Latsaky ny 30 taona" },
        label: { en: "young people", fr: "jeunes", mg: "tanora" },
        note: { en: "UNICEF · 2024", fr: "UNICEF · 2024", mg: "UNICEF · 2024" },
      },
    ],
    fibaTitle: { en: "A double win on home court", fr: "Un doublé à domicile", mg: "Fandresena roa teo an-tanindrazana" },
    fibaLine: { en: "Men + women · FIBA 3x3 Africa Cup · 2024", fr: "Hommes + femmes · FIBA 3x3 Africa Cup · 2024", mg: "Lehilahy + vehivavy · FIBA 3x3 Africa Cup · 2024" },
    testLabel: { en: "PILOT THESIS", fr: "HYPOTHÈSE PILOTE", mg: "VINAVINA HOTSAPAINA" },
    testCopy: {
      en: "Validate demand through school meetings, parent interviews, sign-ups and repeat attendance before expansion.",
      fr: "Valider la demande par des échanges avec les écoles et les parents, les inscriptions et la présence répétée avant toute expansion.",
      mg: "Hamarino amin’ny fihaonana amin’ny sekoly sy ray aman-dreny, ny fisoratana anarana ary ny fanatrehana miverimberina ny tena filàna alohan’ny hanitarana.",
    },
    boardKicker: { en: "THE MOMENTUM", fr: "LA DYNAMIQUE", mg: "NY FANDROSOANA" },
    boardTitle: { en: "The island has already made its mark.", fr: "L’île a déjà marqué les esprits.", mg: "Efa nampiseho ny heriny i Madagasikara." },
      men: { en: "MEN’S CHAMPIONS", fr: "CHAMPIONS MASCULINS", mg: "TOMPONDAKA LEHILAHY" },
    women: { en: "WOMEN’S CHAMPIONS", fr: "CHAMPIONNES FÉMININES", mg: "TOMPONDAKA VEHIVAVY" },
    sourceLinks: [
      { label: { en: "UNICEF youth figures", fr: "Chiffres UNICEF sur la jeunesse", mg: "Tarehimarika UNICEF momba ny tanora" }, url: "https://www.unicef.org/madagascar/en/reports/every-child-better-future" },
      { label: { en: "FIBA 3x3 results", fr: "Résultats FIBA 3x3", mg: "Vokatra FIBA 3x3" }, url: "https://www.fiba.basketball/en/news/madagascar-win-double-at-the-fiba-3x3-africa-cup-2024" },
    ],
  },
  {
    id: "value",
    type: "pillars",
    kicker: { en: "WHY HOOP HORIZONS", fr: "LA VALEUR AJOUTÉE", mg: "NY MAHA SAMIHAFA" },
    title: {
      en: "Education first. Basketball second.",
      fr: "L’éducation d’abord. Le basketball ensuite.",
      mg: "Fanabeazana aloha. Basket manaraka.",
    },
    lead: {
      en: "One integrated program builds opportunity on court and progress in the classroom.",
      fr: "Un programme intégré crée des possibilités sur le terrain et des progrès en classe.",
      mg: "Fandaharana iray mitambatra no manokatra fahafahana an-kianja sy mampandroso ny fianarana.",
    },
    pillars: [
      {
        icon: "01",
        label: { en: "ACCESS", fr: "ACCÈS", mg: "FAHAFahana MIDITRA" },
        title: { en: "Talent-first scholarships", fr: "Des bourses fondées sur le potentiel", mg: "Vatsim-pianarana mifototra amin’ny talenta" },
        body: { en: "Recognize potential and commitment; target 35–40% supported places.", fr: "Valoriser le potentiel et l’engagement; viser 35 à 40 % de places soutenues.", mg: "Omena lanja ny talenta sy ny finiavana; kendrena ho 35–40 % ny toerana tohanana." },
      },
      {
        icon: "02",
        label: { en: "COMPETE", fr: "COMPÉTITION", mg: "FIFANINANANA" },
        title: { en: "A 3x3 competition engine", fr: "Un moteur de compétition 3x3", mg: "Fifaninanana 3x3 ho motera" },
        body: { en: "Local games create milestones, visibility and a pathway to sanctioned play.", fr: "Les matchs locaux créent des étapes, de la visibilité et un parcours vers les compétitions reconnues.", mg: "Manome tanjona, traikefa ary lalana mankany amin’ny fifaninanana ekena ny lalao eo an-toerana." },
      },
      {
        icon: "03",
        label: { en: "PROGRESS", fr: "PROGRÈS", mg: "FANDROSOANA" },
        title: { en: "Measurable learning", fr: "Des progrès scolaires mesurables", mg: "Fandrosoana azo refesina" },
        body: { en: "Track attendance, study engagement and school progress with guardian consent.", fr: "Suivre la présence, l’engagement dans les études et les progrès scolaires avec l’accord des tuteurs.", mg: "Araho ny fanatrehana sy ny fandrosoana amin’ny fianarana, rehefa nahazoana faneken’ny mpiambina." },
      },
    ],
    coreLabel: { en: "THE WHOLE\nPLAYER", fr: "LE JEUNE\nDANS SON ENSEMBLE", mg: "NY TANORA\nAMIN’NY LAFINY REHETRA" },
    nodeLabels: [
      { en: "ACCESS", fr: "ACCÈS", mg: "FAHAFahana" },
      { en: "COMPETE", fr: "JOUER", mg: "MILALAO" },
      { en: "PROGRESS", fr: "PROGRESSER", mg: "MANDROSO" },
    ],
    promise: {
      en: "Sport complements school. It never replaces it.",
      fr: "Le sport complète l’école; il ne la remplace jamais.",
      mg: "Manampy ny fianarana ny fanatanjahantena; tsy misolo azy velively.",
    },
  },
  {
    id: "programs",
    type: "tiers",
    kicker: { en: "PROGRAMS THAT GROW", fr: "DES PROGRAMMES ÉVOLUTIFS", mg: "FANDAHARANA MAMPANDROSO" },
    title: {
      en: "A pathway that grows with the player.",
      fr: "Un parcours qui grandit avec le joueur.",
      mg: "Lalana mivoatra miaraka amin’ny mpilalao.",
    },
    lead: {
      en: "Three basketball tiers. The same commitment to learning, leadership and health at every stage.",
      fr: "Trois niveaux de basketball. Le même engagement envers l’apprentissage, le leadership et la santé à chaque étape.",
      mg: "Ambaratonga telo amin’ny basket. Mitohy amin’ny dingana rehetra ny fanohanana ny fianarana, ny fitarihana ary ny fahasalamana.",
    },
    tiers: [
      {
        number: "01",
        title: { en: "Beginner · Mianatra", fr: "Débutant · Mianatra", mg: "Beginner · Mianatra" },
        body: { en: "Fundamentals, confidence and game basics.", fr: "Fondamentaux, confiance et règles de base.", mg: "Fototra, fahatokisan-tena ary fitsipika fototra." },
      },
      {
        number: "02",
        title: { en: "Competitive · Mifaninana", fr: "Compétition · Mifaninana", mg: "Competitive · Mifaninana" },
        body: { en: "Team play, tactics, fitness and regular 3x3.", fr: "Jeu collectif, tactique, condition physique et 3x3 régulier.", mg: "Fiaraha-milalao, tetika, fahasalamana ara-batana ary 3x3 tsy tapaka." },
      },
      {
        number: "03",
        title: { en: "Elite · Mpiandry Lalao", fr: "Élite · Mpiandry Lalao", mg: "Elite · Mpiandry Lalao" },
        body: { en: "Advanced skills, mentoring and a competition pathway.", fr: "Perfectionnement, mentorat et parcours vers la compétition.", mg: "Fahaiza-manao avo lenta, fanoroana lalana ary fiomanana amin’ny fifaninanana." },
      },
    ],
    learningLabel: { en: "BUILT INTO EVERY TIER", fr: "À CHAQUE NIVEAU", mg: "MISY ISAKY NY AMBARAMPIHA" },
    learning: [
      { en: "English", fr: "Anglais", mg: "Anglisy" },
      { en: "Study hall", fr: "Étude encadrée", mg: "Ora fianarana" },
      { en: "Leadership", fr: "Leadership", mg: "Fitarihana" },
      { en: "Health", fr: "Santé", mg: "Fahasalamana" },
    ],
    asideLabel: { en: "A DEVELOPMENT PATHWAY", fr: "UN PARCOURS DE PROGRESSION", mg: "LALANA FAMPANDROSOANA" },
    asideNote: { en: "Progress through readiness, effort and learning—not points alone.", fr: "La progression repose sur la préparation, l’effort et l’apprentissage — pas seulement sur les points.", mg: "Mandroso araka ny fahavononana, ezaka ary fianarana — fa tsy ny isa azo ihany." },
  },
  {
    id: "pricing",
    type: "pricing",
    kicker: { en: "ACCESS BY DESIGN", fr: "L’ACCÈS POUR TOUS", mg: "FAHAFAHANA MIDITRA HO AN’NY REHETRA" },
    title: {
      en: "Access should never depend on the size of a wallet.",
      fr: "L’accès ne doit jamais dépendre du portefeuille.",
      mg: "Tsy tokony hiankina amin’ny haben’ny vola ny fahafahana mandray anjara.",
    },
    lead: {
      en: "A family-first price ladder protects access and sustains the program. Fees are set locally—not guessed.",
      fr: "Une tarification pensée pour les familles protège l’accès et la pérennité du programme. Les montants seront définis localement, sans être improvisés.",
      mg: "Miaro ny fahafahana mandray anjara sy ny faharetan’ny fandaharana ny sarany mifanaraka amin’ny fianakaviana. Eto an-toerana no hamaritra ny vola fa tsy vinavinaina fotsiny.",
    },
    pricing: [
      {
        tier: { en: "SUPPORTED", fr: "SOUTENU", mg: "TOHANANA" },
        title: { en: "Scholarship", fr: "Bourse", mg: "Vatsim-pianarana" },
        body: { en: "Need-informed reduced-fee or supported places.", fr: "Places avec bourse ou tarif réduit selon les besoins.", mg: "Toerana misy vatsim-pianarana na sarany ahena araka ny filàna." },
      },
      {
        tier: { en: "STANDARD", fr: "STANDARD", mg: "MAHAZATRA" },
        title: { en: "Local monthly fee", fr: "Tarif mensuel local", mg: "Sarany isam-bolana eto an-toerana" },
        body: { en: "Set after parent research and a cost review.", fr: "Fixé après une enquête auprès des familles et une analyse des coûts.", mg: "Hofaritana rehefa vita ny fanadihadiana sy ny kajy ny fandaniana." },
      },
      {
        tier: { en: "PATRON", fr: "MÉCÈNE", mg: "MPANOHANA" },
        title: { en: "Give a little more", fr: "Contribuer davantage", mg: "Mandray anjara bebe kokoa" },
        body: { en: "A recurring gift helps fund supported places.", fr: "Un don régulier contribue au financement des places soutenues.", mg: "Manampy amin’ny famatsiana ireo toerana tohanana ny fanomezana miverimberina." },
      },
    ],
    ankerLabel: { en: "ANKER REFERENCE · URBAN 2025", fr: "RÉFÉRENCE ANKER · URBAIN 2025", mg: "Tondro ANKER · TANÀNA 2025" },
    ankerValue: "MGA 707,181",
    ankerUnit: { en: "per month · about US$158", fr: "par mois · environ 158 USD", mg: "isam-bolana · eo amin’ny 158 USD" },
    ankerCaveat: {
      en: "Affordability context—not a legal minimum wage or a proxy for every household’s disposable income.",
      fr: "Repère d’accessibilité — ni salaire minimum légal ni mesure du revenu disponible de chaque ménage.",
      mg: "Tondro momba ny fahafahana mandoa — tsy karama farany ambany ara-dalàna na refy maneho ny vola azon’ny tokantrano rehetra ampiasaina.",
    },
    paymentLabel: { en: "PAYMENT OPTIONS", fr: "MOYENS DE PAIEMENT", mg: "FOMBA FANDOAVANA" },
    payments: [
      { en: "MGA billing", fr: "Tarifs en MGA", mg: "Sarany amin’ny MGA" },
      { en: "Mobile Money", fr: "Mobile Money", mg: "Mobile Money" },
      { en: "Cash + receipt", fr: "Espèces + reçu", mg: "Vola + tapakila" },
    ],
    sourceLinks: [
      { label: { en: "Anker Research Institute · 2025", fr: "Anker Research Institute · 2025", mg: "Anker Research Institute · 2025" }, url: "https://www.ankerresearchinstitute.org/madagascar-home" },
    ],
  },
  {
    id: "operations",
    type: "operations",
    kicker: { en: "ASSET-LIGHT OPERATIONS", fr: "DES OPÉRATIONS LÉGÈRES", mg: "FAMPIANDEHANANA TSY MITAKY RENIVOLA BE" },
    title: {
      en: "Start light. Stay resilient. Scale with partners.",
      fr: "Démarrer léger. Rester résilient. Grandir avec des partenaires.",
      mg: "Manomboka tsotra. Miomana amin’ny toetr’andro. Manitatra miaraka amin’ny mpiara-miombon’antoka.",
    },
    lead: {
      en: "An outdoor–indoor hybrid in Antananarivo keeps the pilot flexible without a major new build.",
      fr: "Un modèle hybride extérieur–intérieur à Antananarivo rend le pilote flexible sans construction lourde.",
      mg: "Ny fampifangaroana kianja ivelany sy toerana anatiny eto Antananarivo dia manome fahafaha-miova nefa tsy mila fanorenana lehibe.",
    },
    ops: [
      {
        icon: "01",
        title: { en: "Outdoor base", fr: "Base extérieure", mg: "Kianja ivelany" },
        body: { en: "Book existing courts for core sessions; use portable gear and secure storage.", fr: "Réserver des terrains existants pour les séances; utiliser du matériel transportable et un rangement sécurisé.", mg: "Alamina ny fampiasana kianja efa misy; ampiasaina ny fitaovana azo afindra sy toerana fitahirizana azo antoka." },
      },
      {
        icon: "02",
        title: { en: "Indoor fallback", fr: "Solution couverte", mg: "Toerana anatiny ho solony" },
        body: { en: "Agree partner gym hours for rain, severe weather and safer rescheduling.", fr: "Convenir d’horaires dans une salle partenaire en cas de pluie ou de météo difficile.", mg: "Alamina mialoha ny fampiasana toerana anatiny iarahana amin’ny mpiara-miombon’antoka rehefa ratsy ny andro." },
      },
    ],
    resilienceLabel: { en: "READY FOR REAL-WORLD WEATHER", fr: "PRÉPARÉ AUX ALÉAS MÉTÉO", mg: "MIOMANA AMIN’NY TOETR’ANDRO MIOVA" },
    resilience: { en: "Seasonal timetable · safety kit · family updates", fr: "Calendrier saisonnier · trousse de sécurité · nouvelles aux familles", mg: "Fandaharam-potoana araka ny vanim-potoana · fitaovana fiarovana · fampahafantarana ny fianakaviana" },
    citiesLabel: { en: "POTENTIAL FUTURE HUBS", fr: "PÔLES FUTURS POTENTIELS", mg: "TOERANA METY HANITARANA" },
    cities: ["Toamasina", "Antsirabe", "Mahajanga", "Fianarantsoa"],
    centerLabel: { en: "PILOT\nANTANANARIVO", fr: "PILOTE\nANTANANARIVO", mg: "PILOTY\nANTANANARIVO" },
    potential: { en: "POTENTIAL", fr: "POTENTIEL", mg: "METY" },
    asideNote: { en: "Expand only after venue, local lead, funding and safety are secured.", fr: "Étendre le programme après confirmation du site, du responsable local, du financement et de la sécurité.", mg: "Hanitatra rehefa azo antoka ny toerana, ny tompon’andraikitra eo an-toerana, ny famatsiam-bola ary ny fiarovana." },
  },
  {
    id: "partners",
    type: "partners",
    kicker: { en: "PARTNERSHIP ENGINE", fr: "MOTEUR DE PARTENARIAT", mg: "FIARAHA-MIASA HO MOTERA" },
    title: {
      en: "Build an ecosystem before building a facility.",
      fr: "Construire un écosystème avant un équipement.",
      mg: "Aorina aloha ny tambajotra vao manangana fotodrafitrasa.",
    },
    lead: {
      en: "The pilot succeeds through shared expertise, safe access and diversified support—not one institution acting alone.",
      fr: "Le pilote repose sur des compétences partagées, un accès sûr et des soutiens diversifiés — pas sur une seule institution.",
      mg: "Mila fahaiza-manao iarahana, fahafahana miditra azo antoka ary fanohanana samihafa ny piloty — fa tsy andrim-panjakana iray irery.",
    },
    status: { en: "PROPOSED · NOT CONFIRMED", fr: "PROPOSÉ · NON CONFIRMÉ", mg: "SOSO-KEVITRA · TSY MBOLA VOAMARINA" },
    partners: [
      {
        icon: "F",
        name: { en: "FIMABA", fr: "FIMABA", mg: "FIMABA" },
        body: { en: "Technical guidance, coach development and competition alignment.", fr: "Conseil technique, formation des entraîneurs et alignement des compétitions.", mg: "Torohevitra ara-teknika, fanofanana mpanazatra ary fandrindrana fifaninanana." },
      },
      {
        icon: "S",
        name: { en: "Schools", fr: "Écoles", mg: "Sekoly" },
        body: { en: "Youth referrals, study support, school-calendar alignment and possible court hours.", fr: "Orientation des jeunes, soutien scolaire, coordination du calendrier et accès éventuel aux terrains.", mg: "Fampahafantarana tanora, fanohanana ny fianarana, fandrindrana ny tetiandron’ny sekoly ary mety ho fampiasana kianja." },
      },
      {
        icon: "NGO",
        name: { en: "NGOs + FIBA Foundation", fr: "ONG + FIBA Foundation", mg: "ONG + FIBA Foundation" },
        body: { en: "Explore inclusion, safeguarding, youth-development practice and eligible grants.", fr: "Explorer l’inclusion, la protection, les pratiques de développement des jeunes et les subventions admissibles.", mg: "Dinihina ny fampidirana ny rehetra, ny fiarovana, ny fomba fampandrosoana ny tanora ary ny famatsiam-bola azo angatahina." },
      },
      {
        icon: "C",
        name: { en: "Telcos + banks", fr: "Opérateurs + banques", mg: "Orinasa telefaonina + banky" },
        body: { en: "Invite support for Mobile Money, scholarships, kits, connectivity and financial literacy.", fr: "Proposer un soutien au Mobile Money, aux bourses, aux équipements, à la connectivité et à l’éducation financière.", mg: "Asaina hanohana ny Mobile Money, ny vatsim-pianarana, ny fitaovana, ny fifandraisana ary ny fahaiza-mitantana vola." },
      },
    ],
    center: { en: "HOOP\nHORIZONS", fr: "HOOP\nHORIZONS", mg: "HOOP\nHORIZONS" },
    nodeLabels: [
      { en: "FIMABA", fr: "FIMABA", mg: "FIMABA" },
      { en: "SCHOOLS", fr: "ÉCOLES", mg: "SEKOLY" },
      { en: "NGOS +\nFOUNDATION", fr: "ONG +\nFONDATION", mg: "ONG +\nFOTOTRA" },
      { en: "TELCOS +\nBANKS", fr: "TÉLÉCOMS +\nBANQUES", mg: "TELEFAONINA +\nBANKY" },
      { en: "PATRON\nFAMILIES", fr: "FAMILLES\nMÉCÈNES", mg: "FIANAKAVIANA\nMPANOHANA" },
    ],
    ask: { en: "Co-design a 12-month pilot contribution.", fr: "Co-construire une contribution au pilote sur 12 mois.", mg: "Miaraha mandrafitra ny anjara biriky mandritra ny 12 volana." },
  },
  {
    id: "finance",
    type: "finance",
    kicker: { en: "A RESILIENT BUSINESS MODEL", fr: "UN MODÈLE PÉRENNE", mg: "MODELY MAHARITRA" },
    title: {
      en: "Five engines. One resilient model.",
      fr: "Cinq moteurs. Un modèle résilient.",
      mg: "Loharanom-bola dimy. Modely iray maharitra.",
    },
    lead: {
      en: "Blend earned income and partner support, with a hard cap on concentration and a measured route to break-even.",
      fr: "Combiner revenus propres et soutien des partenaires, limiter la dépendance et viser un seuil de rentabilité mesurable.",
      mg: "Ampifangaroina ny vola miditra sy ny fanohanan’ny mpiara-miombon’antoka, ferana ny fiankinan-doha amin’ny loharano iray ary kendrena ny fifandanjana ara-bola.",
    },
    capitalLabel: { en: "START-UP CAPITAL", fr: "CAPITAL DE DÉMARRAGE", mg: "RENIVOLA FANOMBOHANA" },
    capital: "~146M MGA",
    capitalUsd: "~US$31.7k",
    capitalNote: { en: "Planning estimate · validate quotes + FX", fr: "Estimation · valider les devis + le change", mg: "Vinavina · hamarinina ny tolotra sy ny fifanakalozana" },
    streamsLabel: { en: "5 REVENUE STREAMS", fr: "5 SOURCES DE REVENUS", mg: "LOHARANOM-BOLA 5" },
    streams: [
      { en: "Tuition", fr: "Frais de programme", mg: "Saram-piofanana" },
      { en: "Sponsorships", fr: "Parrainages", mg: "Fanohanana" },
      { en: "Events", fr: "Événements", mg: "Hetsika" },
      { en: "Merchandise", fr: "Produits dérivés", mg: "Entana amidy" },
      { en: "Grants", fr: "Subventions", mg: "Fanomezana" },
    ],
    ruleTitle: { en: "40% concentration cap", fr: "Plafond de concentration de 40 %", mg: "Fetra 40 % amin’ny loharano iray" },
    ruleCopy: { en: "No single stream may exceed 40% of annual operating revenue.", fr: "Aucune source ne peut dépasser 40 % des revenus opérationnels annuels.", mg: "Tsy mahazo mihoatra ny 40 % amin’ny vola miditra amin’ny fampandehanana isan-taona ny loharano tokana." },
    breakLabel: { en: "TARGET OPERATING BREAK-EVEN", fr: "SEUIL DE RENTABILITÉ VISÉ", mg: "TANJONA FIFANDANJANA ARA-BOLA" },
    breakTitle: { en: "A disciplined runway—not a promise.", fr: "Un horizon maîtrisé, pas une promesse.", mg: "Fe-potoana voarindra, fa tsy antoka." },
    breakMonths: { en: "Month 27–30", fr: "Mois 27–30", mg: "Volana 27–30" },
    breakCopy: { en: "Depends on enrolment, sponsor renewals, venue use and awarded grants.", fr: "Dépend des inscriptions, du renouvellement des sponsors, de l’utilisation des sites et des subventions obtenues.", mg: "Miankina amin’ny fisoratana anarana, fanavaozan’ny mpanohana, fampiasana toerana ary famatsiam-bola tena azo." },
  },
  {
    id: "impact",
    type: "impact",
    kicker: { en: "MEASURE WHAT MATTERS", fr: "MESURER L’ESSENTIEL", mg: "REFESO NY ZAVA-DEHIBE" },
    title: {
      en: "Track the risks. Prove the outcomes.",
      fr: "Maîtriser les risques. Mesurer les résultats.",
      mg: "Fehezo ny loza. Refeso ny vokatra.",
    },
    lead: {
      en: "Build safety and measurement into delivery from day one. Establish baselines before setting numeric impact targets.",
      fr: "Intégrer la sécurité et la mesure dès le premier jour. Établir les valeurs de départ avant de fixer des objectifs chiffrés.",
      mg: "Ampidirina hatrany am-piandohana ny fiarovana sy ny fandrefesana. Apetraka aloha ny sanda fanombohana vao faritana ny tanjona misy tarehimarika.",
    },
    riskLabel: { en: "RISK → RESPONSE", fr: "RISQUE → RÉPONSE", mg: "LOZA → FEPETRA" },
    risks: [
      { name: { en: "Infrastructure", fr: "Infrastructures", mg: "Fotodrafitrasa" }, action: { en: "Partner venues · backup site", fr: "Sites partenaires · site de repli", mg: "Toerana iarahana · toerana solony" } },
      { name: { en: "Weather", fr: "Météo", mg: "Toetr’andro" }, action: { en: "Indoor fallback · safe pause plan", fr: "Solution en salle · plan de suspension sûr", mg: "Toerana anatiny · drafitra fampiatoana azo antoka" } },
      { name: { en: "Economic volatility", fr: "Volatilité économique", mg: "Fiovaovan’ny toe-karena" }, action: { en: "MGA budgeting · diversified income", fr: "Budget en MGA · revenus diversifiés", mg: "Kajy amin’ny MGA · loharanom-bola samihafa" } },
      { name: { en: "Safeguarding + data", fr: "Protection + données", mg: "Fiarovana + angona" }, action: { en: "Trained coaches · consent · minimum data", fr: "Entraîneurs formés · consentement · données minimales", mg: "Mpanazatra voaofana · fanekena · angona faran’izay kely" } },
    ],
    impactLabel: { en: "SOCIAL IMPACT SCORECARD", fr: "TABLEAU D’IMPACT SOCIAL", mg: "FANDREFESANA NY VOKATRA ARA-TSOSIALY" },
    metrics: [
      { title: { en: "School retention", fr: "Maintien scolaire", mg: "Fitohizan’ny fianarana" }, detail: { en: "Enrolment + attendance", fr: "Inscription + présence", mg: "Fisoratana + fanatrehana" } },
      { title: { en: "Girls’ participation", fr: "Participation des filles", mg: "Fandraisan’anjaran’ny ankizivavy" }, detail: { en: "Access + retention by tier", fr: "Accès + maintien par niveau", mg: "Fandraisana + fitohizana isaky ny ambaratonga" } },
      { title: { en: "English gains", fr: "Progrès en anglais", mg: "Fandrosoana amin’ny anglisy" }, detail: { en: "Baseline → end-term check", fr: "Départ → bilan de trimestre", mg: "Fanombohana → fanombanana faran’ny telo volana" } },
      { title: { en: "Youth employment", fr: "Emploi des jeunes", mg: "Asa ho an’ny tanora" }, detail: { en: "Trained + paid roles", fr: "Formation + postes rémunérés", mg: "Fiofanana + asa misy karama" } },
    ],
    baselineNote: { en: "First cohort sets the baseline · report every term · no results claimed yet", fr: "La première cohorte établit le départ · bilan chaque trimestre · aucun résultat revendiqué à ce stade", mg: "Ny vondrona voalohany no mametraka ny sanda fanombohana · tatitra isaky ny telo volana · tsy mbola misy vokatra lazaina" },
  },
  {
    id: "cta",
    type: "cta",
    kicker: { en: "JOIN THE PILOT", fr: "REJOIGNEZ LE PILOTE", mg: "MIARAHA AMIN’NY PILOTY" },
    title: {
      en: "Help launch the Antananarivo pilot.",
      fr: "Aidez-nous à lancer le pilote d’Antananarivo.",
      mg: "Miaraha manomboka ny piloty eto Antananarivo.",
    },
    lead: {
      en: "A safe court. A stronger classroom. A wider horizon. Let’s build the first season together.",
      fr: "Un terrain sûr. Une classe plus forte. Un horizon plus vaste. Construisons ensemble la première saison.",
      mg: "Kianja azo antoka. Fianarana matanjaka kokoa. Faravodilanitra malalaka kokoa. Andao hiara-hanomboka ny vanim-potoana voalohany.",
    },
    asks: [
      {
        label: { en: "ANCHOR SPONSORS", fr: "SPONSORS PRINCIPAUX", mg: "MPANOHANA LEHIBE" },
        title: { en: "Fund the runway", fr: "Financer le lancement", mg: "Tohano ny fanombohana" },
        body: { en: "Court hours, coach preparation and scholarship places.", fr: "Accès aux terrains, préparation des entraîneurs et bourses.", mg: "Fampiasana kianja, fanomanana mpanazatra ary vatsim-pianarana." },
      },
      {
        label: { en: "PATRON FAMILIES", fr: "FAMILLES MÉCÈNES", mg: "FIANAKAVIANA MPANOHANA" },
        title: { en: "Open a place", fr: "Ouvrir une place", mg: "Manokatra toerana" },
        body: { en: "Back one or more supported youth places.", fr: "Soutenir une ou plusieurs places pour les jeunes.", mg: "Tohano ny toerana iray na maromaro ho an’ny tanora." },
      },
      {
        label: { en: "INSTITUTIONS", fr: "PARTENAIRES INSTITUTIONNELS", mg: "ANDRIM-PANJAKANA MPIARA-MIASA" },
        title: { en: "Open a pathway", fr: "Ouvrir un parcours", mg: "Manokatra lalana" },
        body: { en: "Connect schools, facilities, referrals and safe delivery.", fr: "Relier écoles, sites, orientations et mise en œuvre sûre.", mg: "Ampifandraiso ny sekoly, toerana, fampahafantarana ary fanatanterahana azo antoka." },
      },
    ],
    contactLabel: { en: "JOIN THE PILOT", fr: "REJOINDRE LE PILOTE", mg: "MIARAHA AMIN’NY PILOTY" },
    contactPlaceholder: { en: "[Contact name] · [Email] · [Phone / WhatsApp]", fr: "[Nom du contact] · [E-mail] · [Téléphone / WhatsApp]", mg: "[Anaran’ny olona ifandraisana] · [Mailaka] · [Telefaonina / WhatsApp]" },
    closingTitle: { en: "The next horizon starts here.", fr: "Le prochain horizon commence ici.", mg: "Eto no anombohan’ny faravodilanitra vaovao." },
    closingNote: { en: "Antananarivo · First cohort · Shared impact", fr: "Antananarivo · Première cohorte · Impact partagé", mg: "Antananarivo · Vondrona voalohany · Vokatra iarahana" },
  },
];

let activeLanguage = "en";
let activeSlide = 0;
const mount = document.getElementById("slide-mount");
const dots = document.getElementById("slide-dots");
const prevButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const presentButton = document.getElementById("present-button");

function t(value) {
  if (value && typeof value === "object") return value[activeLanguage] || value.en || "";
  return value ?? "";
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function svgBall(className = "hero-ball") {
  return `<div class="${className}" aria-hidden="true">
    <svg viewBox="0 0 200 200" role="presentation">
      <circle class="ball-fill" cx="100" cy="100" r="93"></circle>
      <path class="ball-line" d="M8 100h184M100 8v184M35 31c39 29 58 75 65 161M165 31c-39 29-58 75-65 161"></path>
      <path class="ball-line" d="M16 60c25 11 48 13 68 5M116 135c22-7 45-4 68 6"></path>
    </svg>
  </div>`;
}

function sourceNote(items) {
  if (!items || !items.length) return "";
  return `<div class="source-note"><span>${escapeHTML(languageData[activeLanguage].sourceLabel)}:</span>${items.map((item, index) => `${index ? '<span class="source-separator">·</span>' : ""}<a href="${item.url}" target="_blank" rel="noreferrer">${escapeHTML(t(item.label))}</a>`).join("")}</div>`;
}

function renderCover(slide) {
  return `<div class="cover-brand">
      <div class="cover-brand-mark" aria-hidden="true">HH</div>
      <div class="cover-brand-name"><strong>${escapeHTML(t(slide.brand))}</strong><small>${escapeHTML(t(slide.subbrand))}</small></div>
    </div>
    <h1 class="slide-title">${escapeHTML(t(slide.title))}</h1>
    <div class="mission-box"><strong>${escapeHTML(t(slide.missionLabel))}</strong><br>${escapeHTML(t(slide.lead))}</div>`;
}

function renderOpportunity(slide) {
  return `<div class="stats-grid">
      ${slide.stats.map(stat => `<div class="stat-card">
        <span class="stat-value">${escapeHTML(stat.value)}</span>
        <span class="stat-tag">${escapeHTML(t(stat.tag))}</span>
        <span class="stat-label">${escapeHTML(t(stat.label))}</span>
        <span class="stat-date">${escapeHTML(stat.note[activeLanguage])}</span>
      </div>`).join("")}
    </div>
    <div class="fiba-card"><div class="fiba-laurel">3×3</div><div class="fiba-copy"><strong>${escapeHTML(t(slide.fibaTitle))}</strong><span>${escapeHTML(t(slide.fibaLine))}</span></div></div>
    <div class="pilot-thesis"><span class="mini-card-label"><span class="index">↗</span>${escapeHTML(t(slide.testLabel))}</span><p>${escapeHTML(t(slide.testCopy))}</p></div>`;
}

function renderPillars(slide) {
  return `<div class="card-grid card-grid-three">
      ${slide.pillars.map(pillar => `<article class="mini-card pillar-card">
        <div class="pillar-icon">${escapeHTML(pillar.icon)}</div>
        <div class="mini-card-label"><span class="index">${escapeHTML(pillar.label[activeLanguage])}</span></div>
        <h2 class="mini-card-title">${escapeHTML(t(pillar.title))}</h2>
        <p class="mini-card-body">${escapeHTML(t(pillar.body))}</p>
      </article>`).join("")}
    </div>
    <div class="promise-line"><span class="promise-check">✓</span>${escapeHTML(t(slide.promise))}</div>`;
}

function renderTiers(slide) {
  return `<div class="tier-stack">
      ${slide.tiers.map(tier => `<article class="tier-card">
        <span class="tier-number">${escapeHTML(tier.number)}</span>
        <div><h2 class="tier-title">${escapeHTML(t(tier.title))}</h2><p class="tier-desc">${escapeHTML(t(tier.body))}</p></div>
        <span class="tier-arrow" aria-hidden="true">↗</span>
      </article>`).join("")}
    </div>
    <div class="learning-heading">${escapeHTML(t(slide.learningLabel))}</div>
    <div class="learning-strip">${slide.learning.map(item => `<span>${escapeHTML(t(item))}</span>`).join("")}</div>`;
}

function renderPricing(slide) {
  return `<div class="price-card-row">
      ${slide.pricing.map((item, index) => `<article class="price-card ${index === 1 ? "featured" : ""}">
        <span class="price-tier">${escapeHTML(t(item.tier))}</span>
        <h2 class="price-name">${escapeHTML(t(item.title))}</h2>
        <p class="price-copy">${escapeHTML(t(item.body))}</p>
      </article>`).join("")}
    </div>
    <div class="price-target"><strong>35–40%</strong><span>${activeLanguage === "fr" ? "des places avec soutien" : activeLanguage === "mg" ? "amin’ny toerana tohanana" : "of pilot places supported"}</span></div>`;
}

function renderOperations(slide) {
  return `<div class="ops-cards">
      ${slide.ops.map((item, index) => `<article class="ops-card">
        <div class="ops-icon">${escapeHTML(item.icon)}</div>
        <h2 class="ops-title">${escapeHTML(t(item.title))}</h2>
        <p class="ops-copy">${escapeHTML(t(item.body))}</p>
      </article>`).join("")}
    </div>
    <div class="weather-bar"><span class="weather-icon">☼</span><span><strong>${escapeHTML(t(slide.resilienceLabel))}</strong><small>${escapeHTML(t(slide.resilience))}</small></span></div>
    <div class="city-label">${escapeHTML(t(slide.citiesLabel))}</div>
    <div class="city-list">${slide.cities.map(city => `<span class="city-chip">${escapeHTML(city)}</span>`).join("")}</div>`;
}

function renderPartners(slide) {
  return `<div class="partner-status"><span class="status-dot"></span>${escapeHTML(t(slide.status))}</div>
    <div class="partner-list">
      ${slide.partners.map(partner => `<article class="partner-item">
        <span class="partner-icon">${escapeHTML(partner.icon)}</span>
        <span><strong class="partner-name">${escapeHTML(t(partner.name))}</strong><span class="partner-description">${escapeHTML(t(partner.body))}</span></span>
      </article>`).join("")}
    </div>
    <div class="partner-ask"><span>→</span>${escapeHTML(t(slide.ask))}</div>`;
}

function renderFinance(slide) {
  return `<div class="financial-main">
      <div class="capital-card">
        <span class="capital-label">${escapeHTML(t(slide.capitalLabel))}</span>
        <strong class="capital-value">${escapeHTML(slide.capital)}</strong>
        <span class="capital-usd">${escapeHTML(slide.capitalUsd)}</span>
        <p class="capital-caption">${escapeHTML(t(slide.capitalNote))}</p>
      </div>
      <div class="stream-panel">
        <h2 class="stream-panel-title">${escapeHTML(t(slide.streamsLabel))}</h2>
        <div class="stream-grid">${slide.streams.map((item, index) => `<span class="stream-chip"><b>${index + 1}</b>${escapeHTML(t(item))}</span>`).join("")}</div>
      </div>
    </div>
    <div class="revenue-rule"><span class="rule-number">≤40%</span><span class="rule-text"><strong>${escapeHTML(t(slide.ruleTitle))}</strong><span>${escapeHTML(t(slide.ruleCopy))}</span></span></div>`;
}

function renderImpact(slide) {
  return `<div class="risk-list">
      ${slide.risks.map(item => `<div class="risk-row"><strong class="risk-name"><i class="risk-mark"></i>${escapeHTML(t(item.name))}</strong><span class="risk-action">${escapeHTML(t(item.action))}</span></div>`).join("")}
    </div>`;
}

function renderCTA(slide) {
  return `<div class="cta-grid">
      ${slide.asks.map(item => `<article class="cta-card">
        <span class="cta-label">${escapeHTML(t(item.label))}</span>
        <h2 class="cta-title">${escapeHTML(t(item.title))}</h2>
        <p class="cta-copy">${escapeHTML(t(item.body))}</p>
      </article>`).join("")}
    </div>
    <div class="contact-row"><span class="contact-label">${escapeHTML(t(slide.contactLabel))}</span><span class="contact-placeholder">${escapeHTML(t(slide.contactPlaceholder))}</span></div>`;
}

function renderMain(slide) {
  switch (slide.type) {
    case "cover": return renderCover(slide);
    case "opportunity": return renderOpportunity(slide);
    case "pillars": return renderPillars(slide);
    case "tiers": return renderTiers(slide);
    case "pricing": return renderPricing(slide);
    case "operations": return renderOperations(slide);
    case "partners": return renderPartners(slide);
    case "finance": return renderFinance(slide);
    case "impact": return renderImpact(slide);
    case "cta": return renderCTA(slide);
    default: return "";
  }
}

function renderVisual(slide) {
  switch (slide.type) {
    case "cover":
      return `<div class="court-art">
        <div class="court-floor"><div class="court-paint"></div></div>
        ${svgBall()}
        <div class="hero-sticker"><strong>3 × 3</strong><span>${escapeHTML(t(slide.visualLabel))}</span></div>
      </div>`;
    case "opportunity":
      return `<div class="scoreboard-art">
        <div class="scoreboard-top"><span>${escapeHTML(t(slide.boardKicker))}</span><span class="scoreboard-year">2024</span></div>
        <h2 class="scoreboard-title">${escapeHTML(t(slide.boardTitle))}</h2>
        <div class="scoreboard-winners">
          <div class="winner-row"><span>${escapeHTML(t(slide.men))}</span><strong>MAD</strong></div>
          <div class="winner-row"><span>${escapeHTML(t(slide.women))}</span><strong>MAD</strong></div>
        </div>
        <div class="score-court" aria-hidden="true"></div>
      </div>${sourceNote(slide.sourceLinks)}`;
    case "pillars":
      return `<div class="value-diagram">
        <div class="value-ring" aria-hidden="true"></div>
        <div class="value-core">${escapeHTML(t(slide.coreLabel)).replaceAll("\n", "<br>")}</div>
        <div class="value-node one">${escapeHTML(slide.nodeLabels[0][activeLanguage])}</div>
        <div class="value-node two">${escapeHTML(slide.nodeLabels[1][activeLanguage])}</div>
        <div class="value-node three">${escapeHTML(slide.nodeLabels[2][activeLanguage])}</div>
      </div>
      <div class="aside-caption">${activeLanguage === "fr" ? "SPORT · APPRENTISSAGE · AVENIR" : activeLanguage === "mg" ? "FANATANJAHANTENA · FIANARANA · HOAVY" : "SPORT · LEARNING · FUTURE"}</div>`;
    case "tiers":
      return `<div class="tier-visual">
        <div class="tier-track"></div>
        ${slide.tiers.map((tier, index) => `<div class="tier-step step-${index + 1}"><span class="step-tag">T${index + 1}</span><strong>${escapeHTML(t(tier.title).split(" · ")[0])}</strong><small>${escapeHTML(t(tier.body))}</small></div>`).join("")}
        <div class="tier-visual-footer"><span class="tier-mini-ball">●</span><span>${escapeHTML(t(slide.asideLabel))}</span></div>
      </div><p class="aside-note">${escapeHTML(t(slide.asideNote))}</p>`;
    case "pricing":
      return `<div class="anker-panel">
        <span class="anker-label">${escapeHTML(t(slide.ankerLabel))}</span>
        <strong class="anker-value">${escapeHTML(slide.ankerValue)}</strong>
        <span class="anker-units">${escapeHTML(t(slide.ankerUnit))}</span>
        <p class="anker-caveat">${escapeHTML(t(slide.ankerCaveat))}</p>
        <div class="payment-heading">${escapeHTML(t(slide.paymentLabel))}</div>
        <div class="payment-pills">${slide.payments.map(item => `<span>${escapeHTML(t(item))}</span>`).join("")}</div>
      </div>${sourceNote(slide.sourceLinks)}`;
    case "operations":
      return `<div class="hub-visual">
        <div class="hub-orbit"></div>
        <div class="hub-line l1"></div><div class="hub-line l2"></div><div class="hub-line l3"></div><div class="hub-line l4"></div>
        <div class="hub-center">${escapeHTML(t(slide.centerLabel)).replaceAll("\n", "<br>")}</div>
        <div class="hub-dot a"><strong>Toamasina</strong><small>${escapeHTML(t(slide.potential))}</small></div>
        <div class="hub-dot b"><strong>Antsirabe</strong><small>${escapeHTML(t(slide.potential))}</small></div>
        <div class="hub-dot c"><strong>Mahajanga</strong><small>${escapeHTML(t(slide.potential))}</small></div>
        <div class="hub-dot d"><strong>Fianarantsoa</strong><small>${escapeHTML(t(slide.potential))}</small></div>
      </div><p class="aside-note">${escapeHTML(t(slide.asideNote))}</p>`;
    case "partners":
      return `<div class="network-art">
        <div class="proposed-stamp">${escapeHTML(t(slide.status))}</div>
        <div class="network-lines"></div>
        <div class="network-core">${escapeHTML(t(slide.center)).replaceAll("\n", "<br>")}</div>
        ${slide.nodeLabels.map((item, index) => `<div class="network-node n${index + 1}">${escapeHTML(item[activeLanguage]).replaceAll("\n", "<br>")}</div>`).join("")}
      </div>`;
    case "finance":
      return `<div class="break-even-panel">
        <div><span class="break-label">${escapeHTML(t(slide.breakLabel))}</span><h2 class="break-title">${escapeHTML(t(slide.breakTitle))}</h2></div>
        <div>
          <div class="break-line"><span class="break-dot start"></span><span class="break-dot target"></span><span class="break-dot end"></span></div>
          <div class="break-months"><span>0</span><span>12</span><span>24</span><span>36</span></div>
          <div class="break-target"><strong>27–30</strong><span>${escapeHTML(t(slide.breakMonths))}<br>${escapeHTML(t(slide.breakCopy))}</span></div>
        </div>
      </div>`;
    case "impact":
      return `<div class="impact-panel">
        <h2 class="impact-title">${escapeHTML(t(slide.impactLabel))}</h2>
        <div class="impact-grid">${slide.metrics.map(metric => `<div class="impact-item"><strong>${escapeHTML(t(metric.title))}</strong><span>${escapeHTML(t(metric.detail))}</span></div>`).join("")}</div>
        <p class="baseline-note">${escapeHTML(t(slide.baselineNote))}</p>
      </div>`;
    case "cta":
      return `<div class="cta-art">
        ${svgBall("cta-ball")}
        <span class="cta-art-label">${escapeHTML(t(slide.closingNote))}</span>
        <h2 class="cta-art-title">${escapeHTML(t(slide.closingTitle))}</h2>
        <p class="cta-art-note">${escapeHTML(t(slide.lead))}</p>
      </div>`;
    default: return "";
  }
}

function render() {
  const slide = slides[activeSlide];
  const ui = languageData[activeLanguage];
  document.documentElement.lang = activeLanguage;
  document.title = `${t(slide.brand || { en: "Hoop Horizons Madagascar", fr: "Hoop Horizons Madagascar", mg: "Hoop Horizons Madagascar" })} — ${t(slide.title)}`;
  document.getElementById("deck-label").textContent = ui.deckLabel;
  document.getElementById("brand-subtitle").textContent = ui.deckSubtitle;
  document.getElementById("deck-overline-text").textContent = ui.overline;
  document.getElementById("present-label").textContent = document.body.classList.contains("is-presenting") ? ui.exitPresent : ui.present;
  document.getElementById("footer-note").textContent = ui.footer;
  document.getElementById("footer-slogan").textContent = ui.footerSlogan;
  document.getElementById("language-switch").setAttribute("aria-label", ui.languageLabel);
  document.getElementById("deck-nav").setAttribute("aria-label", ui.navLabel);
  document.getElementById("brand-home").setAttribute("aria-label", ui.brandAria);
  prevButton.setAttribute("aria-label", ui.previous);
  nextButton.setAttribute("aria-label", ui.next);
  dots.setAttribute("aria-label", ui.allSlides);

  const isCover = slide.type === "cover";
  mount.innerHTML = `<article class="slide-frame slide-${slide.type}" id="slide-${activeSlide + 1}" role="tabpanel" aria-labelledby="language-tab-${activeLanguage}" aria-label="${escapeHTML(ui.slideAria(activeSlide + 1, slides.length))}">
    <div class="slide-copy">
      <div class="slide-kicker">${escapeHTML(t(slide.kicker))}</div>
      ${isCover ? "" : `<h1 class="slide-title">${escapeHTML(t(slide.title))}</h1><p class="slide-lead">${escapeHTML(t(slide.lead))}</p>`}
      <div class="slide-content">${renderMain(slide)}</div>
      ${sourceNote(slide.type === "opportunity" || slide.type === "pricing" ? null : slide.sourceLinks)}
    </div>
    <aside class="slide-aside" aria-label="${escapeHTML(t(slide.kicker))} visual">${renderVisual(slide)}</aside>
  </article>`;

  document.getElementById("current-slide-number").textContent = String(activeSlide + 1).padStart(2, "0");
  document.getElementById("total-slide-number").textContent = String(slides.length).padStart(2, "0");
  document.getElementById("progress-bar").style.width = `${((activeSlide + 1) / slides.length) * 100}%`;
  prevButton.disabled = activeSlide === 0;
  nextButton.disabled = activeSlide === slides.length - 1;
  document.querySelectorAll(".language-tab").forEach(button => {
    const selected = button.dataset.lang === activeLanguage;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  document.querySelectorAll(".slide-dot").forEach((button, index) => {
    const selected = index === activeSlide;
    button.classList.toggle("is-active", selected);
    if (selected) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  const hash = `#slide-${activeSlide + 1}`;
  if (window.location.hash !== hash) history.replaceState(null, "", hash);
}

function buildDots() {
  dots.innerHTML = slides.map((slide, index) => `<button class="slide-dot ${index === activeSlide ? "is-active" : ""}" type="button" data-slide-index="${index}" aria-label="${escapeHTML(languageData[activeLanguage].slideAria(index + 1, slides.length))}: ${escapeHTML(t(slide.title))}" title="${escapeHTML(t(slide.title))}">${String(index + 1).padStart(2, "0")}</button>`).join("");
  dots.querySelectorAll(".slide-dot").forEach(button => button.addEventListener("click", () => goTo(Number(button.dataset.slideIndex))));
}

function goTo(index) {
  activeSlide = Math.max(0, Math.min(slides.length - 1, index));
  render();
  buildDots();
}

function updateLanguage(language) {
  activeLanguage = language;
  render();
  buildDots();
}

prevButton.addEventListener("click", () => goTo(activeSlide - 1));
nextButton.addEventListener("click", () => goTo(activeSlide + 1));
document.querySelectorAll(".language-tab").forEach(button => button.addEventListener("click", () => updateLanguage(button.dataset.lang)));
presentButton.addEventListener("click", async () => {
  const wantsExit = document.body.classList.contains("is-presenting");
  if (wantsExit) {
    document.body.classList.remove("is-presenting");
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (_) { /* Ignore browser-specific fullscreen errors. */ }
    }
  } else {
    document.body.classList.add("is-presenting");
    try { await document.documentElement.requestFullscreen(); } catch (_) { /* Fullscreen can be unavailable in embedded previews. */ }
  }
  render();
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) document.body.classList.remove("is-presenting");
  render();
});
document.addEventListener("keydown", event => {
  if (event.key === "ArrowRight" || event.key === "PageDown") goTo(activeSlide + 1);
  if (event.key === "ArrowLeft" || event.key === "PageUp") goTo(activeSlide - 1);
  if (event.key === "Home") goTo(0);
  if (event.key === "End") goTo(slides.length - 1);
  if (event.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
});

let touchStartX = null;
mount.addEventListener("touchstart", event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
mount.addEventListener("touchend", event => {
  if (touchStartX === null) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 70) goTo(activeSlide + (delta < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

const initialSlide = Number((window.location.hash.match(/slide-(\d+)/) || [])[1]);
if (initialSlide > 0 && initialSlide <= slides.length) activeSlide = initialSlide - 1;
buildDots();
render();
