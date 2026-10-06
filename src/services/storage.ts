/**
 * Gerenciador de Persistência e Estrutura de Dados SENAI-SP
 * Responsável Técnica: Gabriela Cares
 */

import {
  Article,
  DatabaseState,
  GitHubConfig,
  ItemGroup,
  ItemSubgroup,
  ItemType,
  StockMovement,
  StorageLocation,
} from '../types/inventory';

const STORAGE_KEY = 'senai_sp_sige_inventory_db_v1';

export const INITIAL_GITHUB_CONFIG: GitHubConfig = {
  token: '',
  owner: '',
  repo: 'senai-sp-estoque-backup',
  branch: 'main',
  filePath: 'dados/inventario_senai_sp.json',
  autoSync: false,
  lastSyncAt: null,
  connected: false,
};

/**
 * Estrutura de dados inicial VAZIA para testes e validação do usuário,
 * conforme especificação técnica.
 */
export const EMPTY_DATABASE: DatabaseState = {
  types: [],
  groups: [],
  subgroups: [],
  articles: [],
  locations: [],
  movements: [],
  gitCommits: [],
  githubConfig: INITIAL_GITHUB_CONFIG,
  lastModified: new Date().toISOString(),
  version: '1.0.0',
};

/**
 * Carrega o estado do banco do localStorage
 */
export function loadDatabase(): DatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_DATABASE, lastModified: new Date().toISOString() };
    }
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    return {
      types: Array.isArray(parsed.types) ? parsed.types : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      subgroups: Array.isArray(parsed.subgroups) ? parsed.subgroups : [],
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
      gitCommits: Array.isArray(parsed.gitCommits) ? parsed.gitCommits : [],
      githubConfig: { ...INITIAL_GITHUB_CONFIG, ...(parsed.githubConfig || {}) },
      lastModified: parsed.lastModified || new Date().toISOString(),
      version: parsed.version || '1.0.0',
    };
  } catch (error) {
    console.error('Falha ao carregar dados locais:', error);
    return { ...EMPTY_DATABASE, lastModified: new Date().toISOString() };
  }
}

/**
 * Salva o estado atual no localStorage com persistência contínua
 */
