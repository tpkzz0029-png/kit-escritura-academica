import { Navigate, Route, Routes } from 'react-router'
import Home from './pages/Home'
import GeologiaPage from './pages/GeologiaPage'
import RocasIgneasPage from './pages/RocasIgneasPage'
import RocasSedimentariasPage from './pages/RocasSedimentariasPage'
import RocasMetamorficasPage from './pages/RocasMetamorficasPage'
import MineralesPage from './pages/MineralesPage'

// Solo Geología está visible en la web. Las páginas de conversor, detector
// y plagio se conservan en el proyecto (src/pages/) para poder reactivarlas,
// pero sus rutas no se registran: cualquier acceso redirige al inicio.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/geologia" element={<GeologiaPage />} />
      <Route path="/geologia/igneas" element={<RocasIgneasPage />} />
      <Route path="/geologia/sedimentarias" element={<RocasSedimentariasPage />} />
      <Route path="/geologia/metamorficas" element={<RocasMetamorficasPage />} />
      <Route path="/geologia/minerales" element={<MineralesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
