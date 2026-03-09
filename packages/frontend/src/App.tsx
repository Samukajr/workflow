import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SubmitPaymentPage from './pages/SubmitPaymentPage'
import ValidatePage from './pages/ValidatePage'
import ProcessPaymentPage from './pages/ProcessPaymentPage'
import PaymentListPage from './pages/PaymentListPage'
import PaymentDetailsPage from './pages/PaymentDetailsPage'
import RelatoriosPage from './pages/RelatoriosPage'
import BlocklistPage from './pages/BlocklistPage'
import ApprovalRulesPage from './pages/ApprovalRulesPage'

export default function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/submit" element={<SubmitPaymentPage />} />
          <Route path="/validate" element={<ValidatePage />} />
          <Route path="/process" element={<ProcessPaymentPage />} />
          <Route path="/payments" element={<PaymentListPage />} />
          <Route path="/payments/:id" element={<PaymentDetailsPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/blocklist" element={<BlocklistPage />} />
          <Route path="/alcadas" element={<ApprovalRulesPage />} />

          {/* Rotas legadas para compatibilidade */}
          <Route path="/requisicoes" element={<Navigate to="/payments" replace />} />
          <Route path="/validacoes" element={<Navigate to="/validate" replace />} />
          <Route path="/pagamentos" element={<Navigate to="/process" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
