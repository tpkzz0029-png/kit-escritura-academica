import { Navigate, Route, Routes } from 'react-router'
import Home from './pages/Home'
import ConversorPage from './pages/ConversorPage'
import DetectorPage from './pages/DetectorPage'
import PlagioPage from './pages/PlagioPage'
import GeologiaPage from './pages/GeologiaPage'
import RocasIgneasPage from './pages/RocasIgneasPage'
import RocasSedimentariasPage from './pages/RocasSedimentariasPage'
import RocasMetamorficasPage from './pages/RocasMetamorficasPage'
import MineralesPage from './pages/MineralesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/conversor" element={<ConversorPage />} />
      <Route path="/detector" element={<DetectorPage />} />
      <Route path="/plagio" element={<PlagioPage />} />
      <Route path="/geologia" element={<GeologiaPage />} />
      <Route path="/geologia/igneas" element={<RocasIgneasPage />} />
      <Route path="/geologia/sedimentarias" element={<RocasSedimentariasPage />} />
      <Route path="/geologia/metamorficas" element={<RocasMetamorficasPage />} />
      <Route path="/geologia/minerales" element={<MineralesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
