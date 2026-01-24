import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Profile from './pages/Profile'
import { Footer } from './components/Footer'

function App() {
    return (
        <BrowserRouter>
            <div className="flex flex-col min-h-screen">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pipeline/:id" element={<Pipeline />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
                <Footer />
            </div>
        </BrowserRouter>
    )
}

export default App
// Force update 2
