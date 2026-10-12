import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { prefetchCatalog } from './lib/api'

prefetchCatalog()

const StockCabinetry = lazy(() => import('./pages/StockCabinetry'))
const CustomCabinetry = lazy(() => import('./pages/CustomCabinetry'))
const CatalogPage = lazy(() => import('./pages/CatalogPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Schedule = lazy(() => import('./pages/Schedule'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const TextPage = lazy(() => import('./pages/TextPage'))
const Search = lazy(() => import('./pages/Search'))
const Admin = lazy(() => import('./admin/Admin'))

const Fallback = () => <div className="min-h-[60vh]" />

// [url, page key (header colour + headline), catalogue section]
const CATALOGS = [
  ['countertops', 'countertops', 'countertop'],
  ['flooring', 'flooring', 'flooring'],
  ['backsplash', 'backsplash', 'backsplash'],
]
// [url, page key, site_settings key]
const TEXT_PAGES = [
  ['terms', 'terms', 'terms'],
  ['faq', 'faq', 'faq'],
  ['shipping', 'shipping', 'shipping'],
  ['measurement-guide', 'measurement', 'measurementGuide'],
]

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
          {CATALOGS.flatMap(([url, page, section]) => [
            <Route key={url} path={url} element={<CatalogPage page={page} section={section} />} />,
            <Route key={`${url}/:id`} path={`${url}/:id`} element={<ProductPage page={page} section={section} />} />,
          ])}
          <Route path="spaces-weve-created" element={<Gallery />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          {TEXT_PAGES.map(([url, page, key]) => <Route key={url} path={url} element={<TextPage key={url} page={page} settingsKey={key} />} />)}
          <Route path="search" element={<Search />} />
          <Route path="*" element={<div className="py-32 text-center font-serif text-3xl">Page not found</div>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
