import NeuralNetwork from "./NeuralNetwork.js";

export default class GeneticAlgorithm {
  constructor({ populationSize, mutationRate, selectionRatio }) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.selectionRatio = selectionRatio;
  }

  createInitialBrains() {
    return Array.from(
      { length: this.populationSize },
      () => new NeuralNetwork(7, 4, 2),
    );
  }

  evolve(creatures) {
    const sorted = [...creatures].sort((a, b) => b.fitness - a.fitness);
    const survivorsCount = Math.max(2, Math.floor(this.populationSize * this.selectionRatio));
    const parents = sorted.slice(0, survivorsCount).map((creature) => creature.brain);

    const stats = {
      best: sorted[0]?.fitness ?? 0,
      average: sorted.reduce((sum, creature) => sum + creature.fitness, 0) / sorted.length || 0,
    };

    const newBrains = [];
    const elites = Math.min(2, parents.length);
    for (let i = 0; i < elites; i += 1) {
      newBrains.push(parents[i].clone());
    }

    while (newBrains.length < this.populationSize) {
      const parentA = parents[Math.floor(Math.random() * parents.length)];
      const parentB = parents[Math.floor(Math.random() * parents.length)];
      const child = NeuralNetwork.crossover(parentA, parentB, this.mutationRate);
      newBrains.push(child);
    }

    return { brains: newBrains.slice(0, this.populationSize), stats };
  }
}
