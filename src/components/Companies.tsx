import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Company } from '../types';
import { Building2, Plus } from 'lucide-react';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await api.getCompanies();
    setCompanies(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.createCompany({ name });
    setName('');
    loadCompanies();
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Building2 className="text-blue-600 mr-3" size={28} />
        <h2 className="text-2xl font-bold text-gray-800">Empresas</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Cadastrar Nova Empresa</h3>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            placeholder="Nome da Empresa"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Nenhuma empresa cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
