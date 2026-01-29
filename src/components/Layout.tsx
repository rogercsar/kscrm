import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { UserNav } from './UserNav'
import { Button } from './ui/button'
import { Menu, Kanban, LayoutDashboard, DollarSign, User, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Layout() {
    const location = useLocation()
    const pathname = location.pathname
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar className="z-50" />

            {/* Main Content Area */}
            <div className="md:pl-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
                    <div className="container flex h-16 items-center justify-between py-4">
                        <div className="flex items-center gap-2">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle Menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="pr-0 flex flex-col h-full">
                                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                                    <SheetDescription className="sr-only">
                                        Menu principal para acessar as diferentes seções do CRM.
                                    </SheetDescription>
                                    <div className="px-7">
                                        <Link to="/" className="flex items-center">
                                            <span className="font-bold">KSCRM</span>
                                        </Link>
                                    </div>
                                    <div className="flex flex-col gap-4 py-4 space-y-1 flex-1">
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
                                    <div className="px-3 py-4 border-t mr-6">
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
                                </SheetContent>
                            </Sheet>
                            <span className="font-bold">KSCRM</span>
                        </div>
                        <UserNav />
                    </div>
                </header>

                {/* Desktop Header for UserNav (if not in sidebar, usually top right) */}
                {/* We can hide this header on mobile since we have the one above, or merge them. 
                    For desktop, we usually want a top bar or just put UserNav in top right absolute/fixed? 
                    Let's keep a consistent top bar for UserNav on desktop too for simplicity, or just put it in the sidebar? 
                    User requested Sidebar menu. Usually top bar is good for User Profile. 
                    Let's make a simple top bar on desktop too. 
                */}
                <header className="hidden md:flex h-16 items-center justify-between border-b px-6">
                    <div className="flex items-center font-semibold">
                        {/* Breadcrumb or Page Title could go here */}
                    </div>
                    <div className="flex items-center gap-4">
                        <UserNav />
                    </div>
                </header>

                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