export function saveDatabase(db: DatabaseState): void {
  try {
    const stateToSave: DatabaseState = {
      ...db,
      lastModified: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Falha ao salvar dados locais:', error);
  }
}

/**
 * Reseta o banco para estrutura 100% vazia
 */
export function clearAllData(): DatabaseState {
  const empty: DatabaseState = {
    ...EMPTY_DATABASE,
    lastModified: new Date().toISOString(),
  };
  saveDatabase(empty);
  return empty;
}

// ----------------------------------------------------------------------------
// Geradores Automáticos de Códigos Únicos por Nível Hierárquico
// ----------------------------------------------------------------------------

export function generateTypeCode(existingTypes: ItemType[]): string {
  const count = existingTypes.length + 1;
  const numStr = count.toString().padStart(2, '0');
  let candidate = `TIP-${numStr}`;
  let index = count;
  while (existingTypes.some((t) => t.code.toUpperCase() === candidate)) {
    index++;
    candidate = `TIP-${index.toString().padStart(2, '0')}`;
  }
  return candidate;
}

export function generateGroupCode(typeCode: string, existingGroups: ItemGroup[], typeId: string): string {
  const groupsInType = existingGroups.filter((g) => g.typeId === typeId);
  const count = groupsInType.length + 1;
  const numStr = count.toString().padStart(2, '0');
  let candidate = `${typeCode}.GRP-${numStr}`;
  let index = count;
  while (existingGroups.some((g) => g.code.toUpperCase() === candidate)) {
    index++;
    candidate = `${typeCode}.GRP-${index.toString().padStart(2, '0')}`;
  }
  return candidate;
}

export function generateSubgroupCode(groupCode: string, existingSubgroups: ItemSubgroup[], groupId: string): string {
  const subsInGroup = existingSubgroups.filter((s) => s.groupId === groupId);
  const count = subsInGroup.length + 1;
  const numStr = count.toString().padStart(2, '0');
  let candidate = `${groupCode}.SUB-${numStr}`;
  let index = count;
  while (existingSubgroups.some((s) => s.code.toUpperCase() === candidate)) {
    index++;
    candidate = `${groupCode}.SUB-${index.toString().padStart(2, '0')}`;
  }
  return candidate;
}

export function generateArticleCode(existingArticles: Article[]): string {
  const count = existingArticles.length + 1;
  const numStr = count.toString().padStart(4, '0');
  let candidate = `ART-${numStr}`;
  let index = count;
  while (existingArticles.some((a) => a.code.toUpperCase() === candidate)) {
    index++;
    candidate = `ART-${index.toString().padStart(4, '0')}`;
  }
  return candidate;
}

export function generateLocationCode(existingLocations: StorageLocation[]): string {
  const count = existingLocations.length + 1;
  const numStr = count.toString().padStart(2, '0');
  let candidate = `ALM-${numStr}`;
  let index = count;
  while (existingLocations.some((l) => l.code.toUpperCase() === candidate)) {
    index++;
    candidate = `ALM-${index.toString().padStart(2, '0')}`;
  }
  return candidate;
}

// ----------------------------------------------------------------------------
// Exportação e Importação de Arquivos (Compatível com Google Drive & Local)
// ----------------------------------------------------------------------------

export function exportDatabaseJSON(db: DatabaseState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `SENAI_SP_Inventario_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(';'),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------------------------------
// Conjunto Opcional de Dados de Demonstração (SENAI-SP) para Testes Rápidos
// ----------------------------------------------------------------------------

export function generateSampleData(): DatabaseState {
  const now = new Date().toISOString();

  // Localizações do Almoxarifado SENAI
  const loc1: StorageLocation = {
    id: 'loc-1',
    code: 'ALM-A-01-1',
    name: 'Almoxarifado Geral - Corredor A, Estante 01, Nível 1',
    building: 'Bloco A - Usinagem Mecânica',
    aisle: 'Corredor A',
    shelf: 'Estante 01',
    level: 'Nível 1 (Pesados)',
    notes: 'Área para matérias-primas metálicas e perfis brutos',
    createdAt: now,
  };
  const loc2: StorageLocation = {
    id: 'loc-2',
    code: 'ALM-B-02-3',
    name: 'Almoxarifado Geral - Corredor B, Estante 02, Nível 3',
    building: 'Bloco A - Ferramentaria',
    aisle: 'Corredor B',
    shelf: 'Estante 02',
    level: 'Nível 3 (Gabinete Fechado)',
    notes: 'Armazenamento de instrumentos de medição e insertos de corte',
    createdAt: now,
  };
  const loc3: StorageLocation = {
    id: 'loc-3',
    code: 'ALM-C-01-2',
    name: 'Almoxarifado EPI - Prateleira C1',
    building: 'Bloco Central de Apoio',
    aisle: 'Corredor C',
    shelf: 'Armário EPI',
    level: 'Prateleira 2',
    notes: 'Estoque de EPIs para alunos e instrutores',
    createdAt: now,
  };

  // Nível 1: Tipos
  const type1: ItemType = {
    id: 'tip-1',
    code: 'TIP-01',
    name: 'Matéria-Prima Industrial',
    description: 'Materiais brutos consumidos em oficinas mecânicas e caldeiraria',
    createdAt: now,
  };
  const type2: ItemType = {
    id: 'tip-2',
    code: 'TIP-02',
    name: 'Equipamento de Proteção Individual (EPI)',
    description: 'Dispositivos e trajes de segurança para oficinas e laboratórios',
    createdAt: now,
  };
  const type3: ItemType = {
    id: 'tip-3',
    code: 'TIP-03',
    name: 'Ferramental e Acessórios de Corte',
    description: 'Insertos de metal duro, fresas, brocas e machos para usinagem',
    createdAt: now,
  };

  // Nível 2: Grupos
  const grp1: ItemGroup = {
    id: 'grp-1',
    typeId: 'tip-1',
    code: 'TIP-01.GRP-01',
    name: 'Aços Carbono e Especiais',
    description: 'Barras, perfis e blocos laminados e trefilados',
    createdAt: now,
  };
  const grp2: ItemGroup = {
    id: 'grp-2',
    typeId: 'tip-2',
    code: 'TIP-02.GRP-01',
    name: 'Proteção Visual e Respiratória',
    description: 'Óculos de proteção, máscaras e filtros',
    createdAt: now,
  };
  const grp3: ItemGroup = {
    id: 'grp-3',
    typeId: 'tip-3',
    code: 'TIP-03.GRP-01',
    name: 'Insertos e Pastilhas Intercambiáveis',
    description: 'Pastilhas de corte para torno CNC e convencional',
    createdAt: now,
  };

  // Nível 3: Subgrupos
  const sub1: ItemSubgroup = {
    id: 'sub-1',
    groupId: 'grp-1',
    code: 'TIP-01.GRP-01.SUB-01',
    name: 'Barras Redondas Aço ABNT 1020',
    description: 'Aço carbono para exercícios práticos de torneamento',
    createdAt: now,
  };
  const sub2: ItemSubgroup = {
    id: 'sub-2',
    groupId: 'grp-2',
    code: 'TIP-02.GRP-01.SUB-01',
    name: 'Óculos de Segurança Antirrisco',
    description: 'Lentes incolores em policarbonato com proteção UV',
    createdAt: now,
  };
  const sub3: ItemSubgroup = {
    id: 'sub-3',
    groupId: 'grp-3',
    code: 'TIP-03.GRP-01.SUB-01',
    name: 'Pastilhas TNMG para Desbaste',
    description: 'Pastilhas triangulares negativas de metal duro com cobertura',
    createdAt: now,
  };

  // Nível 4: Artigos
  const art1: Article = {
    id: 'art-1',
    subgroupId: 'sub-1',
    code: 'ART-0001',
    name: 'Barra Redonda Trefilada Aço 1020 Ø 1" x 3000mm',
    description: 'Barra trefilada para exercícios de usinagem e fabricação de eixos didáticos',
    unit: 'BARRA',
    minStock: 10,
    maxStock: 50,
    currentStock: 25,
    unitCost: 85.5,
    defaultLocationId: 'loc-1',
    barcode: '7891020000015',
    createdAt: now,
    updatedAt: now,
  };
  const art2: Article = {
    id: 'art-2',
    subgroupId: 'sub-2',
    code: 'ART-0002',
    name: 'Óculos de Proteção Incolor Policarbonato com Hastes Ajustáveis',
    description: 'EPI padrão SENAI com CA válido para ingresso em oficinas',
    unit: 'UN',
    minStock: 30,
    maxStock: 150,
    currentStock: 18, // abaixo do mínimo para testar alertas de reposição!
    unitCost: 14.8,
    defaultLocationId: 'loc-3',
    barcode: '7891020000022',
    createdAt: now,
    updatedAt: now,
  };
  const art3: Article = {
    id: 'art-3',
    subgroupId: 'sub-3',
    code: 'ART-0003',
    name: 'Inserto Metal Duro TNMG 160408-MA Caixa c/ 10 Unidades',
    description: 'Inserto com quebra-cavaco para torneamento de aços',
    unit: 'CX',
    minStock: 5,
    maxStock: 20,
    currentStock: 8,
    unitCost: 210.0,
    defaultLocationId: 'loc-2',
    barcode: '7891020000039',
    createdAt: now,
    updatedAt: now,
  };

  // Movimentações históricas de entrada e saída
  const m1: StockMovement = {
    id: 'mov-1',
    articleId: 'art-1',
    type: 'ENTRADA',
    quantity: 30,
    previousStock: 0,
    newStock: 30,
    unitCost: 85.5,
    totalCost: 2565.0,
    locationId: 'loc-1',
    documentType: 'NF',
    documentNumber: 'NF-104829',
    reason: 'Aquisição centralizada para turmas do 1º Semestre Técnico',
    requesterOrOrigin: 'Gerdau Aços Especiais S.A.',
    operator: 'Carlos Almoxarife',
    notes: 'Material recebido conferido conforme certificado de qualidade',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
  };

  const m2: StockMovement = {
    id: 'mov-2',
    articleId: 'art-1',
    type: 'SAIDA',
    quantity: 5,
    previousStock: 30,
    newStock: 25,
    unitCost: 85.5,
    totalCost: 427.5,
    locationId: 'loc-1',
    documentType: 'REQUISICAO',
    documentNumber: 'REQ-2026-088',
    reason: 'Aula Prática: Torneamento Cilíndrico e Recartilhado',
    requesterOrOrigin: 'Oficina de Mecânica de Usinagem - Turma MEC-01',
    operator: 'Carlos Almoxarife',
    notes: 'Entregue ao Instrutor Roberto',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  };

  const m3: StockMovement = {
    id: 'mov-3',
    articleId: 'art-2',
    type: 'ENTRADA',
    quantity: 40,
    previousStock: 0,
    newStock: 40,
    unitCost: 14.8,
    totalCost: 592.0,
    locationId: 'loc-3',
    documentType: 'NF',
    documentNumber: 'NF-89211',
    reason: 'Reposição de estoque de segurança de EPIs',
    requesterOrOrigin: 'Distribuidora Paulista de EPIs Ltda',
    operator: 'Carlos Almoxarife',
    notes: 'Lote com CA 34.095 válido até 2029',
    timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
  };

  const m4: StockMovement = {
    id: 'mov-4',
    articleId: 'art-2',
    type: 'SAIDA',
    quantity: 22,
    previousStock: 40,
    newStock: 18,
    unitCost: 14.8,
    totalCost: 325.6,
    locationId: 'loc-3',
    documentType: 'REQUISICAO',
    documentNumber: 'REQ-2026-094',
    reason: 'Distribuição a novos alunos matriculados no Curso Técnico em Eletromecânica',
    requesterOrOrigin: 'Coordenação Pedagógica / Bloco B',
    operator: 'Carlos Almoxarife',
    notes: 'Alunos assinaram cautela de recebimento',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
  };

  const m5: StockMovement = {
    id: 'mov-5',
    articleId: 'art-3',
    type: 'ENTRADA',
    quantity: 8,
    previousStock: 0,
    newStock: 8,
    unitCost: 210.0,
    totalCost: 1680.0,
    locationId: 'loc-2',
    documentType: 'NF',
    documentNumber: 'NF-11029',
    reason: 'Suprimento de ferramentas para centro de usinagem e torno CNC',
    requesterOrOrigin: 'Seco Tools Brasil',
    operator: 'Carlos Almoxarife',
    notes: 'Armazenado no armário B-02 com chave',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
  };

  return {
    types: [type1, type2, type3],
    groups: [grp1, grp2, grp3],
    subgroups: [sub1, sub2, sub3],
    articles: [art1, art2, art3],
    locations: [loc1, loc2, loc3],
    movements: [m1, m2, m3, m4, m5],
    gitCommits: [
      {
        sha: 'a8f4c2e',
        message: 'feat(inventario): implantação inicial dos dados estruturados SENAI-SP',
        author: 'Gabriela Cares',
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        snapshotSummary: {
          typesCount: 3,
          groupsCount: 3,
          subgroupsCount: 3,
          articlesCount: 3,
          movementsCount: 5,
          totalStockUnits: 51,
        },
      },
    ],
    githubConfig: INITIAL_GITHUB_CONFIG,
    lastModified: now,
    version: '1.0.0',
  };
}
