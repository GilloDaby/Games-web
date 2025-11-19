import NeuralNetwork, { BRAIN_LAYOUT } from "./NeuralNetwork.js";

export default class GeneticAlgorithm {
  constructor({ populationSize, mutationRate, selectionRatio }) {
    this.populationSize = populationSize;
    this.baseMutationRate = mutationRate;
    this.dynamicMutationRate = mutationRate;
    this.selectionRatio = selectionRatio;
    this.maxMutationRate = Math.min(0.5, mutationRate * 4);
  }

  createInitialBrains() {
    return Array.from(
      { length: this.populationSize },
      () => new NeuralNetwork(BRAIN_LAYOUT.inputs, BRAIN_LAYOUT.hidden, BRAIN_LAYOUT.outputs),
    );
  }

  setMutationPressure(stagnationSteps) {
    const extra = stagnationSteps * 0.01;
    this.dynamicMutationRate = Math.min(this.maxMutationRate, this.baseMutationRate + extra);
  }

  evolve(creatures) {
    const mutationRate = this.dynamicMutationRate ?? this.baseMutationRate;
    const sorted = [...creatures].sort((a, b) => b.fitness - a.fitness);
    const survivorsCount = Math.max(2, Math.floor(this.populationSize * this.selectionRatio));
    const parents = sorted.slice(0, survivorsCount).map((creature) => ({
      brain: creature.brain,
      fitness: Math.max(0.001, creature.fitness),
    }));

    const stats = {
      best: sorted[0]?.fitness ?? 0,
      average: sorted.reduce((sum, creature) => sum + creature.fitness, 0) / sorted.length || 0,
    };

    const totalFitness = parents.reduce((sum, parent) => sum + parent.fitness, 0) || parents.length;

    const newBrains = [];
    const elites = Math.min(2, parents.length);
    for (let i = 0; i < elites; i += 1) {
      newBrains.push(parents[i].brain.clone());
    }

    while (newBrains.length < this.populationSize) {
      const parentA = this.pickParent(parents, totalFitness);
      const parentB = this.pickParent(parents, totalFitness);
      const child = NeuralNetwork.crossover(parentA.brain, parentB.brain, mutationRate);
      newBrains.push(child);
    }

    return { brains: newBrains.slice(0, this.populationSize), stats };
  }

  pickParent(parents, totalFitness) {
    if (!parents.length) {
      throw new Error("Unable to pick parent from empty pool");
    }
    const target = Math.random() * totalFitness;
    let cumulative = 0;
    for (const parent of parents) {
      cumulative += parent.fitness;
      if (target <= cumulative) {
        return parent;
      }
    }
    return parents[parents.length - 1];
  }
}
