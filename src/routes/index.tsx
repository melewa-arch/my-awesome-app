import { createFileRoute } from "@tanstack/react-router";
import { TaskManager } from "@/components/TaskManager";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ember — A quiet task list" },
      { name: "description", content: "A calm, editorial task manager. Capture what matters, cross off what's done." },
      { property: "og:title", content: "Ember — A quiet task list" },
      { property: "og:description", content: "A calm, editorial task manager. Capture what matters, cross off what's done." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen">
      <TaskManager />
    </main>
  );
}
