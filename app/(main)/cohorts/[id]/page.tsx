import CohortDashboard from '@/components/cohorts/CohortDashboard'
export default function CohortDetail({ params }:{ params:{ id:string } }){ return (<div className="max-w-3xl mx-auto py-8 px-4"><CohortDashboard id={params.id} /></div>) }
