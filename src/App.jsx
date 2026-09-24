import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { prefetchCatalog } from './lib/api'

prefetchCatalog()

const StockCabinetry = lazy(() => import('./pages/StockCabinetry'))
const CustomCabinetry = lazy(() => import('./pages/CustomCabinetry'))
const Countertops = lazy(() => import('./pages/Countertops'))
const Flooring = lazy(() => import('./pages/Flooring'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Schedule = lazy(() => import('./pages/Schedule'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Terms = lazy(() => import('./pages/Terms'))
const Admin = lazy(() => import('./admin/Admin'))

const Fallback = () => <div className="min-h-[60vh]" />

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="stock-cabinetry" element={<StockCabinetry />} />
          <Route path="stock-cabinetry/:id" element={<StockCabinetry />} />
          <Route path="custom-cabinetry" element={<CustomCabinetry />} />
          <Route path="countertops" element={<Countertops />} />
          <Route path="flooring" element={<Flooring />} />
          <Route path="spaces-weve-created" element={<Gallery />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<div className="py-32 text-center font-serif text-3xl">Page not found</div>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
