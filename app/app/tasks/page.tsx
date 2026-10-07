import { createClient } from "@/lib/supabase/server";
import { listTasks, getTaskReferenceCounts } from "@/lib/db/tasks";
import { listProjects } from "@/lib/db/projects";
import { TasksView } from "@/components/TasksView";

export default async function TasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tasks, referenceCounts, projects] = await Promise.all([
    listTasks(user!.id),
    getTaskReferenceCounts(user!.id),
    listProjects(user!.id),
  ]);

  return <TasksView initialTasks={tasks} referenceCounts={referenceCounts} projects={projects} />;
}
