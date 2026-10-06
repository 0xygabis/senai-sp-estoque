/**
 * Definições de Tipos para o Sistema de Gestão de Estoques e Almoxarifado SENAI-SP
 * Responsável Técnica: Gabriela Cares
 */

export interface ItemType {
  id: string;
  code: string; // Ex: TIP-01
  name: string; // Ex: Matéria-Prima, EPI, Ferramentas
  description?: string;
  createdAt: string;
}

export interface ItemGroup {
  id: string;
  typeId: string; // Vínculo ao Tipo
  code: string; // Ex: TIP-01.GRP-01
  name: string; // Ex: Metais Ferrosos, Equipamentos de Proteção Facial
  description?: string;
  createdAt: string;
}

export interface ItemSubgroup {
  id: string;
  groupId: string; // Vínculo ao Grupo
  code: string; // Ex: TIP-01.GRP-01.SUB-01
  name: string; // Ex: Barras de Aço 1020, Máscaras de Solda
  description?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  subgroupId: string; // Vínculo ao Subgrupo
  code: string; // Ex: ART-0001 ou TIP-01.GRP-01.SUB-01.0001
  name: string; // Ex: Barra Redonda Trefilada Aço 1020 1/2" x 3m
  description?: string;
  unit: string; // UN, KG, M, L, CX, PAR, PÇ, BARRA, ROLO, JOGO
  minStock: number; // Estoque Mínimo (Ponto de Reposição)
  maxStock: number; // Estoque Máximo
  currentStock: number; // Saldo Atual em Tempo Real
  unitCost: number; // Custo Unitário em R$
  defaultLocationId: string; // Localização Padrão
  barcode?: string; // Código de Barras / SKU interno
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocation {
  id: string;
  code: string; // Ex: ALM-A-01-2
  name: string; // Ex: Almoxarifado Central - Estante A, Nível 2
  building: string; // Ex: Bloco de Metalmecânica
  aisle: string; // Ex: Rua 03
  shelf: string; // Ex: Estante 02
  level: string; // Ex: Prateleira 01 / Vão B
  notes?: string;
  createdAt: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export type DocumentType =
  | 'NF'
  | 'REQUISICAO'
  | 'ORDEM_SERVICO'
  | 'TRANSFERENCIA'
  | 'INVENTARIO'
  | 'OUTRO';

export interface StockMovement {
  id: string;
  articleId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  locationId: string;
  documentType: DocumentType;
  documentNumber: string;
  reason: string; // Ex: Aquisição via NF, Saída para Aula Prática, Manutenção
  requesterOrOrigin: string; // Ex: Fornecedor Gerdau, Oficina CNC, Lab Eletroeletrônica
  operator: string; // Ex: Almoxarife Carlos, Instrutor Gabriela
  notes?: string;
  timestamp: string; // ISO String
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  autoSync: boolean;
  lastSyncAt: string | null;
  connected: boolean;
}

export interface GitCommitRecord {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  snapshotSummary: {
    typesCount: number;
    groupsCount: number;
    subgroupsCount: number;
    articlesCount: number;
    movementsCount: number;
    totalStockUnits: number;
  };
}

export interface DatabaseState {
  types: ItemType[];
  groups: ItemGroup[];
  subgroups: ItemSubgroup[];
  articles: Article[];
  locations: StorageLocation[];
  movements: StockMovement[];
  gitCommits: GitCommitRecord[];
  githubConfig: GitHubConfig;
  lastModified: string;
  version: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'hierarchy'
  | 'movements'
  | 'stock-position'
  | 'locations'
  | 'reports'
  | 'persistence';
