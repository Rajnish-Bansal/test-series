import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Exam from './pages/Exam';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import SubjectDetails from './pages/SubjectDetails';

import AdminDashboard from './pages/AdminDashboard';
import History from './pages/History';
import SessionAnalysis from './pages/SessionAnalysis';
import TestsList from './pages/TestsList';
import Auth from './pages/Auth';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminPath && <Navbar />}
      <main className={`flex-1 ${isAdminPath ? '' : 'max-w-[1600px] w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/subject/:topic" element={<SubjectDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tests" element={<TestsList />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/history" element={<History />} />
          <Route path="/analysis/:sessionId" element={<SessionAnalysis />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
