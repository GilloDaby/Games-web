// Projectile simple : se deplace vers la cible, applique des degats a l'impact.
export default class Projectile {
  constructor(x, y, target, damage, speed = 20, ttl = 2) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.ttl = ttl;
    this.alive = true;
  }

  update(dt, onHit) {
    if (!this.alive) return;
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.alive = false;
      return;
    }
    if (!this.target || this.target.hp <= 0) {
      this.alive = false;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.1) {
      this.hit(onHit);
      return;
    }
    const step = this.speed * dt;
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  hit(onHit) {
    if (!this.alive) return;
    this.alive = false;
    if (this.target && this.target.hp > 0) {
      this.target.hp -= this.damage;
      if (this.target.hp < 0) this.target.hp = 0;
      if (onHit) onHit(this);
    }
  }
}
