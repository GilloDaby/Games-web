(() => {
  const BIOMES = {
    FOREST: "forest",
    PLAINS: "plains",
    DESERT: "desert",
    SNOW: "snow",
  };

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function generateValueNoise1D(length, gradientSpacing = 24) {
    const gradients = [];
    for (let i = 0; i <= Math.ceil(length / gradientSpacing) + 1; i++) {
      gradients.push(Math.random());
    }

    const values = new Array(length).fill(0);
    for (let x = 0; x < length; x++) {
      const gIndex = Math.floor(x / gradientSpacing);
      const localT = (x % gradientSpacing) / gradientSpacing;
      const g0 = gradients[gIndex];
      const g1 = gradients[gIndex + 1];
      values[x] = lerp(g0, g1, localT);
    }
    return values;
  }

  function pickBiome(noiseVal) {
    if (noiseVal < 0.25) return BIOMES.SNOW;
    if (noiseVal < 0.5) return BIOMES.PLAINS;
    if (noiseVal < 0.75) return BIOMES.FOREST;
    return BIOMES.DESERT;
  }

  function generateBiomeMap(width) {
    const noise = generateValueNoise1D(width, 32);
    return noise.map((v) => pickBiome(v));
  }

  function generateHeightMap(width, biomeMap, base = 20, amplitude = 4) {
    const noise = generateValueNoise1D(width, 16);
    return biomeMap.map((biome, x) => {
      const n = noise[x] * 2 - 1; // -1..1
      let amp = amplitude;
      if (biome === BIOMES.DESERT) amp = amplitude * 0.4;
      if (biome === BIOMES.FOREST) amp = amplitude * 1.1;
      if (biome === BIOMES.SNOW) amp = amplitude * 0.7;
      const offset = Math.round(n * amp);
      return Math.max(5, base + offset);
    });
  }

  window.BIOMES = BIOMES;
  window.generateBiomeMap = generateBiomeMap;
  window.generateHeightMap = generateHeightMap;
})();
