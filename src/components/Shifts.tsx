import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Company, Specialty, Professional, Shift } from '../types';
import { CalendarDays, Plus, Upload, Search, Trash2, Table, List, FileText } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const parseShiftCode = (code: string, defaultHorario: string) => {
  let startTime = '07:00';
  let endTime = '19:00';
  let period: 'Manhã' | 'Tarde' | 'Noite' = 'Manhã';

  if (defaultHorario) {
    let parts: string[] = [];
    const lowerHorario = defaultHorario.toLowerCase();
    if (lowerHorario.includes('-')) {
      parts = lowerHorario.split('-');
    } else if (lowerHorario.includes(' as ')) {
      parts = lowerHorario.split(' as ');
    } else if (lowerHorario.includes(' às ')) {
      parts = lowerHorario.split(' às ');
    }

    if (parts.length === 2) {
      startTime = parts[0].replace(/h/ig, ':00').trim();
      endTime = parts[1].replace(/h/ig, ':00').trim();
      if (startTime.length <= 2) startTime = startTime.padStart(2, '0') + ':00';
      if (endTime.length <= 2) endTime = endTime.padStart(2, '0') + ':00';
      
      const startHour = parseInt(startTime.split(':')[0], 10);
      if (startHour >= 18 || startHour < 5) {
        period = 'Noite';
      } else if (startHour >= 12) {
        period = 'Tarde';
      } else {
        period = 'Manhã';
      }
    }
  }

  switch (code) {
    case 'M': startTime = '07:00'; endTime = '13:00'; period = 'Manhã'; break;
    case 'T': startTime = '13:00'; endTime = '19:00'; period = 'Tarde'; break;
    case 'MT': startTime = '07:00'; endTime = '19:00'; period = 'Manhã'; break;
    case 'N': startTime = '19:00'; endTime = '07:00'; period = 'Noite'; break;
    case 'SD': startTime = '07:00'; endTime = '19:00'; period = 'Manhã'; break;
    case 'SN': startTime = '19:00'; endTime = '07:00'; period = 'Noite'; break;
    case 'D9': startTime = '07:00'; endTime = '16:00'; period = 'Manhã'; break;
    case 'D8': startTime = '07:00'; endTime = '15:00'; period = 'Manhã'; break;
    case 'D6': startTime = '07:00'; endTime = '13:00'; period = 'Manhã'; break;
    case 'D4': startTime = '07:00'; endTime = '11:00'; period = 'Manhã'; break;
    case 'D3': startTime = '07:00'; endTime = '10:00'; period = 'Manhã'; break;
    case 'A': startTime = '08:00'; endTime = '17:00'; period = 'Manhã'; break;
    case 'CC': startTime = '08:00'; endTime = '17:00'; period = 'Manhã'; break;
    case 'S': startTime = '00:00'; endTime = '23:59'; period = 'Manhã'; break;
    case '19-7':
    case '19-07':
    case '19:00-07:00':
      startTime = '19:00'; endTime = '07:00'; period = 'Noite'; break;
    case '7-19':
    case '07-19':
    case '07:00-19:00':
      startTime = '07:00'; endTime = '19:00'; period = 'Manhã'; break;
    default:
      if (code.includes('-')) {
        const parts = code.split('-');
        let sTime = parts[0].replace(/h/ig, ':00').trim();
        let eTime = parts[1].replace(/h/ig, ':00').trim();
        if (sTime.length <= 2) sTime = sTime.padStart(2, '0') + ':00';
        if (eTime.length <= 2) eTime = eTime.padStart(2, '0') + ':00';
        startTime = sTime;
        endTime = eTime;
        const startHour = parseInt(startTime.split(':')[0], 10);
        if (startHour >= 18 || startHour < 5) {
          period = 'Noite';
        } else if (startHour >= 12) {
          period = 'Tarde';
        } else {
          period = 'Manhã';
        }
      } else if (!isNaN(Number(code))) {
        const hours = Number(code);
        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = (startHour + hours) % 24;
        endTime = `${endHour.toString().padStart(2, '0')}:00`;
      }
      break;
  }

  return { startTime, endTime, period };
};

