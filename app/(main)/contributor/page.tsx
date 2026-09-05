import { getContributorWorkspace } from '@/app/actions/contributors'
import ContributorDashboard from './ContributorDashboard'

export default async function ContributorPage() {
  const workspace = await getContributorWorkspace()
  return <ContributorDashboard seasons={workspace.seasons} challenges={workspace.challenges} />
}
