import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/projects";
import { listSavedItemsByProject } from "@/lib/db/saved-items";
import { listTasksByProject, getTaskReferenceCounts } from "@/lib/db/tasks";
import { ProjectDetailView } from "@/components/ProjectDetailView";
import { notFound } from "next/navigation";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const project = await getProject(params.id);
  if (!project) notFound();

  const [items, tasks, taskReferenceCounts] = await Promise.all([
    listSavedItemsByProject(user!.id, params.id),
    listTasksByProject(user!.id, params.id),
    getTaskReferenceCounts(user!.id),
  ]);

  return (
    <ProjectDetailView
      project={project}
      initialItems={items}
      initialTasks={tasks}
      taskReferenceCounts={taskReferenceCounts}
    />
  );
}
