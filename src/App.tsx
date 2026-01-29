


import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Dashboard from './pages/Dashboard'
import Panels from './pages/Panels'
import Pipeline from './pages/Pipeline'
import Financial from './pages/Financial'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Layout from './components/Layout'
import { Loader2 } from 'lucide-react'

function RequireAuth({ children }: { children: JSX.Element }) {
    const [session, setSession] = useState<boolean | null>(null)
    const location = useLocation()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(!!session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(!!session)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (session === null) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    element={
                        <RequireAuth>
                            <Layout />
                        </RequireAuth>
                    }
                >
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/panels" element={<Panels />} />
                    <Route path="/financial" element={<Financial />} />
                    <Route path="/pipeline/:id" element={<Pipeline />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
