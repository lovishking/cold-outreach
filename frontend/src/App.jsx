import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Moon, Sun, Users, LayoutTemplate, Megaphone, FileText, Settings } from 'lucide-react';
import LeadsPage from './pages/LeadsPage';
import TemplatesPage from './pages/TemplatesPage';
import CampaignPage from './pages/CampaignPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200 font-sans text-slate-900 dark:text-slate-100">
        
        {/* Left Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-200 z-10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nexa Outreach</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
            <NavLink 
              to="/" 
              className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Users size={18} strokeWidth={2.5} /> Leads
            </NavLink>
            <NavLink 
              to="/templates" 
              className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <LayoutTemplate size={18} strokeWidth={2.5} /> Templates
            </NavLink>
            <NavLink 
              to="/campaigns" 
              className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Megaphone size={18} strokeWidth={2.5} /> Campaigns
            </NavLink>
            <NavLink 
              to="/logs" 
              className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <FileText size={18} strokeWidth={2.5} /> Logs
            </NavLink>
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-4"></div>
            <NavLink 
              to="/settings" 
              className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Settings size={18} strokeWidth={2.5} /> Senders
            </NavLink>
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            >
              {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto p-8">
            <Routes>
              <Route path="/" element={<LeadsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/campaigns" element={<CampaignPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
