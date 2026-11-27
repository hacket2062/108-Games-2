type Task = { callback: () => void; remaining: number; started: number; timer?: ReturnType<typeof setTimeout> };

/** Owns all delayed gameplay actions, including pause/resume and disposal. */
export class SessionScheduler {
  private tasks = new Map<number, Task>();
  private sequence = 0;
  private paused = false;
  private active = true;

  constructor(private now: () => number = () => performance.now()) {}

  schedule = (callback: () => void, delay: number): number => {
    if (!this.active) return -1;
    const id = ++this.sequence;
    const task = { callback, remaining: Math.max(0, delay), started: this.now() };
    this.tasks.set(id, task);
    if (!this.paused) this.arm(id, task);
    return id;
  };

  private arm(id: number, task: Task) {
    task.started = this.now();
    task.timer = setTimeout(() => {
      if (!this.active || this.paused || !this.tasks.has(id)) return;
      this.tasks.delete(id);
      task.callback();
    }, task.remaining);
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    for (const [id, task] of this.tasks) {
      if (paused) {
        if (task.timer !== undefined) clearTimeout(task.timer);
        task.remaining = Math.max(0, task.remaining - (this.now() - task.started));
      } else this.arm(id, task);
    }
  }

  cancelAll = () => {
    for (const task of this.tasks.values()) if (task.timer !== undefined) clearTimeout(task.timer);
    this.tasks.clear();
  };

  activate() { this.active = true; }
  dispose() { this.active = false; this.cancelAll(); }
}
