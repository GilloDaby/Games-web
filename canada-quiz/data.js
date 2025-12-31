// Données des provinces et territoires du Canada
const PROVINCES_DATA = {
    YT: {
        name: "Yukon",
        capital: "Whitehorse",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Flag_of_Yukon.svg/320px-Flag_of_Yukon.svg.png"
    },
    NT: {
        name: "Territoires du Nord-Ouest",
        capital: "Yellowknife",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Flag_of_the_Northwest_Territories.svg/320px-Flag_of_the_Northwest_Territories.svg.png"
    },
    NU: {
        name: "Nunavut",
        capital: "Iqaluit",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Flag_of_Nunavut.svg/320px-Flag_of_Nunavut.svg.png"
    },
    BC: {
        name: "Colombie-Britannique",
        capital: "Victoria",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Flag_of_British_Columbia.svg/320px-Flag_of_British_Columbia.svg.png"
    },
    AB: {
        name: "Alberta",
        capital: "Edmonton",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Flag_of_Alberta.svg/320px-Flag_of_Alberta.svg.png"
    },
    SK: {
        name: "Saskatchewan",
        capital: "Regina",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flag_of_Saskatchewan.svg/320px-Flag_of_Saskatchewan.svg.png"
    },
    MB: {
        name: "Manitoba",
        capital: "Winnipeg",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Flag_of_Manitoba.svg/320px-Flag_of_Manitoba.svg.png"
    },
    ON: {
        name: "Ontario",
        capital: "Toronto",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Ontario.svg/320px-Flag_of_Ontario.svg.png"
    },
    QC: {
        name: "Québec",
        capital: "Québec",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Flag_of_Quebec.svg/320px-Flag_of_Quebec.svg.png"
    },
    NB: {
        name: "Nouveau-Brunswick",
        capital: "Fredericton",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Flag_of_New_Brunswick.svg/320px-Flag_of_New_Brunswick.svg.png"
    },
    NS: {
        name: "Nouvelle-Écosse",
        capital: "Halifax",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Flag_of_Nova_Scotia.svg/320px-Flag_of_Nova_Scotia.svg.png"
    },
    PE: {
        name: "Île-du-Prince-Édouard",
        capital: "Charlottetown",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Flag_of_Prince_Edward_Island.svg/320px-Flag_of_Prince_Edward_Island.svg.png"
    },
    NL: {
        name: "Terre-Neuve-et-Labrador",
        capital: "St. John's",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Newfoundland_and_Labrador.svg/320px-Flag_of_Newfoundland_and_Labrador.svg.png"
    }
};

// Principales villes du Canada avec leur province
const MAJOR_CITIES = [
    { city: "Toronto", province: "ON", population: "2.7M" },
    { city: "Montréal", province: "QC", population: "1.7M" },
    { city: "Calgary", province: "AB", population: "1.3M" },
    { city: "Ottawa", province: "ON", population: "1M" },
    { city: "Edmonton", province: "AB", population: "980K" },
    { city: "Winnipeg", province: "MB", population: "750K" },
    { city: "Vancouver", province: "BC", population: "630K" },
    { city: "Québec", province: "QC", population: "530K" },
    { city: "Hamilton", province: "ON", population: "540K" },
    { city: "Halifax", province: "NS", population: "440K" },
    { city: "Saskatoon", province: "SK", population: "270K" },
    { city: "Regina", province: "SK", population: "230K" },
    { city: "St. John's", province: "NL", population: "110K" }
];

// Coordonnées exactes pour le mode Précision (basé sur viewBox 0 0 1000 1000)
const CITY_LOCATIONS = [
    { city: "Winnipeg", x: 494, y: 857, radius: 45 },
    { city: "Vancouver", x: 294, y: 870, radius: 45 },
    { city: "Whitehorse", x: 186, y: 698, radius: 45 },
    { city: "Edmonton", x: 366, y: 818, radius: 45 },
    { city: "Toronto", x: 639, y: 929, radius: 45 },
    { city: "Québec", x: 702, y: 896, radius: 45 },
    { city: "Calgary", x: 365, y: 848, radius: 45 },
    { city: "Iqaluit", x: 724, y: 657, radius: 45 },
    { city: "Yellowknife", x: 361, y: 679, radius: 45 },
    { city: "St John’s", x: 847, y: 890, radius: 45 },
    { city: "Halifax", x: 763, y: 923, radius: 45 },
    { city: "Montréal", x: 682, y: 912, radius: 45 },
    { city: "Ottawa", x: 665, y: 914, radius: 45 },
    { city: "Fredericton", x: 739, y: 908, radius: 45 },
    { city: "Charlottetown", x: 767, y: 903, radius: 45 },
    { city: "Regina", x: 440, y: 855, radius: 45 }
];

// Lieux touristiques pour le mode Tourisme
const TOURISM_LOCATIONS = [
    { name: "Stade Olympique", province: "QC", img: "https://images.unsplash.com/photo-1608656286742-d4717d407d08?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" },
    { name: "Tour CN", province: "ON", img: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" },
    { name: "Château Frontenac", province: "QC", img: "https://images.unsplash.com/photo-1581876886788-94338f16c8e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" },
    { name: "Chutes du Niagara", province: "ON", img: "https://images.unsplash.com/photo-1533094602577-198d3beab8ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" },
    { name: "Parlement du Canada", province: "ON", img: "https://images.unsplash.com/photo-1744339700180-d3a299e2cd1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" },
    { name: "Rocheuses Canadiennes", province: "AB", img: "https://images.unsplash.com/photo-1590287935483-fd46fc34a36a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" },
    { name: "Le plus long pont au Canada", province: "PE", img: "https://images.unsplash.com/photo-1731823335460-ed92bc1a7236?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" },
    { name: "Les plus grandes marées au monde", province: ["NB", "NS"], img: "https://cdn.pixabay.com/photo/2012/08/25/19/19/hopewell-rocks-54991_1280.jpg" },
    { name: "Où produit-on le pétrole au Canada ?", province: "AB", img: "https://cdn.pixabay.com/photo/2013/01/27/00/32/abandon-76304_1280.jpg" },
    { name: "Aurores Boréales", province: ["NT", "YT", "NU"], img: "https://images.unsplash.com/photo-1648607542248-e9982737b5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" }
];

// Messages de score
const SCORE_MESSAGES = {
    perfect: "🏆 Parfait! Tu es un vrai expert du Canada!",
    excellent: "🌟 Excellent! Tu connais très bien le Canada!",
    good: "👍 Bien joué! Continue à apprendre!",
    average: "📚 Pas mal! Révise un peu plus la géographie!",
    poor: "💪 Continue à t'entraîner, tu vas y arriver!"
};
