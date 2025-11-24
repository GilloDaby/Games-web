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
  }

  // Ordre d'attaque : on suit la cible jusqu'a la portee.
  issueAttack(target, path = []) {
    this.target = target;
    this.path = path;
    this.state = SoldierState.MOVING;
  }

  // Mise a jour : deplacement + tir si a portee. computePathFn/emitProjectile pour recalcul/FX.
  update(dt, helpers = {}) {
    const { computePath, emitProjectile } = helpers;
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (!this.target || this.target.hp <= 0) {
      this.target = null;
      this.state = SoldierState.IDLE;
      this.path = [];
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

  followPath(dt) {
    if (!this.path || this.path.length === 0) return;
    const next = this.path[0];
    const dx = next.x - this.x;
    const dy = next.y - this.y;
    const distSq = dx * dx + dy * dy;
    const maxStep = this.speed * dt;

    if (distSq === 0 || Math.sqrt(distSq) <= maxStep) {
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
