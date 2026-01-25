import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Panel, Lead, LeadStatus, LeadNote } from '@/types'
import { Loader2, ArrowLeft, Calendar, CheckCircle, XCircle, Trash2, Download, Printer, Upload, Search, MessageCircle, History, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Papa from 'papaparse'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserNav } from '@/components/UserNav'
import { Textarea } from '@/components/ui/textarea'

export default function Pipeline() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [panel, setPanel] = useState<Panel | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<LeadStatus>('cold')
    const [searchQuery, setSearchQuery] = useState('')

    const [dialogOpen, setDialogOpen] = useState(false)
    const [actionType, setActionType] = useState<'schedule' | 'close' | 'lost' | 'reschedule' | null>(null)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    // Notes State
    const [notesDialogOpen, setNotesDialogOpen] = useState(false)
    const [currentNotes, setCurrentNotes] = useState<LeadNote[]>([])
    const [newNote, setNewNote] = useState('')
    const [loadingNotes, setLoadingNotes] = useState(false)

    // Form States
    const [lostReason, setLostReason] = useState('')
    const [scheduleDate, setScheduleDate] = useState('')
    const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 16)) // Default to now
    const [responsible, setResponsible] = useState('') // Default responsible
    const [dealValue, setDealValue] = useState('') // Value state

    const [allProfiles, setAllProfiles] = useState<any[]>([])

    useEffect(() => {
        if (id) {
            fetchPipelineData()
            selectAllProfiles()
        }
    }, [id])

    const selectAllProfiles = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name, email, role')
        if (data) setAllProfiles(data)
    }

    const fetchPipelineData = async () => {
        setLoading(true)
        try {
            const { data: panelData } = await supabase
                .from('panels')
                .select('*')
                .eq('id', id)
                .single()

            const { data: leadsData } = await supabase
                .from('leads')
                .select('*')
                .eq('panel_id', id)
                .order('created_at', { ascending: false }) // Newest first

            setPanel(panelData)
            setLeads(leadsData || [])
        } catch (error) {
            console.error('Error fetching pipeline:', error)
        } finally {
            setLoading(false)
        }
    }



    const handleDeletePanel = async () => {
        if (!panel) return
        if (!window.confirm('Tem certeza que deseja excluir este painel? Esta ação não pode ser desfeita.')) return

        try {
            const { error } = await supabase
                .from('panels')
                .delete()
                .eq('id', panel.id)

            if (error) throw error
            navigate('/')
        } catch (error) {
            console.error('Error deleting panel:', error)
            alert('Erro ao excluir painel')
        }
    }

    const handleExport = () => {
        if (!leads.length) return

        // Flatten data for CSV
        const csvData = leads.map(l => ({
            ID: l.id,
            Status: l.status,
            CriadoEm: new Date(l.created_at).toLocaleString('pt-BR'),
            AgendadoPara: l.scheduled_date ? new Date(l.scheduled_date).toLocaleString('pt-BR') : '',
            FechadoEm: l.original_data.closing_date ? new Date(l.original_data.closing_date).toLocaleString('pt-BR') : '',
            Responsavel: l.original_data.responsible || '',
            MotivoPerda: l.lost_reason || '',
            ...l.original_data // Include dynamic fields
        }))

        const csv = Papa.unparse(csvData)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${panel?.name || 'pipeline'}_export.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Import State
    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const [pendingImportData, setPendingImportData] = useState<any[]>([])
    const [detectedColumns, setDetectedColumns] = useState<string[]>([])
    const [selectedImportColumns, setSelectedImportColumns] = useState<string[]>([])

    const handleImportClick = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv'
        input.onchange = (e) => handleImportFile(e as any)
        input.click()
    }

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as Record<string, any>[]
                if (!rows.length) return

                // Get all unique keys from all rows (in case some rows miss keys)
                const allKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r)))).filter(k => k)

                setDetectedColumns(allKeys)
                setSelectedImportColumns(allKeys.slice(0, 4)) // Default first 4
                setPendingImportData(rows)
                setImportDialogOpen(true)
            }
        })
    }

    const confirmImport = async () => {
        if (!pendingImportData.length) return
        setLoading(true)
        setImportDialogOpen(false)

        try {
            const newLeads = pendingImportData.map(row => {
                // Filter out empty keys
                const cleanRow = Object.fromEntries(Object.entries(row).filter(([k, v]) => k && v))
                return {
                    panel_id: id,
                    original_data: cleanRow,
                    selected_columns: selectedImportColumns,
                    status: 'cold' // Default status
                }
            })

            const { error } = await supabase.from('leads').insert(newLeads)

            if (error) throw error

            alert(`${newLeads.length} leads importados com sucesso!`)
            fetchPipelineData()
        } catch (error) {
            console.error('Error importing leads:', error)
            alert('Erro ao importar leads.')
        } finally {
            setLoading(false)
            setPendingImportData([])
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const openActionDialog = (lead: Lead, type: 'schedule' | 'close' | 'lost' | 'reschedule') => {
        setSelectedLead(lead)
        setActionType(type)
        setDialogOpen(true)

        // Reset/Init forms
        setLostReason('')
        setDealValue('')
        setScheduleDate(new Date().toISOString().slice(0, 16))
        if (type === 'reschedule' && lead.scheduled_date) {
            setScheduleDate(new Date(lead.scheduled_date).toISOString().slice(0, 16))
        }
    }

    const handleActionSubmit = async () => {
        if (!selectedLead || !actionType) return

        let updates: Partial<Lead> = {}
        let newStatus: LeadStatus = selectedLead.status

        if (actionType === 'lost') {
            newStatus = 'lost'
            updates = {
                lost_reason: lostReason,
                value: dealValue ? parseFloat(dealValue) : 0
            }
        } else if (actionType === 'schedule' || actionType === 'reschedule') {
            newStatus = 'scheduled'
            updates = { scheduled_date: new Date(scheduleDate).toISOString() }
        } else if (actionType === 'close') {
            newStatus = 'closed'
            updates = {
                value: dealValue ? parseFloat(dealValue) : 0,
                original_data: {
                    ...selectedLead.original_data,
                    closing_date: closingDate,
                    responsible: responsible
                }
            }
        }

        // Optimistic update
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStatus, ...updates } : l))
        setDialogOpen(false)

        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus, ...updates })
            .eq('id', selectedLead.id)

        if (error) {
            console.error('Error updating status:', error)
            fetchPipelineData() // Revert/Refresh on error
        }
    }

    // Direct update for simple transitions (Cold -> Interested)
    const simpleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
        await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
    }

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Reset pagination when tab changes
    useEffect(() => {
        setCurrentPage(1)
    }, [activeTab])

    const handleQuickLost = async (leadId: string) => {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'lost', lost_reason: 'Desinteressado' } : l))

        const { error } = await supabase
            .from('leads')
            .update({ status: 'lost', lost_reason: 'Desinteressado' })
            .eq('id', leadId)

        if (error) {
            console.error('Error updating lead:', error)
            fetchPipelineData()
        }
    }

    const handleOpenNotes = async (lead: Lead) => {
        setSelectedLead(lead)
        setNotesDialogOpen(true)
        setLoadingNotes(true)

        const { data } = await supabase
            .from('lead_notes')
            .select('*')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: false })

        setCurrentNotes(data || [])
        setLoadingNotes(false)
    }

    const handleSaveNote = async () => {
        if (!selectedLead || !newNote.trim()) return

        const note = {
            lead_id: selectedLead.id,
            content: newNote
        }

        const { data, error } = await supabase
            .from('lead_notes')
            .insert(note)
            .select()
            .single()

        if (!error && data) {
            setCurrentNotes([data, ...currentNotes])
            setNewNote('')
        } else {
            alert('Erro ao salvar nota')
        }
    }

    // Filter and Sort leads
    let filteredLeads = leads.filter(l => l.status === activeTab)

    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase()
        filteredLeads = filteredLeads.filter(l => {
            // Search in original_data values
            const inData = Object.values(l.original_data).some(val =>
                String(val).toLowerCase().includes(lowerQuery)
            )
            return inData
        })
    }

    if (activeTab === 'scheduled') {
        filteredLeads = filteredLeads.sort((a, b) => {
            const dateA = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0
            const dateB = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0
            return dateA - dateB // Ascending (soonest first)
        })
    }

    // Pagination Logic
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)
    const paginatedLeads = filteredLeads.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )


    // Calculate totals
    const counts = {
        cold: leads.filter(l => l.status === 'cold').length,
        interested: leads.filter(l => l.status === 'interested').length,
        scheduled: leads.filter(l => l.status === 'scheduled').length,
        closed: leads.filter(l => l.status === 'closed').length,
        lost: leads.filter(l => l.status === 'lost').length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b bg-card print:hidden">
                <div className="container flex flex-col sm:flex-row min-h-16 items-center px-4 gap-4 py-2 sm:py-0">
                    <div className="flex w-full sm:w-auto items-center">
                        <Link to="/panels">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex-1 ml-2 mr-4">
                            <h1 className="text-lg font-semibold truncate leading-tight">{panel?.name}</h1>
                            <p className="text-xs text-muted-foreground">{leads.length} leads</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 w-full sm:max-w-xs relative my-2 sm:my-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar leads..."
                            className="pl-8 w-full bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 justify-end">
                        <Button variant="outline" size="sm" onClick={handleImportClick} title="Importar CSV" className="whitespace-nowrap">
                            <Upload className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Importar</span>
                            <span className="inline sm:hidden">Imp.</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport} title="Exportar CSV" className="whitespace-nowrap">
                            <Download className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Exportar</span>
                            <span className="inline sm:hidden">Exp.</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint} title="Imprimir" className="whitespace-nowrap hidden sm:flex">
                            <Printer className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Imprimir</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeletePanel} title="Excluir Painel" className="whitespace-nowrap">
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Remover</span>
                        </Button>
                        <UserNav />
                    </div>
                </div>
            </header>

            <main className="flex-1 container px-4 py-6 overflow-hidden flex flex-col print:overflow-visible print:h-auto">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeadStatus)} className="flex-1 flex flex-col print:block">
                    <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                        <TabsList className="min-w-full w-max flex h-auto p-1 print:hidden gap-1 bg-muted/50">
                            <TabsTrigger value="cold" className="flex-1 min-w-[100px] flex py-2 flex-col gap-1 items-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <span className="text-xs font-semibold">Frios</span>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{counts.cold}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="interested" className="flex-1 min-w-[100px] flex py-2 flex-col gap-1 items-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <span className="text-xs font-semibold">Interesse</span>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{counts.interested}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="scheduled" className="flex-1 min-w-[100px] flex py-2 flex-col gap-1 items-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <span className="text-xs font-semibold">Agendados</span>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{counts.scheduled}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="closed" className="flex-1 min-w-[100px] flex py-2 flex-col gap-1 items-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <span className="text-xs font-semibold">Fechados</span>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{counts.closed}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="lost" className="flex-1 min-w-[100px] flex py-2 flex-col gap-1 items-center data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <span className="text-xs font-semibold">Perdidos</span>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{counts.lost}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Print Header Visualization */}
                    <div className="hidden print:block mb-4">
                        <h2 className="text-2xl font-bold">{panel?.name} - {activeTab.toUpperCase()}</h2>
                        <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
                    </div>

                    <div className="flex-1 overflow-hidden print:overflow-visible print:h-auto">
                        <TabsContent value={activeTab} className="h-full border rounded-lg bg-muted/10 mt-0 relative print:border-none print:bg-white">
                            <ScrollArea className="h-[calc(100vh-14rem)] print:h-auto">
                                <div className="p-4 space-y-3 print:space-y-4">
                                    {paginatedLeads.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground print:text-black">
                                            Nenhum lead nesta etapa
                                        </div>
                                    ) : (
                                        paginatedLeads.map(lead => (
                                            <Card key={lead.id} className="overflow-hidden border-l-4 border-l-primary/50 print:border print:shadow-none break-inside-avoid">
                                                <CardContent className="p-4 flex flex-col gap-4">
                                                    <div className="w-full">
                                                        <div className="flex gap-2 mb-3 flex-wrap">
                                                            {lead.selected_columns.map(col => (
                                                                <div key={col} className="text-sm bg-background/50 px-2 py-1 rounded border print:bg-transparent">
                                                                    <span className="font-semibold text-muted-foreground text-xs uppercase mr-1">{col}:</span>
                                                                    <span className="break-all font-medium">{lead.original_data[col]}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 border-t pt-2">
                                                            <div className="flex items-center">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                                            </div>
                                                            {lead.scheduled_date && (
                                                                <div className="flex items-center text-blue-600 font-medium">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    Agendado: {new Date(lead.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                                </div>
                                                            )}
                                                            {lead.original_data.closing_date && (
                                                                <div className="flex items-center text-green-600 font-medium">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Fechado: {new Date(lead.original_data.closing_date).toLocaleString('pt-BR')}
                                                                </div>
                                                            )}
                                                            {(lead.status === 'closed' && lead.value) && (
                                                                <div className="flex items-center text-green-700 font-bold bg-green-50 px-2 rounded border border-green-200">
                                                                    R$ {lead.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {lead.lost_reason && (
                                                            <div className="mt-2 text-xs bg-destructive/10 text-destructive p-2 rounded print:border print:text-black">
                                                                <strong>Motivo da Perda:</strong> {lead.lost_reason}
                                                            </div>
                                                        )}
                                                        {lead.original_data.responsible && (() => {
                                                            const respProfile = allProfiles.find(p => p.id === lead.original_data.responsible)
                                                                || allProfiles.find(p => p.full_name === lead.original_data.responsible)

                                                            return (
                                                                <div className="mt-1 text-xs text-muted-foreground">
                                                                    <strong>Responsável:</strong> {respProfile ? (
                                                                        <>
                                                                            {respProfile.full_name || respProfile.email || `Usuário (${respProfile.id.slice(0, 8)})`}
                                                                            {respProfile.role && <span className="text-primary/80 ml-1">({respProfile.role})</span>}
                                                                        </>
                                                                    ) : lead.original_data.responsible}
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>

                                                    <div className="flex justify-end w-full gap-2 pt-2 print:hidden flex-wrap">
                                                        {/* WhatsApp Smart Button */}
                                                        {(() => {
                                                            const phoneKey = Object.keys(lead.original_data).find(k =>
                                                                ['tele', 'cel', 'phone', 'whatsapp', 'whats'].some(term => k.toLowerCase().includes(term))
                                                            )
                                                            const phone = phoneKey ? lead.original_data[phoneKey] : null

                                                            if (phone) {
                                                                return (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                                                        onClick={() => {
                                                                            const cleanPhone = String(phone).replace(/\D/g, '')
                                                                            window.open(`https://wa.me/55${cleanPhone}`, '_blank')
                                                                        }}
                                                                        title="Chamar no WhatsApp"
                                                                    >
                                                                        <MessageCircle className="h-4 w-4 mr-2" />
                                                                        WhatsApp
                                                                    </Button>
                                                                )
                                                            }
                                                            return null
                                                        })()}

                                                        <Button size="sm" variant="outline" onClick={() => handleOpenNotes(lead)} title="Ver Histórico">
                                                            <History className="h-4 w-4 mr-2" />
                                                            Histórico
                                                        </Button>


                                                        {activeTab === 'cold' && (
                                                            <div className="flex gap-2 flex-wrap">
                                                                <Button variant="destructive" size="sm" onClick={() => handleQuickLost(lead.id)}>
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Desinteressado
                                                                </Button>
                                                                <Button size="sm" onClick={() => simpleUpdateStatus(lead.id, 'interested')}>
                                                                    Marcar como Interessado
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {activeTab === 'interested' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openActionDialog(lead, 'schedule')}
                                                            >
                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                Agendar Reunião
                                                            </Button>
                                                        )}

                                                        {activeTab === 'scheduled' && (
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button variant="outline" size="sm" onClick={() => openActionDialog(lead, 'reschedule')}>
                                                                    Reagendar
                                                                </Button>
                                                                <Button variant="destructive" size="sm" onClick={() => openActionDialog(lead, 'lost')}>
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Perdido
                                                                </Button>
                                                                <Button size="sm" onClick={() => openActionDialog(lead, 'close')}>
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Fechar Contrato
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {activeTab === 'closed' && (
                                                            <Button variant="outline" size="sm" onClick={() => openActionDialog(lead, 'reschedule')}>
                                                                Voltar para Agendamento
                                                            </Button>
                                                        )}

                                                        {activeTab === 'lost' && (
                                                            <Button variant="outline" size="sm" onClick={() => openActionDialog(lead, 'reschedule')}>
                                                                Voltar para Agendamento
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 py-4 print:hidden">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Anterior
                                            </Button>
                                            <span className="text-sm">
                                                Página {currentPage} de {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Próximo
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Action Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="print:hidden">
                        <DialogHeader>
                            <DialogTitle>
                                {actionType === 'lost' && 'Marcar como Perdido'}
                                {(actionType === 'schedule' || actionType === 'reschedule') && 'Agendar Reunião'}
                                {actionType === 'close' && 'Fechar Contrato'}
                            </DialogTitle>
                            <DialogDescription>
                                {actionType === 'lost' && 'Por favor, informe o motivo da perda.'}
                                {(actionType === 'schedule' || actionType === 'reschedule') && 'Defina a data e hora da reunião.'}
                                {actionType === 'close' && 'Confirme os detalhes do fechamento.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            {actionType === 'lost' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Valor Perdido (R$)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={dealValue}
                                            onChange={e => setDealValue(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Motivo</Label>
                                        <Input
                                            value={lostReason}
                                            onChange={e => setLostReason(e.target.value)}
                                            placeholder="Ex: Preço alto, Sem interesse, etc."
                                        />
                                        <div className="flex gap-2 mt-2">
                                            {['Preço', 'Concorrente', 'Sem Contato', 'Timing'].map(r => (
                                                <Badge key={r} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setLostReason(r)}>
                                                    {r}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(actionType === 'schedule' || actionType === 'reschedule') && (
                                <div className="space-y-2">
                                    <Label>Data e Hora</Label>
                                    <Input
                                        type="datetime-local"
                                        value={scheduleDate}
                                        onChange={e => setScheduleDate(e.target.value)}
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        O Google Calendar será aberto para confirmação visual após salvar.
                                    </div>
                                </div>
                            )}

                            {actionType === 'close' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Valor do Contrato (R$)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={dealValue}
                                            onChange={e => setDealValue(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data do Fechamento</Label>
                                        <Input
                                            type="datetime-local"
                                            value={closingDate}
                                            onChange={e => setClosingDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Responsável</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={responsible}
                                            onChange={e => setResponsible(e.target.value)}
                                        >
                                            <option value="" disabled>Selecione um responsável</option>
                                            {allProfiles.map(profile => (
                                                <option key={profile.id} value={profile.id}>
                                                    {profile.full_name || profile.email || `Usuário (${profile.id.slice(0, 8)})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={() => {
                                handleActionSubmit()
                                if (actionType === 'schedule' || actionType === 'reschedule') {
                                    window.open('https://calendar.google.com/calendar/u/2/r/week?pli=1', '_blank')
                                }
                            }}>
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Import Column Selection Dialog */}
                <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Selecione as Colunas</DialogTitle>
                            <DialogDescription>
                                Escolha quais colunas do arquivo CSV você quer que apareçam nos cartões do painel (Ex: Nome, Telefone).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <div className="text-sm font-medium mb-2">Colunas Encontradas ({detectedColumns.length}):</div>
                            <ScrollArea className="h-[200px] border rounded p-2">
                                <div className="space-y-2">
                                    {detectedColumns.map(col => (
                                        <div key={col} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`col-${col}`}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={selectedImportColumns.includes(col)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedImportColumns([...selectedImportColumns, col])
                                                    } else {
                                                        setSelectedImportColumns(selectedImportColumns.filter(c => c !== col))
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`col-${col}`} className="text-sm cursor-pointer select-none">
                                                {col}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div className="text-xs text-muted-foreground mt-2">
                                * Todas as colunas serão salvas, mas apenas as marcadas aparecerão visíveis no card.
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={confirmImport} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Importar {pendingImportData.length} Leads
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Notes / Timeline Dialog */}
                <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
                    <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center">
                                <History className="mr-2 h-5 w-5" />
                                Histórico do Lead
                            </DialogTitle>
                            <DialogDescription>
                                {(selectedLead?.original_data?.Nome || selectedLead?.original_data?.name || 'Lead') + ' - Anotações e registros'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-2">
                            <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20">
                                {loadingNotes ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                                ) : currentNotes.length === 0 ? (
                                    <div className="text-center text-muted-foreground text-sm py-8">Nenhuma anotação ainda.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {currentNotes.map(note => (
                                            <div key={note.id} className="bg-background border rounded p-3 text-sm">
                                                <div className="mb-1 text-xs text-muted-foreground">
                                                    {new Date(note.created_at).toLocaleString('pt-BR')}
                                                </div>
                                                <div className="whitespace-pre-wrap">{note.content}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="flex gap-2 items-end">
                                <Textarea
                                    placeholder="Digite uma nova anotação..."
                                    className="min-h-[80px]"
                                    value={newNote}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
                                />
                                <Button size="icon" onClick={handleSaveNote} disabled={!newNote.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
