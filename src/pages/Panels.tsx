import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CreatePanelModal } from '@/components/CreatePanelModal'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Panel } from '@/types'
import { Loader2, Trash2, Download, Edit, MoreVertical } from 'lucide-react'
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
import Papa from 'papaparse'
import { Link } from 'react-router-dom'

export default function Panels() {
    const [panels, setPanels] = useState<Panel[]>([])
    const [loading, setLoading] = useState(true)

    // Management State
    const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null)
    const [manageDialogOpen, setManageDialogOpen] = useState(false)
    const [newName, setNewName] = useState('')

    useEffect(() => {
        fetchPanels()
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
            setManageDialogOpen(false)
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
            Valor: l.value || 0,
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Meus Painéis</h2>
                    <p className="text-muted-foreground">Gerencie seus funis de venda.</p>
                </div>
                <CreatePanelModal onPanelCreated={fetchPanels} />
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : panels.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                    <h3 className="text-lg font-medium">Nenhum painel criado ainda</h3>
                    <CreatePanelModal onPanelCreated={fetchPanels} />
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {panels.map((panel) => (
                        <Card key={panel.id} className="hover:shadow-md transition-shadow relative group">
                            <CardHeader className="pr-12">
                                <CardTitle className="truncate" title={panel.name}>{panel.name}</CardTitle>
                                <CardDescription>Criado em {new Date(panel.created_at).toLocaleDateString('pt-BR')}</CardDescription>

                                <div className="absolute top-2 right-2">
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
                            <CardFooter>
                                <Link to={`/pipeline/${panel.id}`} className="w-full">
                                    <Button variant="secondary" className="w-full">
                                        Abrir Pipeline
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renomear Painel</DialogTitle>
                        <DialogDescription>Digite o novo nome para o painel.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Painel</Label>
                            <div className="flex gap-2">
                                <Input value={newName} onChange={e => setNewName(e.target.value)} />
                                <Button size="icon" onClick={handleUpdateName}><Edit className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
