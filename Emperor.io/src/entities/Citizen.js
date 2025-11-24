import { TILE_TYPES, GATHER_TIME, GATHER_YIELD } from "../utils/constants.js";
import { BUILD_RATE } from "../utils/buildingConfig.js";

// Unites de base : citoyens.
export const CitizenState = {
  IDLE: "idle",
  MOVING: "moving",
  GATHERING: "gathering",
  BUILDING: "building",
  COMBAT: "combat",
};

export default class Citizen {
  constructor(x, y) {
    this.x = x; // position en cases (grille logique, flottant pour le mouvement)
    this.y = y;
    this.speed = 6; // cases par seconde
    this.state = CitizenState.IDLE;
    this.target = null; // {x, y}
    this.intent = "idle"; // "move" | "gather" | "return" | "build"
    this.resourceType = null;
    this.gatherTimer = 0;
    this.gatherDuration = 0;
    this.carrying = null; // { type, amount }
    this.building = null;
    this.path = [];
  }

  reset() {
    this.state = CitizenState.IDLE;
    this.intent = "idle";
    this.target = null;
    this.resourceType = null;
    this.gatherTimer = 0;
    this.gatherDuration = 0;
    this.carrying = null;
    this.building = null;
    this.path = [];
  }

  // Donne un ordre au citoyen.
  issueOrder(target, intent, resourceType, building = null, path = []) {
    this.target = target;
    this.intent = intent;
    this.resourceType = resourceType || null;
    this.state = CitizenState.MOVING;
    this.carrying = null;
    this.building = building;
    this.path = path || [];
  }

  // Mise a jour du citoyen avec contexte (carte et centre-ville pour depot/chantier).
  update(dt, context) {
    const { tileMap, cityCenter, onDeposit, onBuildingComplete, onHarvest, computePath } = context;

    if (this.state === CitizenState.MOVING && this.target) {
      const arrived = this.followPath(dt) || this.moveTowardsDirect(dt);
      if (arrived) this.handleArrival(tileMap, cityCenter, onDeposit, onHarvest, computePath);
      return;
    }

    if (this.state === CitizenState.GATHERING) {
      this.gatherTimer += dt;
      if (this.gatherTimer >= this.gatherDuration) {
        // Recolte terminee : on prend la ressource et on retourne au centre-ville.
        const amount = GATHER_YIELD[this.resourceType] || 0;
        if (amount > 0) this.carrying = { type: this.resourceType, amount };
        if (onHarvest) onHarvest(this.resourceType, Math.round(this.x), Math.round(this.y));
        this.intent = "return";
        this.state = CitizenState.MOVING;
        this.target = { x: cityCenter.x, y: cityCenter.y };
        if (computePath) {
          this.path = computePath({ x: this.x, y: this.y }, this.target);
        }
      }
      return;
    }

    if (this.state === CitizenState.BUILDING) {
      if (!this.building || this.building.completed) {
        this.reset();
        return;
      }
      const newlyComplete = this.building.addProgress(dt * BUILD_RATE);
      if (newlyComplete && onBuildingComplete) {
        onBuildingComplete(this.building);
      }
      if (this.building.completed) {
        this.reset();
      }
    }
  }

  // Avance vers la cible, retourne true si arrive.
  moveTowardsDirect(dt) {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq === 0) {
      return true;
    }

    const dist = Math.sqrt(distSq);
    const maxStep = this.speed * dt;

    if (dist <= maxStep) {
      this.x = this.target.x;
      this.y = this.target.y;
      return true;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    this.x += nx * maxStep;
    this.y += ny * maxStep;
    return false;
  }

  // Logique a l'arrivee sur une case.
  handleArrival(tileMap, cityCenter, onDeposit, onHarvest, computePath) {
    // Arrive a destination pour recolte.
    if (this.intent === "gather") {
      const type = tileMap.get(Math.round(this.x), Math.round(this.y));
      if (type !== TILE_TYPES.EMPTY && type === this.resourceType) {
        // On commence a recolter.
        this.state = CitizenState.GATHERING;
        this.gatherTimer = 0;
        this.gatherDuration = GATHER_TIME[this.resourceType] || 2;
        return;
      }
    }

    if (this.intent === "return") {
      if (this.carrying && onDeposit) {
        onDeposit(this.carrying.type, this.carrying.amount);
      }
      this.reset();
      return;
    }

    if (this.intent === "build") {
      if (this.building && !this.building.completed) {
        this.state = CitizenState.BUILDING;
        return;
      }
    }

    // Sinon simple deplacement.
    this.reset();
  }

  // Suit le chemin discret (A*) s'il existe. Retourne true si la destination est atteinte.
  followPath(dt) {
    if (!this.path || this.path.length === 0) return false;
    const next = this.path[0];
    const dx = next.x - this.x;
    const dy = next.y - this.y;
    const distSq = dx * dx + dy * dy;
    const maxStep = this.speed * dt;

    if (distSq === 0 || Math.sqrt(distSq) <= maxStep) {
      this.x = next.x;
      this.y = next.y;
      this.path.shift();
      if (this.path.length === 0) return true;
      return false;
    }

    const dist = Math.sqrt(distSq);
    this.x += (dx / dist) * maxStep;
    this.y += (dy / dist) * maxStep;
    return false;
  }
}
