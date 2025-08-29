import { Licenza } from '../types';

export const calcolaStatoLicenza = (dataScadenza: Date): 'valida' | 'in_scadenza' | 'scaduta' => {
  const oggi = new Date();
  const scadenza = new Date(dataScadenza);
  const diffInMs = scadenza.getTime() - oggi.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return 'scaduta';
  } else if (diffInDays <= 30) {
    return 'in_scadenza';
  } else {
    return 'valida';
  }
};

export const formatDate = (input: Date | string): string => {
  let date: Date;

  if (typeof input === 'string') {
    date = new Date(input);
  } else {
    date = input;
  }

  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Data non valida';
  }

  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '€ 0,00';
  }
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const generateLicenseId = (): string => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

export const generateSerialNumber = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getStatoColor = (stato: Licenza['stato']): string => {
  switch (stato) {
    case 'valida':
      return 'text-green-600 bg-green-100';
    case 'in_scadenza':
      return 'text-yellow-600 bg-yellow-100';
    case 'scaduta':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatoText = (stato: Licenza['stato']): string => {
  switch (stato) {
    case 'valida':
      return 'Valida';
    case 'in_scadenza':
      return 'In Scadenza';
    case 'scaduta':
      return 'Scaduta';
    default:
      return 'Sconosciuto';
  }
};