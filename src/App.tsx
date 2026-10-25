import { Navigate, Route, Routes } from 'react-router'
import Home from './pages/Home'
import ConversorPage from './pages/ConversorPage'
import DetectorPage from './pages/DetectorPage'
import PlagioPage from './pages/PlagioPage'
import GeologiaPage from './pages/GeologiaPage'
import RocasPage from './pages/RocasPage'
import DescripcionPage from './pages/DescripcionPage'
import MineralesPage from './pages/MineralesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/conversor" element={<ConversorPage />} />
      <Route path="/detector" element={<DetectorPage />} />
      <Route path="/plagio" element={<PlagioPage />} />
      <Route path="/geologia" element={<GeologiaPage />} />
      <Route path="/geologia/rocas" element={<RocasPage />} />
      <Route path="/geologia/descripcion" element={<DescripcionPage />} />
      {/* Direcciones antiguas: redirigen a la pestaña correspondiente de Rocas */}
      <Route path="/geologia/igneas" element={<Navigate to="/geologia/rocas?tipo=igneas" replace />} />
      <Route path="/geologia/sedimentarias" element={<Navigate to="/geologia/rocas?tipo=sedimentarias" replace />} />
      <Route path="/geologia/metamorficas" element={<Navigate to="/geologia/rocas?tipo=metamorficas" replace />} />
      <Route path="/geologia/minerales" element={<MineralesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
