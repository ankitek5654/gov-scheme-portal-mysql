import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import SchemeDetailPage from "./pages/SchemeDetailPage";
import EligibilityCheckerPage from "./pages/EligibilityCheckerPage";
import WhatsNewPage from "./pages/WhatsNewPage";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scheme/:id" element={<SchemeDetailPage />} />
          <Route path="/eligibility" element={<EligibilityCheckerPage />} />
          <Route path="/whats-new" element={<WhatsNewPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/my-applications" element={<MyApplicationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
