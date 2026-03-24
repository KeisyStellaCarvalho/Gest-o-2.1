import fs from 'fs';

const lines = [
  "Nome\tCRM\tVínculo\tSetor\tEspecialidade\tHorário\t1\t2\t3",
  "João Silva\t12345\tCLT\tUTI\tCardiologia\t07:00-19:00\tM\tT\tF"
];

let createdCount = 0;
const newShifts = [];

for (const line of lines) {
  const cols = line.split(/\t|;/).map(c => c.trim());
  if (cols.length < 7) continue;

  const nome = cols[0];
  const crm = cols[1];
  const vinculo = cols[2];
  const setor = cols[3];
  const especialidadeName = cols[4];
  const horario = cols[5];

  if (nome.toLowerCase() === 'nome' || nome === '' || crm.toLowerCase() === 'crm' || !crm) continue;

  console.log('Processing:', nome);
  
  for (let i = 6; i < cols.length; i++) {
    const day = i - 5;
    if (day > 31) break;

    const code = cols[i].toUpperCase();
    const skipCodes = ['', 'F', 'FE', 'FÉRIAS', 'LICENÇA', 'CF'];
    
    if (!code || skipCodes.includes(code)) continue;

    console.log('Adding shift for day', day, 'code', code);
    createdCount++;
  }
}

console.log('Total created:', createdCount);
