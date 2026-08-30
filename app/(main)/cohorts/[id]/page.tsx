import CohortDashboard from '@/components/cohorts/CohortDashboard'
export default async function CohortDetail({ params }:{ params: Promise<{ id:string }> }){ const { id } = await params; return (<div className="max-w-3xl mx-auto py-8 px-4"><CohortDashboard id={id} /></div>) }
