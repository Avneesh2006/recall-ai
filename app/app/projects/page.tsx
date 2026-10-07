import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/db/projects";
import { getProjectItemCounts } from "@/lib/db/saved-items";
import { getProjectTaskCounts } from "@/lib/db/tasks";
import { ProjectsView } from "@/components/ProjectsView";

export default async function ProjectsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [projects, itemCounts, taskCounts] = await Promise.all([
    listProjects(user!.id),
    getProjectItemCounts(user!.id),
    getProjectTaskCounts(user!.id),
  ]);

  return <ProjectsView initialProjects={projects} itemCounts={itemCounts} taskCounts={taskCounts} />;
}
