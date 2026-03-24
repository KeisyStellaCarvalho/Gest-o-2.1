import { useState, useEffect } from 'react';
import { Building2, Stethoscope, Users, CalendarDays, Clock, LogOut, Menu, LayoutDashboard } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Companies from './components/Companies';
import Specialties from './components/Specialties';
import Shifts from './components/Shifts';
import TimeTracking from './components/TimeTracking';
import Login from './components/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'companies': return <Companies />;
      case 'specialties': return <Specialties />;
      case 'shifts': return <Shifts />;
      case 'time': return <TimeTracking />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shifts', label: 'Escalas', icon: CalendarDays },
    { id: 'time', label: 'Ponto', icon: Clock },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'specialties', label: 'Especialidades', icon: Stethoscope },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Gestão Médica</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-blue-900 text-white flex-shrink-0`}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold tracking-tight">Gestão Médica</h1>
          <p className="text-blue-300 text-sm mt-1">Sistema de Escalas</p>
        </div>
        <nav className="mt-4 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  currentTab === item.id ? 'bg-blue-800 border-l-4 border-blue-400' : 'hover:bg-blue-800/50 border-l-4 border-transparent'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-left text-red-300 hover:bg-blue-800/50 mt-auto border-l-4 border-transparent"
          >
            <LogOut size={20} className="mr-3" />
            Sair
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
