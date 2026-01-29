import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Kanban, DollarSign, User, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation()
    const pathname = location.pathname
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className={cn("pb-12 h-screen border-r bg-background hidden md:flex flex-col w-64 fixed left-0 top-0 overflow-y-auto", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        KSCRM
                    </h2>
                    <div className="space-y-1">
                        <Link to="/">
                            <Button variant={pathname === "/" ? "secondary" : "ghost"} className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link to="/panels">
                            <Button variant={pathname.startsWith("/panels") || pathname.startsWith("/pipeline") ? "secondary" : "ghost"} className="w-full justify-start">
                                <Kanban className="mr-2 h-4 w-4" />
                                Painéis
                            </Button>
                        </Link>
                        <Link to="/financial">
                            <Button variant={pathname.startsWith("/financial") ? "secondary" : "ghost"} className="w-full justify-start">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Financeiro
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="px-3 py-4 border-t">
                <div className="space-y-1">
                    <Link to="/profile">
                        <Button variant={pathname === "/profile" ? "secondary" : "ghost"} className="w-full justify-start">
                            <User className="mr-2 h-4 w-4" />
                            Perfil
                        </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </div>
        </div>
    )
}
