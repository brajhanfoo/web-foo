import TeamTasksClientPage from './team-tasks-client'

type PageProps = {
  params: Promise<{ teamId: string }>
  searchParams: Promise<{ milestone_id?: string }>
}

export default async function DocenteTeamTasksPage({
  params,
  searchParams,
}: PageProps) {
  const { teamId } = await params
  const { milestone_id } = await searchParams

  return (
    <TeamTasksClientPage
      teamId={teamId}
      initialMilestoneId={milestone_id ?? null}
    />
  )
}
