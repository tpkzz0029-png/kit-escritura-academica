import GeoShell from '@/components/GeoShell'
import MineralesPanel from '@/components/MineralesPanel'

export default function MineralesPage() {
  return (
    <GeoShell showAlert={false}>
      <MineralesPanel />
    </GeoShell>
  )
}
