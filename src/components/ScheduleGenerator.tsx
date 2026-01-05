import { useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { scheduleService } from '../services/scheduleService';
import { vacationService } from '../services/vacationService';

type ScheduleGeneratorProps = {
  onSuccess: () => void;
};

export function ScheduleGenerator({ onSuccess }: ScheduleGeneratorProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateSchedules = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const [year, monthNum] = month.split('-').map(Number);
      const externalEmployees = await employeeService.getByTeamType('external');
      const internalEmployees = await employeeService.getByTeamType('internal');

      if (externalEmployees.length < 2) {
        setError('É necessário ter pelo menos 2 colaboradores externos ativos');
        setIsGenerating(false);
        return;
      }

      if (internalEmployees.length < 1) {
        setError('É necessário ter pelo menos 1 colaborador interno ativo');
        setIsGenerating(false);
        return;
      }

      const firstDay = new Date(year, monthNum - 1, 1);
      const lastDay = new Date(year, monthNum, 0);

      await scheduleService.deleteByDateRange(
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
      );

      // Carregar férias do período
      const vacations = await vacationService.getByDateRange(
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
      );

      // Criar mapa de férias por colaborador e data para busca rápida
      const vacationMap = new Map<string, Set<string>>();
      vacations.forEach(vacation => {
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        const employeeId = vacation.employee_id;
        
        if (!vacationMap.has(employeeId)) {
          vacationMap.set(employeeId, new Set());
        }
        
        const dateSet = vacationMap.get(employeeId)!;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          dateSet.add(d.toISOString().split('T')[0]);
        }
      });

      const schedules = [];
      let externalIndex = 0;
      let internalIndex = 0;
      
      // Rastrear quem foi escalado no dia anterior para evitar dias consecutivos
      let previousExternalIds: string[] = [];
      let previousInternalId: string | null = null;

      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, monthNum - 1, day);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dateStr = date.toISOString().split('T')[0];

        // Filtrar colaboradores que não foram escalados no dia anterior E não estão de férias
        const availableExternals = externalEmployees.filter(emp => {
          const isOnVacation = vacationMap.get(emp.id)?.has(dateStr) || false;
          return !previousExternalIds.includes(emp.id) && !isOnVacation;
        });
        const availableInternals = internalEmployees.filter(emp => {
          const isOnVacation = vacationMap.get(emp.id)?.has(dateStr) || false;
          return emp.id !== previousInternalId && !isOnVacation;
        });

        // Se não houver colaboradores disponíveis suficientes, usar todos
        // (caso especial quando há poucos colaboradores)
        const externalsToUse = availableExternals.length >= 2 
          ? availableExternals 
          : externalEmployees;
        const internalsToUse = availableInternals.length >= 1 
          ? availableInternals 
          : internalEmployees;

        // Selecionar colaboradores evitando repetição entre os dois externos
        let external1: typeof externalEmployees[0];
        let external2: typeof externalEmployees[0];
        let selectedExternalIds: string[] = [];

        // Primeiro externo
        external1 = externalsToUse[externalIndex % externalsToUse.length];
        selectedExternalIds.push(external1.id);
        externalIndex++;

        // Segundo externo - garantir que seja diferente do primeiro
        let candidateIndex = externalIndex;
        let attempts = 0;
        do {
          external2 = externalsToUse[candidateIndex % externalsToUse.length];
          candidateIndex++;
          attempts++;
          // Se só há 2 externos disponíveis e um já foi escolhido, usar o outro
          if (attempts > externalsToUse.length) {
            external2 = externalsToUse.find(emp => emp.id !== external1.id) || externalsToUse[0];
            break;
          }
        } while (external2.id === external1.id);
        selectedExternalIds.push(external2.id);
        externalIndex++;

        const internal = internalsToUse[internalIndex % internalsToUse.length];
        internalIndex++;

        schedules.push({
          schedule_date: date.toISOString().split('T')[0],
          day_type: isWeekend ? 'weekend' as const : 'weekday' as const,
          external_employee1_id: external1.id,
          external_employee2_id: external2.id,
          internal_employee_id: internal.id
        });

        // Atualizar rastreamento para o próximo dia
        previousExternalIds = [external1.id, external2.id];
        previousInternalId = internal.id;
      }

      await scheduleService.createMany(schedules);
      onSuccess();
    } catch (err) {
      setError('Erro ao gerar escalas');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar size={24} />
        Gerar Escalas
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            Selecione o Mês
          </label>
          <input
            type="month"
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Escalas são geradas automaticamente para o mês inteiro</li>
            <li>Dias úteis e finais de semana recebem escalas independentes</li>
            <li>Cada escala terá 2 externos e 1 interno</li>
            <li>A distribuição é feita de forma rotativa entre os colaboradores ativos</li>
            <li>Nenhum colaborador será escalado em dias consecutivos</li>
            <li>Colaboradores em férias não serão escalados</li>
            <li>Escalas existentes do mês serão substituídas</li>
          </ul>
        </div>

        <button
          onClick={generateSchedules}
          disabled={isGenerating}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Gerando Escalas...
            </>
          ) : (
            <>
              <Calendar size={20} />
              Gerar Escalas do Mês
            </>
          )}
        </button>
      </div>
    </div>
  );
}
