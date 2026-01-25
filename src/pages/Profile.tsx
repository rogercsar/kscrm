import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, ArrowLeft, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [session, setSession] = useState<any>(null)

    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) getProfile(session)
            else navigate('/')
        })
    }, [navigate])

    const getProfile = async (session: any) => {
        try {
            setLoading(true)
            const { user } = session

            const { data, error, status } = await supabase
                .from('profiles')
                .select(`full_name, avatar_url, phone, role`)
                .eq('id', user.id)
                .single()

            if (error && status !== 406) {
                throw error
            }

            if (data) {
                setFullName(data.full_name || '')
                setAvatarUrl(data.avatar_url || '')
                setPhone(data.phone || '')
                setRole(data.role || '')
            }
        } catch (error) {
            console.error('Error loading profile:', error)
            alert('Erro ao carregar perfil')
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async () => {
        try {
            setUpdating(true)
            const { user } = session

            const updates = {
                id: user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                phone: phone,
                role: role,
                updated_at: new Date(),
            }

            const { error } = await supabase.from('profiles').upsert(updates)

            if (error) {
                throw error
            }

            alert('Perfil atualizado com sucesso!')
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Erro ao atualizar perfil')
        } finally {
            setUpdating(false)
        }
    }

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem para upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
            setAvatarUrl(data.publicUrl)

        } catch (error) {
            alert('Erro ao fazer upload do avatar!')
            console.error(error)
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="min-h-screen bg-muted/40 flex flex-col items-center py-10">
            <div className="w-full max-w-md px-4">
                <Button variant="ghost" className="mb-4" onClick={() => navigate('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Meu Perfil</CardTitle>
                        <CardDescription>Gerencie suas informações pessoais</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-2xl">{fullName?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="avatar" className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                                    <Upload className="mr-2 h-4 w-4" /> Alterar Foto
                                </Label>
                                <Input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={uploadAvatar}
                                    disabled={uploading}
                                />
                            </div>
                            {uploading && <span className="text-xs text-muted-foreground animate-pulse">Enviando...</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={session.user.email} disabled />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Cargo</Label>
                            <Input
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Ex: Vendedor, Gerente"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone / WhatsApp</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={updateProfile} disabled={updating || uploading}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
