import { Company, Professional, Shift, Specialty } from './types';

const API_URL = '/api';

export const api = {
  getCompanies: async (): Promise<Company[]> => {
    const res = await fetch(`${API_URL}/companies`);
    return res.json();
  },
  createCompany: async (company: Omit<Company, 'id'>): Promise<Company> => {
    const res = await fetch(`${API_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company),
    });
    return res.json();
  },

  getSpecialties: async (): Promise<Specialty[]> => {
    const res = await fetch(`${API_URL}/specialties`);
    return res.json();
  },
  createSpecialty: async (specialty: Omit<Specialty, 'id'>): Promise<Specialty> => {
    const res = await fetch(`${API_URL}/specialties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(specialty),
    });
    return res.json();
  },

  getProfessionals: async (): Promise<Professional[]> => {
    const res = await fetch(`${API_URL}/professionals`);
    return res.json();
  },
  createProfessional: async (professional: Omit<Professional, 'id'>): Promise<Professional> => {
    const res = await fetch(`${API_URL}/professionals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(professional),
    });
    return res.json();
  },

  getShifts: async (): Promise<Shift[]> => {
    const res = await fetch(`${API_URL}/shifts`);
    return res.json();
  },
  createShift: async (shift: Omit<Shift, 'id'>): Promise<Shift> => {
    const res = await fetch(`${API_URL}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
    return res.json();
  },
  createShiftsBulk: async (shifts: Omit<Shift, 'id'>[]): Promise<Shift[]> => {
    const res = await fetch(`${API_URL}/shifts/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shifts),
    });
    return res.json();
  },
  updateShift: async (id: string, shift: Partial<Shift>): Promise<Shift> => {
    const res = await fetch(`${API_URL}/shifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
    return res.json();
  },
  deleteShift: async (id: string): Promise<Shift> => {
    const res = await fetch(`${API_URL}/shifts/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
