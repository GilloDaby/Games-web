export default class HealthPickup {
  constructor({ x, y, radius = 14, healMultiplier = 1 }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.healMultiplier = healMultiplier;
    this.collected = false;
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(deltaSeconds) {
    this.pulse += deltaSeconds * 2.8;
  }

  collect(creature) {
    if (this.collected) {
      return;
    }
    this.collected = true;
    if (!creature) {
      return;
    }
    creature.hp = creature.maxHp;
    creature.energy = creature.energyMax;
    creature.hydration = creature.hydrationMax;
  }

  draw(ctx) {
    if (this.collected) {
      return;
    }
    ctx.save();
    const alpha = 0.45 + Math.sin(this.pulse) * 0.2;
    const glow = 6 + Math.sin(this.pulse * 1.4) * 2;

    ctx.fillStyle = `rgba(255, 240, 140, ${alpha * 0.8})`;
    ctx.shadowColor = "rgba(255, 230, 120, 0.75)";
    ctx.shadowBlur = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 215, 80, 0.9)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x - this.radius * 0.5, this.y);
    ctx.lineTo(this.x + this.radius * 0.5, this.y);
    ctx.moveTo(this.x, this.y - this.radius * 0.5);
    ctx.lineTo(this.x, this.y + this.radius * 0.5);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.stroke();

    ctx.restore();
  }
}
