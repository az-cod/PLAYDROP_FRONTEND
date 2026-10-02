import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from '@/pages/Home';
import GamesArcadePage from '@/pages/Games';
import CreatorPage from '@/pages/Creator';
import AdminUsagePage from '@/pages/AdminUsage';

import AuthLayout from '@/pages/auth/AuthLayout';
import LoginPage from '@/pages/auth/Login';
import SignupPage from '@/pages/auth/Signup';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword';
import ResetPasswordPage from '@/pages/auth/ResetPassword';
import CheckEmailPage from '@/pages/auth/CheckEmail';
import CheckResetEmailPage from '@/pages/auth/CheckResetEmail';
import AuthErrorPage from '@/pages/auth/AuthError';
import CallbackPage from '@/pages/authcb/Callback';
import ConfirmPage from '@/pages/authcb/Confirm';

const withAuthShell = (Page) => (
  <AuthLayout>
    <Page />
  </AuthLayout>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games" element={<GamesArcadePage />} />
        <Route path="/creator" element={<CreatorPage />} />
        <Route path="/admin/usage" element={<AdminUsagePage />} />

        <Route path="/login" element={withAuthShell(LoginPage)} />
        <Route path="/signup" element={withAuthShell(SignupPage)} />
        <Route path="/forgot-password" element={withAuthShell(ForgotPasswordPage)} />
        <Route path="/reset-password" element={withAuthShell(ResetPasswordPage)} />
        <Route path="/check-email" element={withAuthShell(CheckEmailPage)} />
        <Route path="/check-reset-email" element={withAuthShell(CheckResetEmailPage)} />
        <Route path="/auth-error" element={withAuthShell(AuthErrorPage)} />

        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/auth/confirm" element={<ConfirmPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
