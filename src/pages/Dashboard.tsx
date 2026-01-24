import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CreatePanelModal } from '@/components/CreatePanelModal'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Panel } from '@/types'
import { Loader2, Kanban, Trash2, Download, Printer, Edit, MoreVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserNav } from '@/components/UserNav'
import Papa from 'papaparse'

// Authentication Component
function AuthScreen() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('login')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
        }
        setLoading(false)
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // SignUp with Metadata for Profile Trigger
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        if (error) {
            alert(error.message)
        } else {
            alert('Cadastro realizado! Verifique seu email para confirmar a conta.')
            setActiveTab('login')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">KSCRM</CardTitle>
                    <CardDescription>Gerencie seus leads com eficiência</CardDescription>
                </CardHeader>
                <div className="px-6 pb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Entrar</TabsTrigger>
                            <TabsTrigger value="register">Cadastrar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Entrar
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Seu Nome"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">Email</Label>
                                    <Input
                                        id="register-email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Senha</Label>
                                    <Input
                                        id="register-password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Conta
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </Card>
        </div>
    )
}

export default function Dashboard() {
    const [session, setSession] = useState<any>(null)
    const [panels, setPanels] = useState<Panel[]>([])
    const [loading, setLoading] = useState(true)

    // Management State
    const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null)
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [newName, setNewName] = useState('')

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) fetchPanels()
            else setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session) fetchPanels()
            else setPanels([])
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchPanels = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('panels')
            .select('*')
            .order('created_at', { ascending: false })

        setPanels(data || [])
        setLoading(false)
    }

    const handleOpenRename = (panel: Panel) => {
        setSelectedPanel(panel)
        setNewName(panel.name)
        setManageDialogOpen(true)
    }

    const handleUpdateName = async () => {
        if (!selectedPanel || !newName.trim()) return

        const { error } = await supabase
            .from('panels')
            .update({ name: newName })
            .eq('id', selectedPanel.id)

        if (error) {
            console.error('Error updating panel:', error)
            alert('Erro ao atualizar nome')
        } else {
            setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, name: newName } : p))
            setManageDialogOpen(false) // Close or keep open? Close is better UX for "Save"
        }
    }

    const handleDeletePanel = async (panel: Panel) => {
        if (!window.confirm(`ATENÇÃO: Isso excluirá o painel "${panel.name}" e TODOS os leads associados. Tem certeza?`)) return

        const { error } = await supabase
            .from('panels')
            .delete()
            .eq('id', panel.id)

        if (error) {
            console.error('Error deleting panel:', error)
            alert('Erro ao excluir painel')
        } else {
            setPanels(prev => prev.filter(p => p.id !== panel.id))
        }
    }

    const handleExportPanel = async (panel: Panel) => {
        // Fetch leads for this panel
        const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .eq('panel_id', panel.id)

        if (!leads || leads.length === 0) {
            alert('Este painel não possui leads para exportar.')
            return
        }

        const csvData = leads.map(l => ({
            ID: l.id,
            Status: l.status,
            CriadoEm: new Date(l.created_at).toLocaleString('pt-BR'),
            AgendadoPara: l.scheduled_date ? new Date(l.scheduled_date).toLocaleString('pt-BR') : '',
            FechadoEm: l.original_data.closing_date ? new Date(l.original_data.closing_date).toLocaleString('pt-BR') : '',
            Responsavel: l.original_data.responsible || '',
            ...l.original_data
        }))

        const csv = Papa.unparse(csvData)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${panel.name}_export.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrintDashboard = () => {
        window.print()
    }

    if (!session) {
        return <AuthScreen />
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b print:hidden">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-2xl font-bold flex items-center">
                        <Kanban className="mr-2" /> KSCRM
                    </h1>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handlePrintDashboard} title="Imprimir Dash">
                            <Printer className="h-5 w-5" />
                        </Button>
                        <UserNav />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container px-4 py-8 print:py-0">
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <h2 className="text-xl font-semibold">Seus Painéis</h2>
                    <CreatePanelModal onPanelCreated={fetchPanels} />
                </div>

                {/* Print Title */}
                <div className="hidden print:block mb-6">
                    <h1 className="text-2xl font-bold">Relatório de Painéis - KSCRM</h1>
                    <p className="text-gray-500">{new Date().toLocaleString()}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : panels.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                        <h3 className="text-lg font-medium">Nenhum painel criado ainda</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Crie seu primeiro painel para começar a gerenciar leads.
                        </p>
                        <CreatePanelModal onPanelCreated={fetchPanels} />
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
                        {panels.map((panel) => (
                            <Card key={panel.id} className="hover:shadow-md transition-shadow relative group break-inside-avoid print:shadow-none print:border">
                                <CardHeader className="pr-12">
                                    <CardTitle className="truncate" title={panel.name}>{panel.name}</CardTitle>
                                    <CardDescription>Criado em {new Date(panel.created_at).toLocaleDateString('pt-BR')}</CardDescription>

                                    <div className="absolute top-2 right-2 print:hidden">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenRename(panel)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Renomear
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleExportPanel(panel)}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Exportar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePanel(panel)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardFooter className="print:hidden">
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => window.location.href = `/pipeline/${panel.id}`}
                                    >
                                        Abrir Pipeline
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Manage Panel Dialog */}
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renomear Painel</DialogTitle>
                        <DialogDescription>
                            Digite o novo nome para o painel.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Painel</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                                <Button size="icon" onClick={handleUpdateName} title="Salvar Nome">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>


                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
