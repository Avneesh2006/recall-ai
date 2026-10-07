"use client";

import { TaskCard } from "@/components/TaskCard";
import type { Task } from "@/types/database";

function groupTasks(tasks: Task[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: Task[] = [];
  const todayList: Task[] = [];
  const upcoming: Task[] = [];
  const noDate: Task[] = [];

  for (const task of tasks) {
    if (!task.due_date) {
      noDate.push(task);
      continue;
    }
    const due = new Date(task.due_date + "T00:00:00").getTime();
    if (due < today.getTime()) overdue.push(task);
    else if (due === today.getTime()) todayList.push(task);
    else upcoming.push(task);
  }

  return { overdue, today: todayList, upcoming, noDate };
}

function TaskGroup({
  title,
  tasks,
  referenceCounts,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  title: string;
  tasks: Task[];
  referenceCounts: Record<string, number>;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{title}</p>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            referenceCount={referenceCounts[task.id] ?? 0}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  referenceCounts,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  referenceCounts: Record<string, number>;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const groups = groupTasks(tasks);

  return (
    <div className="flex flex-col gap-6">
      <TaskGroup title="Overdue" tasks={groups.overdue} referenceCounts={referenceCounts} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} />
      <TaskGroup title="Today" tasks={groups.today} referenceCounts={referenceCounts} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} />
      <TaskGroup title="Upcoming" tasks={groups.upcoming} referenceCounts={referenceCounts} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} />
      <TaskGroup title="No date" tasks={groups.noDate} referenceCounts={referenceCounts} onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
