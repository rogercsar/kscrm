import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardCharts } from '@/components/DashboardCharts'
import { Loader2 } from 'lucide-react'

// Dashboard is now purely Analytics
export default function Dashboard() {
    const [allLeads, setAllLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        setLoading(true)
        const { data: leadsData } = await supabase
            .from('leads')
            .select('*')

        setAllLeads(leadsData || [])
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Visão geral e métricas do KSCRM.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : allLeads.length > 0 ? (
                <DashboardCharts leads={allLeads} />
            ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                    <h3 className="text-lg font-medium">Sem dados suficientes</h3>
                    <p className="text-sm text-muted-foreground">Comece a adicionar leads nos painéis para ver as métricas.</p>
                </div>
            )}
        </div>
    )
}
