export class QuestManager {
  constructor(quests, onComplete) {
    this.quests = quests.map((q, idx) => ({
      ...q,
      completed: false,
      isUnlocked: typeof q.isUnlocked === 'boolean' ? q.isUnlocked : idx === 0,
    }));
    this.onComplete = onComplete;
    this.listEl = document.getElementById('quest-list');
    this.latestResources = { wood: 0, stone: 0, gold: 0 };
    this.devMode = false;
    this.onChange = null;
  }

  update(resources) {
    this.latestResources = { ...resources };
    let changed = false;
    this.quests.forEach((quest) => {
      if (quest.completed) return;
      if (!quest.isUnlocked) return;
      const meetsWood = resources.wood >= quest.wood;
      const meetsStone = resources.stone >= quest.stone;
      const meetsGold = resources.gold >= quest.gold;
      if (meetsWood && meetsStone && meetsGold) {
        quest.completed = true;
        changed = true;
        this.unlockNext(quest.id);
        if (typeof this.onComplete === 'function') {
          this.onComplete(quest);
        }
      }
    });

    if (changed) {
      this.render();
      this.triggerChange();
    } else {
      this.renderProgress(resources);
    }
  }

  render() {
    this.listEl.innerHTML = '';
    this.quests.forEach((quest) => {
      if (!quest.isUnlocked) return;
      const li = document.createElement('li');
      if (quest.completed) li.classList.add('completed');

      const goal = document.createElement('div');
      goal.className = 'goal';
      goal.textContent = quest.goal;

      const progress = document.createElement('div');
      progress.className = 'progress';
      progress.textContent = this.formatProgress(quest, this.latestResources);

      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = quest.completed ? 'Debloque' : `Unlock: ${quest.unlock}`;

      li.appendChild(goal);
      li.appendChild(progress);
      li.appendChild(badge);

       if (this.devMode) {
        const controls = document.createElement('div');
        controls.className = 'dev-quest-controls';

        const up = document.createElement('button');
        up.textContent = '↑';
        up.onclick = () => this.moveQuest(quest.id, -1);

        const down = document.createElement('button');
        down.textContent = '↓';
        down.onclick = () => this.moveQuest(quest.id, 1);

        const edit = document.createElement('button');
        edit.textContent = '✎';
        edit.onclick = () => this.editQuest(quest.id);

        const del = document.createElement('button');
        del.textContent = '🗑';
        del.onclick = () => this.deleteQuest(quest.id);

        controls.append(up, down, edit, del);
        li.appendChild(controls);
      }

      this.listEl.appendChild(li);
    });
  }

  renderProgress(resources) {
    const items = Array.from(this.listEl.querySelectorAll('li'));
    let idx = 0;
    this.quests.forEach((quest) => {
      if (!quest.isUnlocked) return;
      const li = items[idx++];
      if (!li) return;
      const progress = li.querySelector('.progress');
      if (progress) {
        progress.textContent = this.formatProgress(quest, resources);
      }
    });
  }

  formatProgress(quest, resOverride) {
    const res = resOverride;
    if (res) {
      const w = Math.min(res.wood, quest.wood);
      const s = Math.min(res.stone, quest.stone);
      const g = Math.min(res.gold, quest.gold);
      return `Bois ${w}/${quest.wood} · Pierre ${s}/${quest.stone} · Or ${g}/${quest.gold}`;
    }
    return `Bois ${quest.wood} · Pierre ${quest.stone} · Or ${quest.gold}`;
  }

  unlockNext(completedId) {
    const idx = this.quests.findIndex((q) => q.id === completedId);
    if (idx === -1) return;
    const next = this.quests[idx + 1];
    if (next) {
      next.isUnlocked = true;
    }
  }

  addQuest(quest) {
    const nextId = this.quests.length ? Math.max(...this.quests.map((q) => q.id)) + 1 : 1;
    const q = {
      id: nextId,
      goal: quest.goal || `Quest ${nextId}`,
      wood: Number(quest.wood || 0),
      stone: Number(quest.stone || 0),
      gold: Number(quest.gold || 0),
      unlock: quest.unlock || '',
      isUnlocked: true,
      completed: false,
    };
    this.quests.push(q);
    this.render();
    this.triggerChange();
  }

  moveQuest(id, dir) {
    const idx = this.quests.findIndex((q) => q.id === id);
    if (idx === -1) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= this.quests.length) return;
    const tmp = this.quests[idx];
    this.quests[idx] = this.quests[swapIdx];
    this.quests[swapIdx] = tmp;
    this.render();
    this.triggerChange();
  }

  deleteQuest(id) {
    this.quests = this.quests.filter((q) => q.id !== id);
    this.render();
    this.triggerChange();
  }

  editQuest(id) {
    const q = this.quests.find((q) => q.id === id);
    if (!q) return;
    const goal = prompt('Goal', q.goal);
    if (goal !== null) q.goal = goal;
    const wood = prompt('Wood required', q.wood);
    if (wood !== null) q.wood = Number(wood) || 0;
    const stone = prompt('Stone required', q.stone);
    if (stone !== null) q.stone = Number(stone) || 0;
    const gold = prompt('Gold required', q.gold);
    if (gold !== null) q.gold = Number(gold) || 0;
    this.render();
    this.triggerChange();
  }

  setDevMode(flag) {
    this.devMode = flag;
    this.render();
  }

  setOnChange(fn) {
    this.onChange = fn;
  }

  triggerChange() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.exportState());
    }
  }

  exportState() {
    return this.quests.map((q) => ({ ...q }));
  }

  importState(saved) {
    if (!Array.isArray(saved)) return;
    this.quests = saved.map((q, idx) => ({
      ...q,
      completed: !!q.completed,
      isUnlocked: typeof q.isUnlocked === 'boolean' ? q.isUnlocked : idx === 0,
    }));
    this.render();
    this.triggerChange();
  }
}
