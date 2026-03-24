import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Shift, Professional, Specialty } from '../types';
import { Clock, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function TimeTracking() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Modal state
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [status, setStatus] = useState<Shift['status']>('Pendente');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [shiftData, profData, specData] = await Promise.all([
      api.getShifts(),
      api.getProfessionals(),
      api.getSpecialties()
    ]);
    setShifts(shiftData);
    setProfessionals(profData);
    setSpecialties(specData);
  };

  const shiftsForViewDate = shifts.filter(s => s.date === viewDate);

  const getProfName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconhecido';
  const getSpecName = (id: string) => specialties.find(s => s.id === id)?.name || 'Desconhecida';

  const openModal = (shift: Shift) => {
    setSelectedShift(shift);
    setClockIn(shift.clockIn || shift.startTime);
    setClockOut(shift.clockOut || shift.endTime);
    setStatus(shift.status !== 'Pendente' ? shift.status : 'Cumprida');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;

    await api.updateShift(selectedShift.id, {
      clockIn,
      clockOut,
      status
    });

    setSelectedShift(null);
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Cumprida': return <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle size={12} className="mr-1" /> Cumprida</span>;
      case 'Falta': return <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium"><XCircle size={12} className="mr-1" /> Falta</span>;
      case 'Atraso': return <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium"><AlertTriangle size={12} className="mr-1" /> Atraso</span>;
      default: return <span className="flex items-center text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium"><Clock size={12} className="mr-1" /> Pendente</span>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="text-blue-600 mr-3" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Registro de Ponto</h2>
        </div>
        <div className="flex items-center bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
          <Search className="text-gray-400 mr-2" size={20} />
          <input
            type="date"
            className="focus:outline-none text-sm text-gray-700"
            value={viewDate}
            onChange={(e) => setViewDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário Previsto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ponto Realizado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shiftsForViewDate.map((shift) => (
              <tr key={shift.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getProfName(shift.professionalId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSpecName(shift.specialtyId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {shift.startTime} - {shift.endTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 font-medium">
                  {shift.clockIn && shift.clockOut ? `${shift.clockIn} - ${shift.clockOut}` : '--:-- - --:--'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(shift.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openModal(shift)}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                  >
                    Registrar
                  </button>
                </td>
              </tr>
            ))}
            {shiftsForViewDate.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  Nenhuma escala encontrada para esta data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Ponto */}
      {selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Registrar Ponto</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p><strong>Profissional:</strong> {getProfName(selectedShift.professionalId)}</p>
              <p><strong>Horário Previsto:</strong> {selectedShift.startTime} às {selectedShift.endTime}</p>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrada Real</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saída Real</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status da Escala</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  required
                >
                  <option value="Cumprida">Cumprida</option>
                  <option value="Atraso">Atraso</option>
                  <option value="Falta">Falta</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedShift(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
