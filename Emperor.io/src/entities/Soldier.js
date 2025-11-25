// Unite de combat de base avec tir.
export const SoldierState = {
  IDLE: "idle",
  MOVING: "moving",
  ATTACKING: "attacking",
};

export default class Soldier {
  constructor(x, y, stats) {
    this.x = x;
    this.y = y;
    this.speed = stats?.speed ?? 8; // cases par seconde
    this.maxHp = stats?.hp ?? 50;
    this.hp = this.maxHp;
    this.attackRange = stats?.attackRange ?? 1.2; // en cases
    this.damagePerShot = stats?.damagePerShot ?? 10;
    this.fireRate = stats?.fireRate ?? 1.0; // tirs par seconde
    this.cooldown = 0;

    this.state = SoldierState.IDLE;
    this.target = null; // { x, y, hp, maxHp, radius }
    this.path = [];
    this.intent = "idle"; // "idle" | "move" | "attack"
    this.moveTarget = null;
  }

  // Ordre d'attaque : on suit la cible jusqu'a la portee.
  issueAttack(target, path = []) {
    this.target = target;
    this.path = path;
    this.state = SoldierState.MOVING;
    this.intent = "attack";
    this.moveTarget = null;
  }

  issueMove(target, path = []) {
    this.moveTarget = { x: target.x, y: target.y };
    this.target = null;
    this.path = path || [];
    this.state = SoldierState.MOVING;
    this.intent = "move";
  }

  // Mise a jour : deplacement + tir si a portee. computePathFn/emitProjectile pour recalcul/FX.
  update(dt, helpers = {}) {
    const { computePath, emitProjectile } = helpers;
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.intent === "move") {
      if (!this.moveTarget) {
        this.reset();
        return;
      }
      const eps = 0.15;
      const dist = Math.hypot(this.moveTarget.x - this.x, this.moveTarget.y - this.y);
      if (dist <= eps) {
        this.reset();
        return;
      }
      if ((!this.path || this.path.length === 0) && computePath) {
        this.path = computePath({ x: this.x, y: this.y }, this.moveTarget);
      }
      this.followPath(dt);
      return;
    }

    if (!this.target || this.target.hp <= 0) {
      this.reset();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.attackRange) {
      if (!this.path || this.path.length === 0) {
        if (computePath) {
          this.path = computePath({ x: this.x, y: this.y }, { x: this.target.x, y: this.target.y });
        }
      }
      this.followPath(dt);
      this.state = SoldierState.MOVING;
      return;
    }

    // A portee : tir si cooldown ok.
    this.state = SoldierState.ATTACKING;
    if (this.cooldown <= 0 && emitProjectile) {
      emitProjectile(this);
      this.cooldown = 1 / this.fireRate;
    }
  }

  reset() {
    this.target = null;
    this.moveTarget = null;
    this.intent = "idle";
    this.state = SoldierState.IDLE;
    this.path = [];
  }

  followPath(dt) {
    if (!this.path || this.path.length === 0) return;
    const next = this.path[0];
    const dx = next.x - this.x;
    const dy = next.y - this.y;
    const distSq = dx * dx + dy * dy;
    const maxStep = this.speed * dt;
    const arriveEps = Math.max(0.08, maxStep * 0.6);

    if (distSq === 0 || Math.sqrt(distSq) <= arriveEps) {
      this.x = next.x;
      this.y = next.y;
      this.path.shift();
      return;
    }

    const dist = Math.sqrt(distSq);
    this.x += (dx / dist) * maxStep;
    this.y += (dy / dist) * maxStep;
  }
}
