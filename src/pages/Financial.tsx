import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Loader2, DollarSign, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'


export default function Financial() {
    const [loading, setLoading] = useState(true)
    const [monthlyData, setMonthlyData] = useState<any[]>([]) // For Chart
    const [panelsFinancials, setPanelsFinancials] = useState<any[]>([]) // Per Panel
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [totalLost, setTotalLost] = useState(0)

    useEffect(() => {
        fetchFinancialData()
    }, [])

    const fetchFinancialData = async () => {
        setLoading(true)

        // 1. Fetch Panels
        const { data: panels } = await supabase.from('panels').select('*')

        // 2. Fetch Closed and Lost Leads
        const { data: allLeads } = await supabase
            .from('leads')
            .select('*')
            .in('status', ['closed', 'lost'])

        if (!panels || !allLeads) {
            setLoading(false)
            return
        }

        const closedLeads = allLeads.filter(l => l.status === 'closed')
        const lostLeads = allLeads.filter(l => l.status === 'lost')

        // Calculate Total Revenue
        const total = closedLeads.reduce((acc, lead) => acc + (lead.value || 0), 0)
        setTotalRevenue(total)

        // Calculate Total Lost
        const lost = lostLeads.reduce((acc, lead) => acc + (lead.value || 0), 0)
        setTotalLost(lost)

        // Calculate Revenue Per Panel
        const panelStats = panels.map(panel => {
            const panelClosed = closedLeads.filter(l => l.panel_id === panel.id)
            const panelLost = lostLeads.filter(l => l.panel_id === panel.id)

            const revenue = panelClosed.reduce((acc, lead) => acc + (lead.value || 0), 0)
            const lostRevenue = panelLost.reduce((acc, lead) => acc + (lead.value || 0), 0)

            return {
                ...panel,
                revenue,
                lostRevenue,
                closedCount: panelClosed.length,
                lostCount: panelLost.length
            }
        }).sort((a, b) => b.revenue - a.revenue) // Sort by highest revenue
        setPanelsFinancials(panelStats)

        // Calculate Monthly Data for Current Year
        const currentYear = new Date().getFullYear()
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(0, i)
            return d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()
        }) // JAN, FEV...

        const chartData = months.map((monthName, index) => {
            const monthLeads = closedLeads.filter(l => {
                if (!l.original_data.closing_date) return false // Use closing_date if available? Or created_at? 
                // Let's use created_at as fallback if closing_date is missing, but ideally closing_date
                // Assuming closing_date is stored in original_data when 'closed'
                const dateStr = l.original_data.closing_date || l.updated_at // Fallback to updated_at which is roughly close time
                const date = new Date(dateStr)
                return date.getMonth() === index && date.getFullYear() === currentYear
            })

            const total = monthLeads.reduce((acc, l) => acc + (l.value || 0), 0)
            return { name: monthName, total }
        })
        setMonthlyData(chartData)

        setLoading(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
                <p className="text-muted-foreground">Acompanhe o faturamento dos seus painéis.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                                <p className="text-xs text-muted-foreground">Valor total em vendas fechadas</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Perdido</CardTitle>
                                <DollarSign className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">{formatCurrency(totalLost)}</div>
                                <p className="text-xs text-muted-foreground">Valor total em leads perdidos</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {panelsFinancials.reduce((acc, p) => acc + p.closedCount, 0) > 0
                                        ? formatCurrency(totalRevenue / panelsFinancials.reduce((acc, p) => acc + p.closedCount, 0))
                                        : formatCurrency(0)}
                                </div>
                                <p className="text-xs text-muted-foreground">Média por venda</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Receita Mensal ({new Date().getFullYear()})</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Panel Breakdown */}
                    <h3 className="text-xl font-semibold mt-6">Detalhamento por Painel</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {panelsFinancials.map(panel => (
                            <Card key={panel.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle>{panel.name}</CardTitle>
                                    <CardDescription>
                                        {panel.closedCount} vendas | <span className="text-red-500">{panel.lostCount} perdidos</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{formatCurrency(panel.revenue)}</div>
                                    {panel.lostRevenue > 0 && (
                                        <div className="text-sm font-medium text-destructive mt-1 flex justify-between">
                                            <span>Perdido:</span>
                                            <span>{formatCurrency(panel.lostRevenue)}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
