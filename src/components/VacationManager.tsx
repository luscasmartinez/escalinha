import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, X } from 'lucide-react';
import { vacationService, VacationWithEmployee } from '../services/vacationService';
import { employeeService } from '../services/employeeService';
import { Employee } from '../lib/firebase';

type VacationManagerProps = {
  refreshTrigger: number;
};

export function VacationManager({ refreshTrigger }: VacationManagerProps) {
  const [vacations, setVacations] = useState<VacationWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: ''
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadVacations();
    loadEmployees();
  }, [refreshTrigger]);

  const loadVacations = async () => {
    setLoading(true);
    try {
      const data = await vacationService.getAll();
      setVacations(data);
    } catch (error) {
      console.error('Erro ao carregar férias:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getActive();
      setEmployees(data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      alert('Todos os campos devem ser preenchidos');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      alert('A data final deve ser maior ou igual à data inicial');
      return;
    }

    try {
      await vacationService.create({
        employee_id: formData.employee_id,
        start_date: formData.start_date,
        end_date: formData.end_date
      });
      setShowForm(false);
      setFormData({ employee_id: '', start_date: '', end_date: '' });
      loadVacations();
    } catch (error) {
      console.error('Erro ao cadastrar férias:', error);
      alert('Erro ao cadastrar férias');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este período de férias?')) {
      return;
    }

    setDeletingId(id);
    try {
      await vacationService.delete(id);
      loadVacations();
    } catch (error) {
      console.error('Erro ao excluir férias:', error);
      alert('Erro ao excluir férias');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">Carregando férias...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Calendar size={24} />
          Gerenciar Férias
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Cancelar' : 'Adicionar Férias'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colaborador
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormData({ employee_id: '', start_date: '', end_date: '' });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {vacations.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          Nenhum período de férias cadastrado
        </p>
      ) : (
        <div className="space-y-3">
          {vacations.map(vacation => (
            <div
              key={vacation.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {vacation.employee?.name || 'Colaborador não encontrado'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDate(vacation.start_date)} até {formatDate(vacation.end_date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.ceil((new Date(vacation.end_date).getTime() - new Date(vacation.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(vacation.id)}
                  disabled={deletingId === vacation.id}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Excluir"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

