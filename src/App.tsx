import { useState, useEffect } from 'react';
import { Users, Calendar, Menu, X, Plane } from 'lucide-react';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeList } from './components/EmployeeList';
import { ScheduleGenerator } from './components/ScheduleGenerator';
import { ScheduleViewer } from './components/ScheduleViewer';
import { VacationManager } from './components/VacationManager';
import { employeeService } from './services/employeeService';
import { Employee } from './lib/firebase';

type View = 'employees' | 'schedules' | 'vacations';

function App() {
  const [currentView, setCurrentView] = useState<View>('schedules');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [refreshTrigger]);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-600" size={32} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Escalas de Sobreaviso</h1>
                <p className="text-xs text-gray-500">Gestão de Equipes</p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden md:flex gap-2">
              <button
                onClick={() => setCurrentView('schedules')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'schedules'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar size={20} />
                Escalas
              </button>
              <button
                onClick={() => setCurrentView('employees')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'employees'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users size={20} />
                Colaboradores
              </button>
              <button
                onClick={() => setCurrentView('vacations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'vacations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Plane size={20} />
                Férias
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentView('schedules');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'schedules'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Calendar size={20} />
                Escalas
              </button>
              <button
                onClick={() => {
                  setCurrentView('employees');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'employees'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Users size={20} />
                Colaboradores
              </button>
              <button
                onClick={() => {
                  setCurrentView('vacations');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'vacations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Plane size={20} />
                Férias
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'employees' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <EmployeeForm onSuccess={handleRefresh} />
              </div>
              <div className="lg:col-span-2">
                <EmployeeList employees={employees} onUpdate={handleRefresh} />
              </div>
            </div>
          </div>
        ) : currentView === 'vacations' ? (
          <VacationManager refreshTrigger={refreshTrigger} />
        ) : (
          <div className="space-y-6">
            <ScheduleGenerator onSuccess={handleRefresh} />
            <ScheduleViewer refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Sistema de Gestão de Escalas de Sobreaviso</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
