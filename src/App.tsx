


import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Panels from './pages/Panels'
import Pipeline from './pages/Pipeline'
import Financial from './pages/Financial'
import Profile from './pages/Profile'
import Layout from './components/Layout'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
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
// Force update 2
