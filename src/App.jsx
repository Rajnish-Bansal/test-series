import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Exam from './pages/Exam';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import SubjectDetails from './pages/SubjectDetails';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/subject/:topic" element={<SubjectDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vault" element={<Vault />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
