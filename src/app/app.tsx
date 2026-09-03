import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AjustesScreen, CasaScreen, ComprarScreen } from '@/features/casa'
import { Persistence } from './persistence'
import { Shell } from './shell'

export function App() {
  return (
    <HashRouter>
      <Persistence />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<CasaScreen />} />
          <Route path="/comprar" element={<ComprarScreen />} />
          <Route path="/ajustes" element={<AjustesScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
