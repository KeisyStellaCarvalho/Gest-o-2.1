import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Professional, Specialty, Company } from '../types';
import { Users, Plus, Trash2, Table, List, Upload } from 'lucide-react';

export default function Professionals() {
  const [activeTab, setActiveTab] = useState<'insert' | 'view'>('insert');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profData, specData, compData] = await Promise.all([
      api.getProfessionals(),
      api.getSpecialties(),
      api.getCompanies()
    ]);
    setProfessionals(profData);
    setSpecialties(specData);
    setCompanies(compData);
  };

  const getSpecialtyName = (id: string) => {
    const spec = specialties.find(s => s.id === id);
    if (!spec) return 'Desconhecida';
    const comp = companies.find(c => c.id === spec.companyId);
    return `${spec.name} (${comp?.name || '?'})`;
  };

  const addBulkRow = () => {
    setBulkRows([...bulkRows, {
      tempId: Date.now().toString() + Math.random().toString(),
      name: '',
      crm: '',
      bond: 'CLT',
      sector: '',
      specialtyId: ''
    }]);
  };

  const updateBulkRow = (tempId: string, field: string, value: string) => {
    setBulkRows(bulkRows.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
  };

  const removeBulkRow = (tempId: string) => {
    setBulkRows(bulkRows.filter(row => row.tempId !== tempId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      const newRows = lines.map((line, index) => {
        // Assume tab or semicolon separated: Nome, CRM, Vínculo, Setor, Especialidade
        const parts = line.split(/[\t;]/).map(p => p.trim());
        
        const name = parts[0] || '';
        const crm = parts[1] || '';
        const bond = parts[2] || 'CLT';
        const sector = parts[3] || '';
        const specialtyName = parts[4] || '';

        // Try to find specialty by name
        const matchedSpec = specialties.find(s => s.name.toLowerCase() === specialtyName.toLowerCase());

        return {
          tempId: `imported-${index}-${Date.now()}`,
          name,
          crm,
          bond: ['CLT', 'PJ', 'Autônomo'].includes(bond) ? bond : 'CLT',
          sector,
          specialtyId: matchedSpec ? matchedSpec.id : ''
        };
      });

      setBulkRows([...bulkRows, ...newRows]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    const validRows = bulkRows.filter(r => r.name.trim() && r.crm.trim() && r.specialtyId);
    if (validRows.length === 0) {
      alert('Preencha os dados corretamente antes de salvar (Nome, CRM e Especialidade são obrigatórios).');
      return;
    }

    await Promise.all(validRows.map(r => api.createProfessional({
      name: r.name,
      crm: r.crm,
      bond: r.bond,
      sector: r.sector,
      specialtyId: r.specialtyId
    })));

    setBulkRows([]);
    loadData();
    alert('Profissionais salvos com sucesso!');
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Users className="text-blue-600 mr-3" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Profissionais</h2>
        </div>
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('insert')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'insert' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Table size={16} className="mr-2" />
            Planilha de Cadastro
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'view' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <List size={16} className="mr-2" />
            Profissionais Cadastrados
          </button>
        </div>
      </div>

      {activeTab === 'insert' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Cadastro em Lote</h3>
              <p className="text-sm text-gray-500">Adicione múltiplos profissionais preenchendo a planilha ou importando um arquivo texto.</p>
            </div>
            
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt, .csv" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center text-sm w-full md:w-auto justify-center"
              >
                <Upload size={16} className="mr-2" />
                Importar Arquivo Texto
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CRM</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vínculo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidade (Empresa)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bulkRows.map((row) => (
                  <tr key={row.tempId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Nome Completo"
                        className="w-full min-w-[150px] px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                        value={row.name}
                        onChange={(e) => updateBulkRow(row.tempId, 'name', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="CRM"
                        className="w-full min-w-[100px] px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                        value={row.crm}
                        onChange={(e) => updateBulkRow(row.tempId, 'crm', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full min-w-[100px] px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm bg-white"
                        value={row.bond}
                        onChange={(e) => updateBulkRow(row.tempId, 'bond', e.target.value)}
                      >
                        <option value="CLT">CLT</option>
                        <option value="PJ">PJ</option>
                        <option value="Autônomo">Autônomo</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Setor (Ex: UTI)"
                        className="w-full min-w-[120px] px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                        value={row.sector}
                        onChange={(e) => updateBulkRow(row.tempId, 'sector', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full min-w-[180px] px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm bg-white"
                        value={row.specialtyId}
                        onChange={(e) => updateBulkRow(row.tempId, 'specialtyId', e.target.value)}
                      >
                        <option value="" disabled>Selecione...</option>
                        {specialties.map(s => (
                          <option key={s.id} value={s.id}>{getSpecialtyName(s.id)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removeBulkRow(row.tempId)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {bulkRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                      Nenhuma linha adicionada. Clique em "Adicionar Linha" ou importe um arquivo texto.
                      <br/><br/>
                      <span className="text-xs text-gray-400">Formato do arquivo texto (separado por tabulação ou ponto-e-vírgula):<br/>Nome | CRM | Vínculo | Setor | Especialidade</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={addBulkRow}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} className="mr-1" />
              Adicionar Linha
            </button>
            
            <button
              onClick={handleBulkSubmit}
              disabled={bulkRows.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Salvar Profissionais
            </button>
          </div>
        </div>
      )}

      {activeTab === 'view' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">Profissionais Cadastrados</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vínculo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidade (Empresa)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {professionals.map((prof) => (
                <tr key={prof.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prof.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prof.crm}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      prof.bond === 'CLT' ? 'bg-green-100 text-green-800' : 
                      prof.bond === 'PJ' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {prof.bond}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prof.sector || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getSpecialtyName(prof.specialtyId)}</td>
                </tr>
              ))}
              {professionals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum profissional cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