export default function Shifts() {
  const [activeTab, setActiveTab] = useState<'import' | 'insert' | 'view' | 'clear'>('import');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Spreadsheet state
  const [bulkCompanyId, setBulkCompanyId] = useState('');
  const [bulkSpecialtyId, setBulkSpecialtyId] = useState('');
  const [bulkRows, setBulkRows] = useState<any[]>([]);

  // Import state
  const [importText, setImportText] = useState('');
  const [importMonth, setImportMonth] = useState(new Date().getMonth() + 1);
  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [importCompanyId, setImportCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // View state
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear state
  const [clearMonth, setClearMonth] = useState(new Date().getMonth() + 1);
  const [clearYear, setClearYear] = useState(new Date().getFullYear());
  const [clearCompanyId, setClearCompanyId] = useState('');
  const [clearSpecialtyId, setClearSpecialtyId] = useState('');

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

  const handleImport = async () => {
    if (!importText.trim()) {
      alert('Cole os dados da escala no campo de texto.');
      return;
    }

    let targetCompanyId = importCompanyId;

    if (isCreatingCompany) {
      if (!newCompanyName.trim()) {
        alert('Digite o nome da nova empresa.');
        return;
      }
      const newComp = await api.createCompany({ name: newCompanyName });
      targetCompanyId = newComp.id;
      setCompanies([...companies, newComp]);
    } else if (!targetCompanyId) {
      alert('Selecione ou crie uma empresa.');
      return;
    }

    const lines = importText.split('\n').map(l => l.trim()).filter(l => l);
    
    let createdCount = 0;

    let currentSpecialties = await api.getSpecialties();
    let currentProfessionals = await api.getProfessionals();
    let shiftData = await api.getShifts();
    const newShifts: Omit<Shift, 'id'>[] = [];

    for (const line of lines) {
      const cols = line.split(/\t|;/).map(c => c.trim());
      if (cols.length < 7) continue;

      const nome = cols[0];
      const crm = cols[1];
      const vinculo = cols[2];
      const setor = cols[3];
      const especialidadeName = cols[4];
      const horario = cols[5];

      if (nome.toLowerCase() === 'nome' || nome === '' || crm.toLowerCase() === 'crm') continue;
      if (cols[6].toUpperCase() === 'D' || cols[6].toUpperCase() === 'S') continue;

      let spec = currentSpecialties.find(s => s.name.toLowerCase() === especialidadeName.toLowerCase() && s.companyId === targetCompanyId);
      if (!spec) {
        spec = await api.createSpecialty({ name: especialidadeName || 'Geral', companyId: targetCompanyId });
        currentSpecialties.push(spec);
      }

      let prof = currentProfessionals.find(p => p.crm === crm);
      if (!prof) {
        prof = await api.createProfessional({
          name: nome,
          crm: crm,
          bond: ['CLT', 'PJ', 'Autônomo'].includes(vinculo) ? vinculo : 'CLT',
          sector: setor,
          specialtyId: spec.id
        });
        currentProfessionals.push(prof);
      }

      for (let i = 6; i < cols.length; i++) {
        const day = i - 5;
        if (day > 31) break;

        const code = cols[i].toUpperCase();
        const skipCodes = ['', 'F', 'FE', 'FÉRIAS', 'LICENÇA', 'CF'];
        
        if (!code || skipCodes.includes(code)) continue;

        const { startTime, endTime, period } = parseShiftCode(code, horario);
        const dateStr = `${importYear}-${importMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        const dateObj = new Date(`${dateStr}T12:00:00`);
        if (dateObj.getMonth() + 1 !== importMonth) continue;

        // Prevent duplicates
        const isDuplicate = shiftData.some(s => 
          s.professionalId === prof.id && 
          s.date === dateStr && 
          s.startTime === startTime && 
          s.endTime === endTime
        ) || newShifts.some(s => 
          s.professionalId === prof.id && 
          s.date === dateStr && 
          s.startTime === startTime && 
          s.endTime === endTime
        );

        if (isDuplicate) continue;

        newShifts.push({
          companyId: targetCompanyId,
          specialtyId: spec.id,
          professionalId: prof.id,
          date: dateStr,
          period,
          startTime,
          endTime,
          status: 'Pendente',
          sector: setor
        });
        createdCount++;
      }
    }

    if (newShifts.length > 0) {
      await api.createShiftsBulk(newShifts);
    }

    alert(`Importação concluída! ${createdCount} plantões criados.`);
    setImportText('');
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result as string;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const newShifts: Omit<Shift, 'id'>[] = [];
      
      for (const row of data) {
        const companyId = String(row.EmpresaID || companies[0]?.id);
        const specialtyId = String(row.SetorID || row.EspecialidadeID || specialties[0]?.id);
        const professionalId = String(row.ProfissionalID || professionals[0]?.id);
        const date = row.Data || format(new Date(), 'yyyy-MM-dd');
        const period = row.Periodo || 'Manhã';
        const startTime = row.Inicio || '08:00';
        const endTime = row.Fim || '12:00';

        const isDuplicate = shifts.some(s => 
          s.professionalId === professionalId && 
          s.date === date && 
          s.startTime === startTime && 
          s.endTime === endTime
        ) || newShifts.some(s => 
          s.professionalId === professionalId && 
          s.date === date && 
          s.startTime === startTime && 
          s.endTime === endTime
        );

        if (!isDuplicate) {
          newShifts.push({
            companyId,
            specialtyId,
            professionalId,
            date,
            period,
            startTime,
            endTime,
            status: 'Pendente',
            sector: row.Setor || ''
          });
        }
      }

      if (newShifts.length > 0) {
        await api.createShiftsBulk(newShifts);
        loadData();
        alert(`${newShifts.length} escalas importadas com sucesso!`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredSpecialties = specialties.filter(s => s.companyId === bulkCompanyId);
  const filteredProfessionals = professionals.filter(p => p.specialtyId === bulkSpecialtyId);
  const shiftsForViewDate = shifts.filter(s => s.date === viewDate);

  const getProfName = (id: string) => professionals.find(p => p.id === id)?.name || 'Desconhecido';
  const getSpecName = (id: string) => specialties.find(s => s.id === id)?.name || 'Desconhecido';
  const getCompName = (id: string) => companies.find(c => c.id === id)?.name || 'Desconhecida';

  const calculateTotalHours = (shiftsToCalc: Shift[]) => {
    let totalMinutes = 0;
    shiftsToCalc.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      
      let start = startH * 60 + startM;
      let end = endH * 60 + endM;
      
      if (end < start) {
        end += 24 * 60; // cross midnight
      }
      
      totalMinutes += (end - start);
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') + 'm' : ''}`;
  };

  // Spreadsheet actions
  const addBulkRow = () => {
    setBulkRows([...bulkRows, {
      tempId: Date.now().toString() + Math.random().toString(),
      professionalId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      period: 'Manhã',
      startTime: '08:00',
      endTime: '12:00',
      sector: ''
    }]);
  };

  const updateBulkRow = (tempId: string, field: string, value: string) => {
    setBulkRows(bulkRows.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
  };

  const removeBulkRow = (tempId: string) => {
    setBulkRows(bulkRows.filter(row => row.tempId !== tempId));
  };

  const handleBulkSubmit = async () => {
    const validRows = bulkRows.filter(r => r.professionalId && r.date && r.startTime && r.endTime);
    if (validRows.length === 0) {
      alert('Preencha os dados corretamente antes de salvar.');
      return;
    }

    const newShifts: Omit<Shift, 'id'>[] = [];
    
    for (const r of validRows) {
      const isDuplicate = shifts.some(s => 
        s.professionalId === r.professionalId && 
        s.date === r.date && 
        s.startTime === r.startTime && 
        s.endTime === r.endTime
      ) || newShifts.some(s => 
        s.professionalId === r.professionalId && 
        s.date === r.date && 
        s.startTime === r.startTime && 
        s.endTime === r.endTime
      );

      if (!isDuplicate) {
        newShifts.push({
          companyId: bulkCompanyId,
          specialtyId: bulkSpecialtyId,
          professionalId: r.professionalId,
          date: r.date,
          period: r.period,
          startTime: r.startTime,
          endTime: r.endTime,
          status: 'Pendente' as const,
          sector: r.sector || ''
        });
      }
    }

    if (newShifts.length > 0) {
      await api.createShiftsBulk(newShifts);
      alert(`${newShifts.length} escalas salvas com sucesso!`);
    } else {
      alert('Nenhuma escala nova para salvar (todas já existiam).');
    }
    
    setBulkRows([]);
    loadData();
  };

  const handleDeleteShift = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plantão?')) {
      await api.deleteShift(id);
      loadData();
    }
  };

  const handleCleanDuplicates = async () => {
    if (!window.confirm('Isso irá procurar e remover todos os plantões duplicados (mesmo profissional, data e horário). Deseja continuar?')) return;
    
    const seen = new Set<string>();
    const duplicates: string[] = [];
    
    for (const shift of shifts) {
      const key = `${shift.professionalId}-${shift.date}-${shift.startTime}-${shift.endTime}`;
      if (seen.has(key)) {
        duplicates.push(shift.id);
      } else {
        seen.add(key);
      }
    }

    if (duplicates.length === 0) {
      alert('Nenhum plantão duplicado encontrado!');
      return;
    }

    let deleted = 0;
    for (const id of duplicates) {
      await api.deleteShift(id);
      deleted++;
    }

    alert(`${deleted} plantões duplicados foram removidos com sucesso!`);
    loadData();
  };

  const handleClearSchedule = async () => {
    const shiftsToDelete = shifts.filter(s => {
      const d = new Date(`${s.date}T12:00:00`);
      if (d.getMonth() + 1 !== clearMonth) return false;
      if (d.getFullYear() !== clearYear) return false;
      if (clearCompanyId && s.companyId !== clearCompanyId) return false;
      if (clearSpecialtyId && s.specialtyId !== clearSpecialtyId) return false;
      return true;
    });

    if (shiftsToDelete.length === 0) {
      alert('Nenhum plantão encontrado para os filtros selecionados.');
      return;
    }

    if (!window.confirm(`ATENÇÃO: Você está prestes a excluir ${shiftsToDelete.length} plantões. Esta ação não pode ser desfeita. Deseja realmente continuar?`)) {
      return;
    }

    let deleted = 0;
    for (const shift of shiftsToDelete) {
      await api.deleteShift(shift.id);
      deleted++;
    }

    alert(`${deleted} plantões foram excluídos com sucesso!`);
    loadData();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <CalendarDays className="text-blue-600 mr-3" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Escalas</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanDuplicates}
            className="text-sm text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-md transition-colors font-medium border border-red-200 mr-2"
          >
            Limpar Duplicados
          </button>
          <div className="flex bg-gray-200 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'import' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <FileText size={16} className="mr-2" />
            Importar Escala
          </button>
          <button
            onClick={() => setActiveTab('insert')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'insert' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Table size={16} className="mr-2" />
            Inclusões (Planilha)
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'view' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <List size={16} className="mr-2" />
            Visualização Diária
          </button>
          <button
            onClick={() => setActiveTab('clear')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'clear' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-red-600'}`}
          >
            <Trash2 size={16} className="mr-2" />
            Limpar Escala
          </button>
          </div>
        </div>
      </div>

      {activeTab === 'import' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-700">Importar Escala em Lote</h3>
            <p className="text-sm text-gray-500">Cole os dados da sua planilha no campo abaixo. O sistema criará as empresas, profissionais e plantões automaticamente.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={importMonth}
                onChange={(e) => setImportMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={importYear}
                onChange={(e) => setImportYear(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              {isCreatingCompany ? (
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Nome da nova empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                  <button 
                    onClick={() => setIsCreatingCompany(false)}
                    className="bg-gray-200 px-3 py-2 rounded-r-md text-sm hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={importCompanyId}
                    onChange={(e) => setImportCompanyId(e.target.value)}
                  >
                    <option value="" disabled>Selecione...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                    onClick={() => setIsCreatingCompany(true)}
                    className="bg-blue-50 text-blue-600 px-3 py-2 rounded-r-md text-sm hover:bg-blue-100 font-medium border border-l-0 border-blue-200"
                  >
                    Nova
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dados da Planilha (Copie e Cole do Excel)</label>
            <textarea
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm whitespace-pre"
              placeholder={`Nome\tCRM\tVínculo\tSetor\tEspecialidade\tHorário\t1\t2\t3\t...\nJoão Silva\t12345\tCLT\tUTI\tCardiologia\t07:00-19:00\tM\tT\tF\t...`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            ></textarea>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Legendas suportadas:</strong> M (Manhã), T (Tarde), MT (Manhã/Tarde), N (Noite), SD (Diurno 12h), SN (Noturno 12h), D9, D8, D6, D4, D3, A (Ambulatório), CC (Centro Cirúrgico), S (Sobreaviso), Números (horas). F, FE, Férias e Licença são ignorados.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center"
            >
              <Upload size={18} className="mr-2" />
              Processar e Importar Escala
            </button>
          </div>
        </div>
      )}

      {activeTab === 'insert' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b pb-6">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <select
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={bulkCompanyId}
                  onChange={(e) => {
                    setBulkCompanyId(e.target.value);
                    setBulkSpecialtyId('');
                    setBulkRows([]);
                  }}
                >
                  <option value="" disabled>Selecione a Empresa...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                <select
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={bulkSpecialtyId}
                  onChange={(e) => {
                    setBulkSpecialtyId(e.target.value);
                    setBulkRows([]);
                  }}
                  disabled={!bulkCompanyId}
                >
                  <option value="" disabled>Selecione a Especialidade...</option>
                  {filteredSpecialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center text-sm w-full md:w-auto justify-center"
              >
                <Upload size={16} className="mr-2" />
                Importar Excel Antigo
              </button>
            </div>
          </div>

          {bulkCompanyId && bulkSpecialtyId ? (
            <div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profissional</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fim</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkRows.map((row) => (
                      <tr key={row.tempId} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <select
                            className="w-full min-w-[150px] px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm bg-white"
                            value={row.professionalId}
                            onChange={(e) => updateBulkRow(row.tempId, 'professionalId', e.target.value)}
                          >
                            <option value="" disabled>Selecione...</option>
                            {filteredProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            placeholder="Setor"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                            value={row.sector || ''}
                            onChange={(e) => updateBulkRow(row.tempId, 'sector', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                            value={row.date}
                            onChange={(e) => updateBulkRow(row.tempId, 'date', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm bg-white"
                            value={row.period}
                            onChange={(e) => updateBulkRow(row.tempId, 'period', e.target.value)}
                          >
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="time"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                            value={row.startTime}
                            onChange={(e) => updateBulkRow(row.tempId, 'startTime', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="time"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm"
                            value={row.endTime}
                            onChange={(e) => updateBulkRow(row.tempId, 'endTime', e.target.value)}
                          />
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
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                          Nenhuma linha adicionada. Clique em "Adicionar Linha" para começar.
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
                  Salvar Planilha
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Table size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Selecione uma Empresa e uma Especialidade para abrir a planilha de lançamento.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'view' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-700">Escalas do Dia</h3>
            <div className="flex items-center">
              <Search className="text-gray-400 mr-2" size={20} />
              <input
                type="date"
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
              />
            </div>
          </div>

          {shiftsForViewDate.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarDays size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Nenhuma escala programada para este dia.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                <span className="font-medium">Total de Horas no Dia:</span>
                <span className="text-xl font-bold">{calculateTotalHours(shiftsForViewDate)}</span>
              </div>
              {Array.from(new Set(shiftsForViewDate.map(s => s.specialtyId))).map((specId: string) => {
                const specShifts = shiftsForViewDate.filter(s => s.specialtyId === specId);
                return (
                  <div key={specId} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-gray-700 flex justify-between items-center">
                      <span>{getSpecName(specId)}</span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">{getCompName(specShifts[0].companyId)}</span>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {specShifts.map(shift => (
                        <li key={shift.id} className="p-4 hover:bg-blue-50/50 transition-colors flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{getProfName(shift.professionalId)}</p>
                            <p className="text-sm text-gray-500">
                              Turno: {shift.period} 
                              {shift.sector && <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">Setor: {shift.sector}</span>}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-mono mb-1">
                              {shift.startTime} - {shift.endTime}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">Status: {shift.status}</span>
                              <button 
                                onClick={() => handleDeleteShift(shift.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Excluir plantão"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'clear' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold text-red-600 flex items-center">
              <Trash2 className="mr-2" size={20} />
              Limpar Escala Cadastrada
            </h3>
            <p className="text-sm text-gray-500 mt-1">Selecione os filtros abaixo para excluir todos os plantões de uma escala específica.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                value={clearMonth}
                onChange={(e) => setClearMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={clearYear}
                onChange={(e) => setClearYear(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                value={clearCompanyId}
                onChange={(e) => {
                  setClearCompanyId(e.target.value);
                  setClearSpecialtyId('');
                }}
              >
                <option value="">Todas as Empresas</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                value={clearSpecialtyId}
                onChange={(e) => setClearSpecialtyId(e.target.value)}
              >
                <option value="">Todas as Especialidades</option>
                {specialties
                  .filter(s => !clearCompanyId || s.companyId === clearCompanyId)
                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClearSchedule}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium flex items-center"
            >
              <Trash2 size={18} className="mr-2" />
              Excluir Plantões Selecionados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
