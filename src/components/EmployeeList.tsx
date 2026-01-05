import { useState } from 'react';
import { Trash2, UserCheck, UserX } from 'lucide-react';
import { Employee } from '../lib/firebase';
import { employeeService } from '../services/employeeService';

type EmployeeListProps = {
  employees: Employee[];
  onUpdate: () => void;
};

export function EmployeeList({ employees, onUpdate }: EmployeeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleStatus = async (employee: Employee) => {
    try {
      await employeeService.update(employee.id, {
        status: employee.status === 'active' ? 'inactive' : 'active'
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) {
      return;
    }

    setDeletingId(id);
    try {
      await employeeService.delete(id);
      onUpdate();
    } catch (error) {
      console.error('Erro ao excluir colaborador:', error);
      alert('Erro ao excluir colaborador. Pode haver escalas associadas.');
    } finally {
      setDeletingId(null);
    }
  };

  const externalEmployees = employees.filter(e => e.team_type === 'external');
  const internalEmployees = employees.filter(e => e.team_type === 'internal');

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{employee.name}</h3>
          <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
            employee.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {employee.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleStatus(employee)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={employee.status === 'active' ? 'Desativar' : 'Ativar'}
          >
            {employee.status === 'active' ? (
              <UserX size={18} className="text-orange-600" />
            ) : (
              <UserCheck size={18} className="text-green-600" />
            )}
          </button>
          <button
            onClick={() => handleDelete(employee.id)}
            disabled={deletingId === employee.id}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Excluir"
          >
            <Trash2 size={18} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Colaboradores Cadastrados
      </h2>

      {employees.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Nenhum colaborador cadastrado ainda
        </p>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              Equipe Externa
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                {externalEmployees.length}
              </span>
            </h3>
            {externalEmployees.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum colaborador externo</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {externalEmployees.map(employee => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              Equipe Interna
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                {internalEmployees.length}
              </span>
            </h3>
            {internalEmployees.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum colaborador interno</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {internalEmployees.map(employee => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
