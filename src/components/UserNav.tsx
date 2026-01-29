import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { User } from "lucide-react"

export function UserNav() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; email: string | null } | null>(null)

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', session.user.id)
            .single()

        setProfile({
            full_name: data?.full_name || session.user.user_metadata?.full_name,
            avatar_url: data?.avatar_url || session.user.user_metadata?.avatar_url,
            email: session.user.email || ''
        })
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/login') // Redirect to login page
    }

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : profile?.email?.slice(0, 2).toUpperCase() || 'U'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 rounded-full px-2 flex items-center gap-2 w-auto">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline-block max-w-[150px] truncate">
                        {profile?.full_name || 'Usuário'}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || 'Usuário'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {profile?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
