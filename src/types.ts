export type Company = {
  id: string;
  name: string;
};

export type Specialty = {
  id: string;
  companyId: string;
  name: string;
};

export type Professional = {
  id: string;
  specialtyId: string;
  name: string;
  crm: string;
  bond: string;
  sector?: string;
};

export type Shift = {
  id: string;
  companyId: string;
  specialtyId: string;
  professionalId: string;
  date: string;
  period: 'Manhã' | 'Tarde' | 'Noite';
  startTime: string;
  endTime: string;
  clockIn?: string;
  clockOut?: string;
  status: 'Pendente' | 'Cumprida' | 'Falta' | 'Atraso';
  sector?: string;
};
