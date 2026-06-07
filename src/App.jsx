import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Experiences from './pages/Experiences'
import Generate from './pages/Generate'
import CompanyDetail from './pages/CompanyDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
