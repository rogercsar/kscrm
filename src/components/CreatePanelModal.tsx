import { useState } from 'react'
import Papa from 'papaparse'
import { Plus, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CreatePanelModalProps {
    onPanelCreated: () => void
}

export function CreatePanelModal({ onPanelCreated }: CreatePanelModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)

    const [panelName, setPanelName] = useState('')
    const [parsedData, setParsedData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [selectedColumns, setSelectedColumns] = useState<string[]>([])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length > 0) {
                    setParsedData(results.data)
                    const detectedHeaders = Object.keys(results.data[0] as object)
                    setHeaders(detectedHeaders)
                    setSelectedColumns(detectedHeaders.slice(0, 3)) // Select first 3 by default
                    setStep(2)
                }
            },
            error: (error: Error) => {
                console.error('Error parsing CSV:', error)
            }
        })
    }

    const toggleColumn = (header: string) => {
        setSelectedColumns(prev =>
            prev.includes(header)
                ? prev.filter(h => h !== header)
                : [...prev, header]
        )
    }

    const handleSave = async () => {
        if (!panelName || parsedData.length === 0) return
        setLoading(true)

        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // 2. Create Panel
            const { data: panel, error: panelError } = await supabase
                .from('panels')
                .insert({
                    user_id: user.id,
                    name: panelName
                })
                .select()
                .single()

            if (panelError) throw panelError

            // 3. Insert Leads (Batch)
            const leads = parsedData.map(row => ({
                panel_id: panel.id,
                original_data: row,
                selected_columns: selectedColumns,
                status: 'cold'
            }))

            const { error: leadsError } = await supabase
                .from('leads')
                .insert(leads)

            if (leadsError) throw leadsError

            setOpen(false)
            resetForm()
            onPanelCreated()

        } catch (error) {
            console.error('Error saving panel:', error)
            alert('Error creating panel: ' + (error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setStep(1)
        setPanelName('')
        setParsedData([])
        setHeaders([])
        setSelectedColumns([])
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Novo Painel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Criar Novo Painel</DialogTitle>
                    <DialogDescription>
                        Importe leads de um arquivo CSV para iniciar um novo pipeline.
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Painel</Label>
                            <Input
                                id="name"
                                value={panelName}
                                onChange={(e) => setPanelName(e.target.value)}
                                placeholder="ex: Leads Marketing Q1"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="csv">Upload CSV</Label>
                            <Input
                                id="csv"
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid gap-4 py-4">
                        <div className="mb-2">
                            <Label>Selecione as Colunas para Exibir</Label>
                            <p className="text-xs text-muted-foreground">
                                Escolha quais campos você deseja ver nos cartões do pipeline.
                            </p>
                        </div>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            <div className="space-y-2">
                                {headers.map((header) => (
                                    <div key={header} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={header}
                                            checked={selectedColumns.includes(header)}
                                            onCheckedChange={() => toggleColumn(header)}
                                        />
                                        <Label htmlFor={header} className="font-normal cursor-pointer">
                                            {header}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <p className="text-sm font-medium text-right">
                            {parsedData.length} leads encontrados
                        </p>
                    </div>
                )}

                <DialogFooter>
                    {step === 2 && (
                        <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                            Voltar
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={loading || !panelName || (step === 2 && selectedColumns.length === 0)}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {step === 1 ? 'Próximo' : 'Criar Painel'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
