import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Circle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "low" | "med" | "high";
type Filter = "all" | "active" | "done";

interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  createdAt: number;
}

const STORAGE_KEY = "ember.tasks.v1";

const priorityMeta: Record<Priority, { label: string; dot: string; ring: string }> = {
  low: { label: "low", dot: "bg-muted-foreground/40", ring: "ring-muted-foreground/20" },
  med: { label: "med", dot: "bg-accent", ring: "ring-accent/40" },
  high: { label: "high", dot: "bg-primary", ring: "ring-primary/40" },
};

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as Task[];
  } catch {
    return seed();
  }
}

function seed(): Task[] {
  const now = Date.now();
  return [
    { id: "1", title: "Sketch the morning ritual", done: false, priority: "high", createdAt: now },
    { id: "2", title: "Read ten pages, slowly", done: false, priority: "med", createdAt: now - 1 },
    { id: "3", title: "Write one honest sentence", done: true, priority: "low", createdAt: now - 2 },
  ];
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [filter, setFilter] = useState<Filter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, mounted]);

  const filtered = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const order = { high: 0, med: 1, low: 2 } as const;
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return b.createdAt - a.createdAt;
    });
    if (filter === "active") return sorted.filter((t) => !t.done);
    if (filter === "done") return sorted.filter((t) => t.done);
    return sorted;
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    return { done, total: tasks.length, active: tasks.length - done };
  }, [tasks]);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;
    setTasks((prev) => [
      { id: crypto.randomUUID(), title, done: false, priority, createdAt: Date.now() },
      ...prev,
    ]);
    setInput("");
  }

  function toggle(id: string) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function remove(id: string) {
    setTasks((p) => p.filter((t) => t.id !== id));
  }

  function clearDone() {
    setTasks((p) => p.filter((t) => !t.done));
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>Vol. 01 — Today</span>
        </div>
        <h1 className="mt-4 font-display text-6xl font-light leading-[0.95] text-ink md:text-7xl">
          A quiet list
          <br />
          <em className="font-normal italic text-primary">of intentions.</em>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Capture what matters. Cross off what's done. Nothing more, nothing louder.
        </p>
      </motion.header>

      {/* Composer */}
      <motion.form
        onSubmit={addTask}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="group relative mb-8 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-paper)] focus-within:border-primary/40 focus-within:shadow-[var(--shadow-soft)] transition-all"
      >
        <div className="flex shrink-0 items-center gap-1 px-2">
          {(Object.keys(priorityMeta) as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              aria-label={`Priority ${p}`}
              className={cn(
                "h-6 w-6 rounded-full ring-2 ring-transparent transition-all",
                priorityMeta[p].dot,
                priority === p && `ring-offset-2 ring-offset-card ${priorityMeta[p].ring}`,
                priority === p ? "scale-110" : "opacity-50 hover:opacity-100"
              )}
            />
          ))}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What deserves your attention?"
          className="flex-1 bg-transparent px-2 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-all hover:bg-primary disabled:opacity-30 disabled:hover:bg-ink"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </motion.form>

      {/* Filter bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
          {(["all", "active", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-all",
                filter === f
                  ? "bg-ink text-paper"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {stats.done}/{stats.total} done
        </div>
      </div>

      {/* List */}
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.map((task) => (
            <motion.li
              key={task.id}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "group flex items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-4 shadow-[var(--shadow-paper)] transition-all hover:border-primary/30",
                task.done && "bg-paper-deep/50"
              )}
            >
              <button
                onClick={() => toggle(task.id)}
                className={cn(
                  "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  task.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
                aria-label="Toggle task"
              >
                <AnimatePresence>
                  {task.done && (
                    <motion.span
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <div className="flex flex-1 items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    priorityMeta[task.priority].dot
                  )}
                />
                <span
                  className={cn(
                    "flex-1 truncate text-base transition-all",
                    task.done && "text-muted-foreground line-through decoration-primary/60"
                  )}
                >
                  {task.title}
                </span>
              </div>

              <button
                onClick={() => remove(task.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.li
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center"
          >
            <Circle className="h-6 w-6 text-muted-foreground/40" />
            <p className="font-display text-xl italic text-muted-foreground">
              {filter === "done" ? "Nothing finished yet." : filter === "active" ? "All clear. Breathe." : "Your page is blank."}
            </p>
          </motion.li>
        )}
      </ul>

      {stats.done > 0 && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={clearDone}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear completed →
          </button>
        </div>
      )}

      <footer className="mt-20 border-t border-border/60 pt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Saved locally · Made with care
      </footer>
    </div>
  );
}
