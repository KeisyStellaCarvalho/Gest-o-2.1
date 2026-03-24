import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Company, Specialty } from '../types';
import { Stethoscope, Plus } from 'lucide-react';

export default function Specialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [specData, compData] = await Promise.all([
      api.getSpecialties(),
      api.getCompanies()
    ]);
    setSpecialties(specData);
    setCompanies(compData);
    if (compData.length > 0 && !companyId) {
      setCompanyId(compData[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !companyId) return;
    await api.createSpecialty({ name, companyId });
    setName('');
    loadData();
  };

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'Desconhecida';

  return (
    <div>
      <div className="flex items-center mb-6">
        <Stethoscope className="text-blue-600 mr-3" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Especialidades</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Cadastrar Nova Especialidade</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
          >
            <option value="" disabled>Selecione a Empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Nome da Especialidade"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus size={20} className="mr-2" />
            Salvar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {specialties.map((specialty) => (
              <tr key={specialty.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCompanyName(specialty.companyId)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{specialty.name}</td>
              </tr>
            ))}
            {specialties.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Nenhuma especialidade cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
