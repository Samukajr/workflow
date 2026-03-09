import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RateLimitAlert } from '@/components/RateLimitAlert';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SubmitPaymentPage } from '@/pages/SubmitPaymentPage';
import { LgpdPage } from '@/pages/LgpdPage';

function App() {
  const { initializeAuth, isAuthenticated } = useAuth();

  React.useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <RateLimitAlert />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Header />
                  <main className="flex-1 bg-gray-100 overflow-y-auto">
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/submit" element={<SubmitPaymentPage />} />
                      <Route path="/lgpd" element={<LgpdPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
