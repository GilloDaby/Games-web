export const BRAIN_LAYOUT = {
  inputs: 30,
  hidden: 10,
  outputs: 6,
};

export default class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    this.hiddenWeights = Array.from({ length: hiddenSize }, () =>
      Array.from({ length: inputSize }, NeuralNetwork.randomWeight),
    );
    this.hiddenBiases = Array.from({ length: hiddenSize }, NeuralNetwork.randomWeight);

    this.outputWeights = Array.from({ length: outputSize }, () =>
      Array.from({ length: hiddenSize }, NeuralNetwork.randomWeight),
    );
    this.outputBiases = Array.from({ length: outputSize }, NeuralNetwork.randomWeight);
  }

  static randomWeight() {
    return Math.random() * 2 - 1;
  }

  clone() {
    const clone = new NeuralNetwork(this.inputSize, this.hiddenSize, this.outputSize);
    clone.hiddenWeights = NeuralNetwork.deepCopyMatrix(this.hiddenWeights);
    clone.hiddenBiases = [...this.hiddenBiases];
    clone.outputWeights = NeuralNetwork.deepCopyMatrix(this.outputWeights);
    clone.outputBiases = [...this.outputBiases];
    return clone;
  }

  feedforward(inputs) {
    if (inputs.length !== this.inputSize) {
      throw new Error(`Invalid input length: expected ${this.inputSize}, got ${inputs.length}`);
    }

    const hiddenLayer = new Array(this.hiddenSize);
    for (let i = 0; i < this.hiddenSize; i += 1) {
      let sum = this.hiddenBiases[i];
      for (let j = 0; j < this.inputSize; j += 1) {
        sum += this.hiddenWeights[i][j] * inputs[j];
      }
      hiddenLayer[i] = Math.tanh(sum);
    }

    const outputs = new Array(this.outputSize);
    for (let k = 0; k < this.outputSize; k += 1) {
      let sum = this.outputBiases[k];
      for (let j = 0; j < this.hiddenSize; j += 1) {
        sum += this.outputWeights[k][j] * hiddenLayer[j];
      }
      outputs[k] = Math.tanh(sum);
    }

    return outputs;
  }

  toJSON() {
    return {
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      hiddenWeights: NeuralNetwork.deepCopyMatrix(this.hiddenWeights),
      hiddenBiases: [...this.hiddenBiases],
      outputWeights: NeuralNetwork.deepCopyMatrix(this.outputWeights),
      outputBiases: [...this.outputBiases],
    };
  }

  static fromJSON(data) {
    if (!data) {
      throw new Error("Invalid neural network payload");
    }
    const expectedInput = BRAIN_LAYOUT.inputs;
    const expectedHidden = BRAIN_LAYOUT.hidden;
    const expectedOutput = BRAIN_LAYOUT.outputs;

    const layoutMatches =
      data.inputSize === expectedInput &&
      data.hiddenSize === expectedHidden &&
      data.outputSize === expectedOutput;

    const network = new NeuralNetwork(expectedInput, expectedHidden, expectedOutput);

    if (layoutMatches) {
      network.hiddenWeights = NeuralNetwork.deepCopyMatrix(data.hiddenWeights || []);
      network.hiddenBiases = [...(data.hiddenBiases || [])];
      network.outputWeights = NeuralNetwork.deepCopyMatrix(data.outputWeights || []);
      network.outputBiases = [...(data.outputBiases || [])];
    }

    return network;
  }

  static crossover(parentA, parentB, mutationRate) {
    const child = new NeuralNetwork(parentA.inputSize, parentA.hiddenSize, parentA.outputSize);

    child.hiddenWeights = parentA.hiddenWeights.map((row, i) =>
      row.map((value, j) => {
        const inherited = NeuralNetwork.mix(value, parentB.hiddenWeights[i][j]);
        return NeuralNetwork.mutate(inherited, mutationRate);
      }),
    );
    child.hiddenBiases = parentA.hiddenBiases.map((value, i) =>
      NeuralNetwork.mutate(NeuralNetwork.mix(value, parentB.hiddenBiases[i]), mutationRate),
    );

    child.outputWeights = parentA.outputWeights.map((row, i) =>
      row.map((value, j) => {
        const inherited = NeuralNetwork.mix(value, parentB.outputWeights[i][j]);
        return NeuralNetwork.mutate(inherited, mutationRate);
      }),
    );
    child.outputBiases = parentA.outputBiases.map((value, i) =>
      NeuralNetwork.mutate(NeuralNetwork.mix(value, parentB.outputBiases[i]), mutationRate),
    );

    return child;
  }

  static mix(valueA, valueB) {
    return Math.random() < 0.5 ? valueA : valueB;
  }

  static mutate(value, mutationRate) {
    if (Math.random() < mutationRate) {
      return value + (Math.random() * 2 - 1) * 0.5;
    }
    return value;
  }

  static deepCopyMatrix(matrix) {
    return (matrix || []).map((row) => [...row]);
  }
}
