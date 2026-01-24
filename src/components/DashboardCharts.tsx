import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { Lead } from '@/types'
import { Users, CheckCircle, Calendar } from 'lucide-react'

interface DashboardChartsProps {
    leads: Lead[]
}

export function DashboardCharts({ leads }: DashboardChartsProps) {
    const stats = useMemo(() => {
        const total = leads.length
        const cold = leads.filter(l => l.status === 'cold').length
        const interested = leads.filter(l => l.status === 'interested').length
        const scheduled = leads.filter(l => l.status === 'scheduled').length
        const closed = leads.filter(l => l.status === 'closed').length
        const lost = leads.filter(l => l.status === 'lost').length

        // Conversion Rate (Closed / Total Finished (Closed + Lost))
        const finished = closed + lost
        const conversionRate = finished > 0 ? ((closed / finished) * 100).toFixed(1) : '0.0'

        return { total, cold, interested, scheduled, closed, lost, conversionRate }
    }, [leads])

    const barData = [
        { name: 'Frios', count: stats.cold, color: '#94a3b8' }, // slate-400
        { name: 'Interesse', count: stats.interested, color: '#60a5fa' }, // blue-400
        { name: 'Agendados', count: stats.scheduled, color: '#facc15' }, // yellow-400
        { name: 'Fechados', count: stats.closed, color: '#4ade80' }, // green-400
        { name: 'Perdidos', count: stats.lost, color: '#f87171' }, // red-400
    ]

    const pieData = [
        { name: 'Em Aberto', value: stats.cold + stats.interested + stats.scheduled, color: '#3b82f6' },
        { name: 'Fechados', value: stats.closed, color: '#22c55e' },
        { name: 'Perdidos', value: stats.lost, color: '#ef4444' },
    ]

    return (
        <div className="space-y-6 mb-8 print:hidden">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Em todos os painéis</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agendados</CardTitle>
                        <Calendar className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.scheduled}</div>
                        <p className="text-xs text-muted-foreground">Reuniões pendentes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas Fechadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.closed}</div>
                        <p className="text-xs text-muted-foreground">Sucesso total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                        <div className="text-xs font-bold bg-primary/10 px-2 py-0.5 rounded text-primary">%</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                        <p className="text-xs text-muted-foreground">Dos finalizados (Ganhos/Perdidos)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Bar Chart - 4 cols */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Funil de Vendas</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData}>
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
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart - 3 cols */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Visão Geral</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
