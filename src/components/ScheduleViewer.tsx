import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Edit2, Save, X, List, Grid, Trash2, Download } from 'lucide-react';
import { scheduleService, ScheduleWithEmployees } from '../services/scheduleService';
import { employeeService } from '../services/employeeService';
import { Employee } from '../lib/firebase';

type ScheduleViewerProps = {
  refreshTrigger: number;
};

export function ScheduleViewer({ refreshTrigger }: ScheduleViewerProps) {
  const [schedules, setSchedules] = useState<ScheduleWithEmployees[]>([]);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [externalEmployees, setExternalEmployees] = useState<Employee[]>([]);
  const [internalEmployees, setInternalEmployees] = useState<Employee[]>([]);
  const [editForm, setEditForm] = useState({
    external1: '',
    external2: '',
    internal: ''
  });
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadSchedules();
    loadEmployees();
  }, [month, refreshTrigger]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await scheduleService.getByMonth(month.year, month.month);
      setSchedules(data);
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const external = await employeeService.getByTeamType('external');
      const internal = await employeeService.getByTeamType('internal');
      setExternalEmployees(external);
      setInternalEmployees(internal);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  const handlePreviousMonth = () => {
    setMonth(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setMonth(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const startEdit = (schedule: ScheduleWithEmployees) => {
    setEditingSchedule(schedule.id);
    setEditForm({
      external1: schedule.external_employee1_id || '',
      external2: schedule.external_employee2_id || '',
      internal: schedule.internal_employee_id || ''
    });
  };

  const cancelEdit = () => {
    setEditingSchedule(null);
    setEditForm({ external1: '', external2: '', internal: '' });
  };

  const saveEdit = async (scheduleId: string) => {
    if (!editForm.external1 || !editForm.external2 || !editForm.internal) {
      alert('Todos os campos devem ser preenchidos');
      return;
    }

    if (!confirm('Deseja substituir os colaboradores desta escala?')) {
      return;
    }

    try {
      // Solicitar nome do usuário para auditoria
      const editedBy = prompt('Digite seu nome para registrar a alteração:');
      if (!editedBy || editedBy.trim() === '') {
        alert('É necessário informar o nome para registrar a alteração');
        return;
      }

      await scheduleService.update(scheduleId, {
        external_employee1_id: editForm.external1,
        external_employee2_id: editForm.external2,
        internal_employee_id: editForm.internal
      }, editedBy.trim());
      setEditingSchedule(null);
      loadSchedules();
    } catch (error) {
      console.error('Erro ao atualizar escala:', error);
      alert('Erro ao atualizar escala');
    }
  };

  const handleDelete = async (scheduleId: string, scheduleDate: string) => {
    const dateInfo = formatDate(scheduleDate);
    const dateStr = `${dateInfo.day}/${month.month}/${month.year}`;
    
    if (!confirm(`Tem certeza que deseja excluir a escala do dia ${dateStr}?`)) {
      return;
    }

    try {
      await scheduleService.delete(scheduleId);
      loadSchedules();
    } catch (error) {
      console.error('Erro ao excluir escala:', error);
      alert('Erro ao excluir escala');
    }
  };

  const handleDeleteMonth = async () => {
    const monthName = new Date(month.year, month.month - 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
    
    if (!confirm(`Tem certeza que deseja excluir TODAS as escalas de ${monthName}?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const firstDay = new Date(month.year, month.month - 1, 1);
      const lastDay = new Date(month.year, month.month, 0);
      
      await scheduleService.deleteByDateRange(
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0]
      );
      loadSchedules();
    } catch (error) {
      console.error('Erro ao excluir escalas do mês:', error);
      alert('Erro ao excluir escalas do mês');
    }
  };

  const generatePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const cellWidth = (pageWidth - 2 * margin) / 7;
      const cellHeight = (pageHeight - 40 - margin) / 6;

      // Título
      doc.setFontSize(18);
      doc.text(`Escalas de Sobreaviso - ${monthName}`, pageWidth / 2, 15, { align: 'center' });

      // Cabeçalho dos dias da semana
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      doc.setFontSize(10);
      weekDays.forEach((day, index) => {
        doc.text(day, margin + index * cellWidth + cellWidth / 2, 25, { align: 'center' });
      });

      // Dias do calendário
      const calendarDays = getCalendarDays();
      let row = 0;
      let col = 0;

      calendarDays.forEach((dayData) => {
        if (!dayData) {
          col++;
          if (col >= 7) {
            col = 0;
            row++;
          }
          return;
        }

        const x = margin + col * cellWidth;
        const y = 30 + row * cellHeight;
        
        // Borda da célula
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, cellWidth, cellHeight);

        // Número do dia
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(String(dayData.day), x + 2, y + 5);

        // Conteúdo da escala
        if (dayData.schedule) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          let textY = y + 10;
          
          if (dayData.schedule.external_employee1?.name) {
            doc.text(`E1: ${dayData.schedule.external_employee1.name}`, x + 2, textY);
            textY += 4;
          }
          if (dayData.schedule.external_employee2?.name) {
            doc.text(`E2: ${dayData.schedule.external_employee2.name}`, x + 2, textY);
            textY += 4;
          }
          if (dayData.schedule.internal_employee?.name) {
            doc.text(`I: ${dayData.schedule.internal_employee.name}`, x + 2, textY);
          }
        }

        col++;
        if (col >= 7) {
          col = 0;
          row++;
          if (row >= 6 && calendarDays.indexOf(dayData) < calendarDays.length - 1) {
            doc.addPage();
            row = 0;
            // Redesenhar cabeçalho
            weekDays.forEach((day, index) => {
              doc.text(day, margin + index * cellWidth + cellWidth / 2, 25, { align: 'center' });
            });
          }
        }
      });

      doc.save(`escalas-${month.year}-${String(month.month).padStart(2, '0')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return {
      day: date.getDate(),
      weekDay: days[date.getDay()],
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  };

  const monthName = new Date(month.year, month.month - 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  // Função para gerar os dias do calendário
  const getCalendarDays = () => {
    const firstDay = new Date(month.year, month.month - 1, 1);
    const lastDay = new Date(month.year, month.month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = domingo, 6 = sábado

    const days = [];
    
    // Adicionar dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${month.year}-${String(month.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const schedule = schedules.find(s => s.schedule_date === dateStr);
      days.push({
        day,
        date: dateStr,
        schedule,
        dateObj: new Date(month.year, month.month - 1, day)
      });
    }

    return days;
  };

  const renderCalendarView = () => {
    const calendarDays = getCalendarDays();
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Cabeçalho dos dias da semana */}
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 py-2 border-b border-gray-200"
          >
            {day}
          </div>
        ))}

        {/* Dias do calendário */}
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const { day, schedule, dateObj } = dayData;
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
          const isEditing = editingSchedule === schedule?.id;

          return (
            <div
              key={day}
              className={`aspect-square border rounded-lg p-2 flex flex-col ${
                isWeekend ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <div className={`text-sm font-bold ${isWeekend ? 'text-blue-900' : 'text-gray-900'}`}>
                    {day}
                  </div>
                  {schedule?.manual_edit && (
                    <span className="text-[8px] bg-yellow-100 text-yellow-800 rounded px-0.5 font-semibold" title={`Editado por ${schedule.last_edited_by || 'N/A'}${schedule.last_edited_at ? ` em ${new Date(schedule.last_edited_at).toLocaleDateString('pt-BR')}` : ''}`}>
                      ✏️
                    </span>
                  )}
                </div>
                {schedule && !isEditing && (
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleDelete(schedule.id, schedule.schedule_date)}
                      className="p-0.5 hover:bg-red-50 rounded opacity-60 hover:opacity-100 transition-opacity"
                      title="Excluir escala"
                    >
                      <Trash2 size={9} className="text-red-600" />
                    </button>
                    <button
                      onClick={() => startEdit(schedule)}
                      className="p-0.5 hover:bg-gray-200 rounded opacity-60 hover:opacity-100 transition-opacity"
                      title="Editar escala"
                    >
                      <Edit2 size={9} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                {schedule ? (
                  isEditing ? (
                    <div className="space-y-1 text-xs">
                      <div className="grid grid-cols-1 gap-1">
                        <select
                          value={editForm.external1}
                          onChange={(e) => setEditForm(prev => ({ ...prev, external1: e.target.value }))}
                          className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                        >
                          <option value="">Ext. 1...</option>
                          {externalEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.external2}
                          onChange={(e) => setEditForm(prev => ({ ...prev, external2: e.target.value }))}
                          className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                        >
                          <option value="">Ext. 2...</option>
                          {externalEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.internal}
                          onChange={(e) => setEditForm(prev => ({ ...prev, internal: e.target.value }))}
                          className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                        >
                          <option value="">Int...</option>
                          {internalEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => saveEdit(schedule.id)}
                          className="flex-1 px-1 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          <Save size={10} className="mx-auto" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-1 py-0.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        >
                          <X size={10} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-xs">
                      {schedule.manual_edit && (
                        <div className="mb-1">
                          <span className="inline-block px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px] font-semibold" title={`Editado por ${schedule.last_edited_by || 'N/A'}${schedule.last_edited_at ? ` em ${new Date(schedule.last_edited_at).toLocaleDateString('pt-BR')}` : ''}`}>
                            ✏️ Editado
                          </span>
                        </div>
                      )}
                      <div className="text-gray-700 truncate" title={schedule.external_employee1?.name}>
                        <span className="text-gray-500">E1:</span> {schedule.external_employee1?.name || '-'}
                      </div>
                      <div className="text-gray-700 truncate" title={schedule.external_employee2?.name}>
                        <span className="text-gray-500">E2:</span> {schedule.external_employee2?.name || '-'}
                      </div>
                      <div className="text-gray-700 truncate" title={schedule.internal_employee?.name}>
                        <span className="text-gray-500">I:</span> {schedule.internal_employee?.name || '-'}
                      </div>
                      {schedule.manual_edit && schedule.last_edited_by && (
                        <div className="text-[10px] text-gray-500 italic truncate" title={`Editado por ${schedule.last_edited_by}${schedule.last_edited_at ? ` em ${new Date(schedule.last_edited_at).toLocaleDateString('pt-BR')}` : ''}`}>
                          Por: {schedule.last_edited_by}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-xs text-gray-400">Sem escala</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-500">Carregando escalas...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={24} />
            Escalas de Sobreaviso
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Visualização em lista"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Visualização em calendário"
              >
                <Grid size={18} />
              </button>
            </div>
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-medium capitalize min-w-[200px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Baixar PDF"
            >
              <Download size={18} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            {schedules.length > 0 && (
              <button
                onClick={handleDeleteMonth}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Excluir todas as escalas do mês"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Excluir Mês</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {schedules.length === 0 && !loading ? (
          <p className="text-center text-gray-500 py-8">
            Nenhuma escala cadastrada para este mês
          </p>
        ) : viewMode === 'calendar' ? (
          renderCalendarView()
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => {
              const dateInfo = formatDate(schedule.schedule_date);
              const isEditing = editingSchedule === schedule.id;

              return (
                <div
                  key={schedule.id}
                  className={`border rounded-lg p-4 ${
                    dateInfo.isWeekend ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-shrink-0">
                      <div className={`text-center ${dateInfo.isWeekend ? 'text-blue-900' : 'text-gray-900'}`}>
                        <div className="text-2xl font-bold">{dateInfo.day}</div>
                        <div className="text-xs font-medium uppercase">{dateInfo.weekDay}</div>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Externo 1
                            </label>
                            <select
                              value={editForm.external1}
                              onChange={(e) => setEditForm(prev => ({ ...prev, external1: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Selecione...</option>
                              {externalEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Externo 2
                            </label>
                            <select
                              value={editForm.external2}
                              onChange={(e) => setEditForm(prev => ({ ...prev, external2: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Selecione...</option>
                              {externalEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Interno
                            </label>
                            <select
                              value={editForm.internal}
                              onChange={(e) => setEditForm(prev => ({ ...prev, internal: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Selecione...</option>
                              {internalEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(schedule.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            <Save size={14} />
                            Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Externo 1</div>
                              <div className="font-medium text-gray-900">
                                {schedule.external_employee1?.name || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Externo 2</div>
                              <div className="font-medium text-gray-900">
                                {schedule.external_employee2?.name || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Interno</div>
                              <div className="font-medium text-gray-900">
                                {schedule.internal_employee?.name || '-'}
                              </div>
                            </div>
                          </div>
                          {schedule.manual_edit && schedule.last_edited_by && (
                            <div className="text-xs text-gray-500 italic">
                              Editado manualmente por {schedule.last_edited_by}
                              {schedule.last_edited_at && (
                                <> em {new Date(schedule.last_edited_at).toLocaleDateString('pt-BR')}</>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(schedule)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar escala"
                          >
                            <Edit2 size={18} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id, schedule.schedule_date)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir escala"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
