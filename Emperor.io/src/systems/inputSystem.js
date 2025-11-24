// Gere les interactions (clic + clavier + drag selection) pour les ordres du joueur.
export default class InputSystem {
  constructor(canvas, { onClick, onKey, onDragStart, onDragUpdate, onDragEnd, onWheel, onPanInput, onMove }) {
    this.canvas = canvas;
    this.onClick = onClick;
    this.onKey = onKey;
    this.onDragStart = onDragStart;
    this.onDragUpdate = onDragUpdate;
    this.onDragEnd = onDragEnd;
    this.onWheel = onWheel;
    this.onPanInput = onPanInput;
    this.onMove = onMove;

    this.dragging = false;
    this.dragStart = null;
    this.dragCurrent = null;
    this.dragThreshold = 5; // pixels

    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundWheel = this.handleWheel.bind(this);

    this.canvas.addEventListener("mousedown", this.boundMouseDown);
    this.canvas.addEventListener("mousemove", this.boundMouseMove);
    this.canvas.addEventListener("wheel", this.boundWheel, { passive: true });
    window.addEventListener("mouseup", this.boundMouseUp);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  dispose() {
    this.canvas.removeEventListener("mousedown", this.boundMouseDown);
    this.canvas.removeEventListener("mousemove", this.boundMouseMove);
    this.canvas.removeEventListener("wheel", this.boundWheel);
    window.removeEventListener("mouseup", this.boundMouseUp);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
  }

  handleMouseDown(event) {
    if (event.button !== 0) return; // uniquement clic gauche pour selection/ordre
    const pos = this.toCanvasPos(event);
    this.dragStart = pos;
    this.dragCurrent = pos;
  }

  handleMouseMove(event) {
    const pos = this.toCanvasPos(event);
    if (this.onMove) this.onMove(pos);

    if (!this.dragStart) return;
    this.dragCurrent = pos;
    const dist = Math.hypot(pos.x - this.dragStart.x, pos.y - this.dragStart.y);
    if (!this.dragging && dist > this.dragThreshold) {
      this.dragging = true;
      if (this.onDragStart) this.onDragStart(this.dragStart);
    }
    if (this.dragging && this.onDragUpdate) {
      this.onDragUpdate(this.dragStart, this.dragCurrent);
    }
  }

  handleMouseUp(event) {
    if (event.button !== 0) return;
    const pos = this.toCanvasPos(event);
    const wasDragging = this.dragging;
    const start = this.dragStart;
    const current = this.dragCurrent;
    this.dragStart = null;
    this.dragCurrent = null;
    this.dragging = false;

    if (wasDragging) {
      if (this.onDragEnd && start && current) this.onDragEnd(start, current);
      return;
    }

    // Clic simple
    if (this.onClick) this.onClick(pos.x, pos.y);
  }

  handleKeyDown(event) {
    if (this.onKey) this.onKey(event);
    if (!this.onPanInput) return;
    const key = event.key.toLowerCase();
    if (key === "w" || key === "arrowup") this.onPanInput({ up: true });
    if (key === "s" || key === "arrowdown") this.onPanInput({ down: true });
    if (key === "a" || key === "arrowleft") this.onPanInput({ left: true });
    if (key === "d" || key === "arrowright") this.onPanInput({ right: true });
  }

  handleKeyUp(event) {
    if (!this.onPanInput) return;
    const key = event.key.toLowerCase();
    if (key === "w" || key === "arrowup") this.onPanInput({ up: false });
    if (key === "s" || key === "arrowdown") this.onPanInput({ down: false });
    if (key === "a" || key === "arrowleft") this.onPanInput({ left: false });
    if (key === "d" || key === "arrowright") this.onPanInput({ right: false });
  }

  handleWheel(event) {
    if (this.onWheel) this.onWheel(event.deltaY);
  }

  toCanvasPos(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
