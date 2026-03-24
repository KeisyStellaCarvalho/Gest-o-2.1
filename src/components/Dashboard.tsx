import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Company, Specialty, Professional, Shift } from '../types';
import { CalendarDays, Filter, Users, Clock, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Dashboard() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCompany, setFilterCompany] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterProfessional, setFilterProfessional] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterWeek, setFilterWeek] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [shiftData, compData, specData, profData] = await Promise.all([
      api.getShifts(),
      api.getCompanies(),
      api.getSpecialties(),
      api.getProfessionals()
    ]);
    setShifts(shiftData);
    setCompanies(compData);
    setSpecialties(specData);
    setProfessionals(profData);
  };

  const getProfName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconhecido';
  const getSpecName = (id: string) => specialties.find(s => s.id === id)?.name || 'Desconhecido';
  const getCompName = (id: string) => companies.find(c => c.id === id)?.name || 'Desconhecida';

  const filteredShifts = shifts.filter(s => {
    const shiftDate = parseISO(s.date);
    if (shiftDate.getMonth() + 1 !== filterMonth) return false;
    if (shiftDate.getFullYear() !== filterYear) return false;
    if (filterCompany && s.companyId !== filterCompany) return false;
    if (filterSpecialty && s.specialtyId !== filterSpecialty) return false;
    if (filterProfessional && s.professionalId !== filterProfessional) return false;
    if (filterShift && s.period !== filterShift) return false;
    if (filterDay && s.date !== filterDay) return false;
    if (filterWeek) {
      const day = shiftDate.getDate();
      let period = '3';
      if (day <= 10) period = '1';
      else if (day <= 20) period = '2';
      
      if (period !== filterWeek) return false;
    }
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const totalShifts = filteredShifts.length;
  const uniqueProfessionals = new Set(filteredShifts.map(s => s.professionalId)).size;
  const pendingShifts = filteredShifts.filter(s => s.status === 'Pendente').length;
  const completedShifts = filteredShifts.filter(s => s.status === 'Cumprida').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <CalendarDays className="text-blue-600 mr-3" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Mensal</h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600 mr-4">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Plantões</p>
            <p className="text-2xl font-bold text-gray-800">{totalShifts}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Profissionais</p>
            <p className="text-2xl font-bold text-gray-800">{uniqueProfessionals}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-green-100 p-3 rounded-lg text-green-600 mr-4">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Plantões Cumpridos</p>
            <p className="text-2xl font-bold text-gray-800">{completedShifts}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600 mr-4">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Plantões Pendentes</p>
            <p className="text-2xl font-bold text-gray-800">{pendingShifts}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4">
          <Filter size={20} className="text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Mês</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ano</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Período</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterWeek}
              onChange={(e) => {
                setFilterWeek(e.target.value);
                if (e.target.value) setFilterDay('');
              }}
            >
              <option value="">Todos os Períodos</option>
              <option value="1">Semana 1 (Dias 1 a 10)</option>
              <option value="2">Semana 2 (Dias 11 a 20)</option>
              <option value="3">Semana 3 (Dia 21 ao fim do mês)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Dia Específico</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterDay}
              onChange={(e) => {
                setFilterDay(e.target.value);
                if (e.target.value) {
                  const d = parseISO(e.target.value);
                  setFilterMonth(d.getMonth() + 1);
                  setFilterYear(d.getFullYear());
                  setFilterWeek('');
                }
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Empresa</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterCompany}
              onChange={(e) => {
                setFilterCompany(e.target.value);
                setFilterSpecialty('');
              }}
            >
              <option value="">Todas as Empresas</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Especialidade</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
            >
              <option value="">Todas as Especialidades</option>
              {specialties
                .filter(s => !filterCompany || s.companyId === filterCompany)
                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Profissional</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterProfessional}
              onChange={(e) => setFilterProfessional(e.target.value)}
            >
              <option value="">Todos os Profissionais</option>
              {professionals
                .filter(p => !filterSpecialty || p.specialtyId === filterSpecialty)
                .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Turno</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
            >
              <option value="">Todos os Turnos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterCompany('');
                setFilterSpecialty('');
                setFilterProfessional('');
                setFilterShift('');
                setFilterDay('');
                setFilterWeek('');
                setFilterMonth(new Date().getMonth() + 1);
                setFilterYear(new Date().getFullYear());
              }}
              className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Escala Detalhada</h3>
          <span className="text-sm text-gray-500">{filteredShifts.length} registros encontrados</span>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {format(parseISO(shift.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      shift.period === 'Manhã' ? 'bg-yellow-100 text-yellow-800' : 
                      shift.period === 'Tarde' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {shift.period}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {getProfName(shift.professionalId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getSpecName(shift.specialtyId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.sector || professionals.find(p => p.id === shift.professionalId)?.sector || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCompName(shift.companyId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      shift.status === 'Cumprida' ? 'bg-green-100 text-green-800' : 
                      shift.status === 'Falta' ? 'bg-red-100 text-red-800' : 
                      shift.status === 'Atraso' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shift.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredShifts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Nenhum plantão encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
