const GENE_DEFS = {
  visionRange: { min: 0.8, max: 1.4 },
  visionAngle: { min: 0.55, max: 1 },
  hearingRange: { min: 0.7, max: 1.3 },
  metabolism: { min: 0.65, max: 1.35 },
  endurance: { min: 0.75, max: 1.3 },
  hydration: { min: 0.75, max: 1.3 },
  camouflage: { min: 0.7, max: 1.2 },
  aggression: { min: 0.6, max: 1.35 },
  social: { min: 0, max: 1 },
  awareness: { min: 0.7, max: 1.25 },
};

export { GENE_DEFS };

export function createRandomGenome() {
  const genome = {};
  for (const [key, def] of Object.entries(GENE_DEFS)) {
    genome[key] = randomBetween(def.min, def.max);
  }
  return genome;
}

export function clampGenome(genome) {
  const next = {};
  for (const [key, def] of Object.entries(GENE_DEFS)) {
    const value = genome?.[key] ?? def.min;
    next[key] = clamp(value, def.min, def.max);
  }
  return next;
}

export function crossoverGenomes(parentA, parentB, mutationRate) {
  const baseA = clampGenome(parentA);
  const baseB = clampGenome(parentB);
  const child = {};
  for (const key of Object.keys(GENE_DEFS)) {
    const def = GENE_DEFS[key];
    const inherited = Math.random() < 0.5 ? baseA[key] : baseB[key];
    child[key] = mutateGene(inherited, def, mutationRate);
  }
  return child;
}

function mutateGene(value, def, mutationRate) {
  const shouldMutate = Math.random() < mutationRate * 0.75;
  if (!shouldMutate) {
    return clamp(value, def.min, def.max);
  }
  const swing = (def.max - def.min) * 0.2;
  const delta = (Math.random() * 2 - 1) * swing;
  return clamp(value + delta, def.min, def.max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
