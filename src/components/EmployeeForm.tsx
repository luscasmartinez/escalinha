import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Employee } from '../lib/firebase';
import { employeeService } from '../services/employeeService';

type EmployeeFormProps = {
  onSuccess: () => void;
};

export function EmployeeForm({ onSuccess }: EmployeeFormProps) {
  const [name, setName] = useState('');
  const [teamType, setTeamType] = useState<'external' | 'internal'>('external');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await employeeService.create({
        name: name.trim(),
        team_type: teamType,
        status: 'active'
      });

      setName('');
      setTeamType('external');
      onSuccess();
    } catch (err) {
      setError('Erro ao adicionar colaborador');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Adicionar Colaborador
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite o nome do colaborador"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="teamType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Equipe
          </label>
          <select
            id="teamType"
            value={teamType}
            onChange={(e) => setTeamType(e.target.value as 'external' | 'internal')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="external">Equipe Externa</option>
            <option value="internal">Equipe Interna</option>
          </select>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {isSubmitting ? 'Adicionando...' : 'Adicionar Colaborador'}
        </button>
      </div>
    </form>
  );
}
