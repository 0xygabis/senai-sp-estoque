/**
 * Cadastro Hierárquico - SENAI-SP SIGE
 * Níveis: Tipo → Grupo → Subgrupo → Artigo
 * Geração automática de códigos únicos para cada nível, validação e integridade referencial.
 * Responsável Técnica: Gabriela Cares
 */

import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Package,
  Layers,
  Folder,
  Tag,
  Search,
  CheckCircle,
  AlertCircle,
  Hash,
} from 'lucide-react';
import {
  Article,
  DatabaseState,
  ItemGroup,
  ItemSubgroup,
  ItemType,
  StorageLocation,
} from '../types/inventory';
import {
  generateArticleCode,
  generateGroupCode,
  generateLocationCode,
  generateSubgroupCode,
  generateTypeCode,
} from '../services/storage';

interface HierarchyManagerProps {
  database: DatabaseState;
  onUpdateDatabase: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onRegisterMovementPrompt?: (articleId: string) => void;
}

type HierarchyTab = 'wizard' | 'types' | 'groups' | 'subgroups' | 'articles';

export const HierarchyManager: React.FC<HierarchyManagerProps> = ({
  database,
  onUpdateDatabase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<HierarchyTab>('wizard');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Estados para o Assistente de Cadastro Rápido de Artigo
  const [wizardTypeId, setWizardTypeId] = useState<string>('');
  const [wizardGroupId, setWizardGroupId] = useState<string>('');
  const [wizardSubgroupId, setWizardSubgroupId] = useState<string>('');

  // Artigo Form State
  const [articleCode, setArticleCode] = useState<string>('');
  const [articleName, setArticleName] = useState<string>('');
  const [articleDescription, setArticleDescription] = useState<string>('');
  const [articleUnit, setArticleUnit] = useState<string>('UN');
  const [articleMinStock, setArticleMinStock] = useState<number>(10);
  const [articleMaxStock, setArticleMaxStock] = useState<number>(100);
  const [articleInitialStock, setArticleInitialStock] = useState<number>(0);
  const [articleUnitCost, setArticleUnitCost] = useState<number>(0);
  const [articleLocationId, setArticleLocationId] = useState<string>('');
  const [articleBarcode, setArticleBarcode] = useState<string>('');

  // Modais de Criação Rápida de Níveis
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupTypeId, setNewGroupTypeId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const [showCreateSubgroupModal, setShowCreateSubgroupModal] = useState(false);
  const [newSubgroupGroupId, setNewSubgroupGroupId] = useState('');
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [newSubgroupDesc, setNewSubgroupDesc] = useState('');

  // Notificação temporária
  const showFeedback = (text: string, error = false) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // --------------------------------------------------------------------------
  // Handlers de Criação com Códigos Automáticos
  // --------------------------------------------------------------------------

  const handleCreateType = () => {
    if (!newTypeName.trim()) {
      showFeedback('Informe o nome do Tipo.', true);
      return;
    }
    const autoCode = generateTypeCode(database.types);
    const newType: ItemType = {
      id: `tip_${Date.now()}`,
      code: autoCode,
      name: newTypeName.trim(),
      description: newTypeDesc.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDatabase((prev) => ({
      ...prev,
      types: [...prev.types, newType],
    }));

    setWizardTypeId(newType.id);
    setNewTypeName('');
    setNewTypeDesc('');
    setShowCreateTypeModal(false);
    showFeedback(`Tipo "${newType.name}" criado com código automático ${autoCode}!`);
  };

  const handleCreateGroup = () => {
    const parentType = database.types.find((t) => t.id === newGroupTypeId);
    if (!parentType) {
      showFeedback('Selecione o Tipo pai para vincular este Grupo.', true);
      return;
    }
    if (!newGroupName.trim()) {
      showFeedback('Informe o nome do Grupo.', true);
      return;
    }

    const autoCode = generateGroupCode(parentType.code, database.groups, parentType.id);
    const newGroup: ItemGroup = {
      id: `grp_${Date.now()}`,
      typeId: parentType.id,
      code: autoCode,
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDatabase((prev) => ({
      ...prev,
      groups: [...prev.groups, newGroup],
    }));

    setWizardGroupId(newGroup.id);
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateGroupModal(false);
    showFeedback(`Grupo "${newGroup.name}" criado com código automático ${autoCode}!`);
  };

  const handleCreateSubgroup = () => {
    const parentGroup = database.groups.find((g) => g.id === newSubgroupGroupId);
    if (!parentGroup) {
      showFeedback('Selecione o Grupo pai para vincular este Subgrupo.', true);
      return;
    }
    if (!newSubgroupName.trim()) {
      showFeedback('Informe o nome do Subgrupo.', true);
      return;
    }

    const autoCode = generateSubgroupCode(parentGroup.code, database.subgroups, parentGroup.id);
    const newSubgroup: ItemSubgroup = {
      id: `sub_${Date.now()}`,
      groupId: parentGroup.id,
      code: autoCode,
      name: newSubgroupName.trim(),
      description: newSubgroupDesc.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDatabase((prev) => ({
      ...prev,
      subgroups: [...prev.subgroups, newSubgroup],
    }));

    setWizardSubgroupId(newSubgroup.id);
    setNewSubgroupName('');
    setNewSubgroupDesc('');
    setShowCreateSubgroupModal(false);
    showFeedback(`Subgrupo "${newSubgroup.name}" criado com código automático ${autoCode}!`);
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardSubgroupId) {
      showFeedback('Selecione Tipo → Grupo → Subgrupo para cadastrar o Artigo.', true);
      return;
    }
    if (!articleName.trim()) {
      showFeedback('Informe a descrição/nome do Artigo.', true);
      return;
    }

    const targetCode = articleCode.trim() || generateArticleCode(database.articles);

    if (database.articles.some((a) => a.code.toUpperCase() === targetCode.toUpperCase())) {
      showFeedback(`Já existe um artigo cadastrado com o código ${targetCode}.`, true);
      return;
    }

    // Se nenhuma localização foi selecionada, cria uma localização padrão no Almoxarifado Central
    let locationId = articleLocationId;
    let updatedLocations = [...database.locations];
    if (!locationId) {
      if (database.locations.length > 0) {
        locationId = database.locations[0].id;
      } else {
        const autoLocCode = generateLocationCode(database.locations);
        const defaultLoc: StorageLocation = {
          id: `loc_${Date.now()}`,
          code: autoLocCode,
          name: 'Almoxarifado Geral - Almoxarifado Central',
          building: 'Bloco Principal SENAI-SP',
          aisle: 'Rua Geral',
          shelf: 'Estante 01',
          level: 'Nível 1',
          notes: 'Criada automaticamente como localização padrão',
          createdAt: new Date().toISOString(),
        };
        updatedLocations.push(defaultLoc);
        locationId = defaultLoc.id;
      }
    }

    const newArticleId = `art_${Date.now()}`;
    const initialQty = Number(articleInitialStock) || 0;

    const newArticle: Article = {
      id: newArticleId,
      subgroupId: wizardSubgroupId,
      code: targetCode,
      name: articleName.trim(),
      description: articleDescription.trim(),
      unit: articleUnit,
      minStock: Number(articleMinStock) || 0,
      maxStock: Number(articleMaxStock) || 0,
      currentStock: initialQty,
      unitCost: Number(articleUnitCost) || 0,
      defaultLocationId: locationId,
      barcode: articleBarcode.trim() || targetCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateDatabase((prev) => {
      const nextMovements = [...prev.movements];
      // Se houver saldo inicial informado, registra a movimentação oficial de entrada de inventário inicial
      if (initialQty > 0) {
        nextMovements.push({
          id: `mov_${Date.now()}`,
          articleId: newArticleId,
          type: 'ENTRADA',
          quantity: initialQty,
          previousStock: 0,
          newStock: initialQty,
          unitCost: Number(articleUnitCost) || 0,
          totalCost: initialQty * (Number(articleUnitCost) || 0),
          locationId: locationId,
          documentType: 'INVENTARIO',
          documentNumber: 'INV-INICIAL',
          reason: 'Carga de saldo inicial no cadastro de artigo',
          requesterOrOrigin: 'Almoxarifado Central SENAI-SP',
          operator: 'Gabriela Cares (Resp. Técnica)',
          timestamp: new Date().toISOString(),
        });
      }

      return {
        ...prev,
        locations: updatedLocations,
        articles: [...prev.articles, newArticle],
        movements: nextMovements,
      };
    });

    // Reset formulário
    setArticleName('');
    setArticleDescription('');
    setArticleCode('');
    setArticleInitialStock(0);
    setArticleUnitCost(0);
    setArticleBarcode('');
    showFeedback(`Artigo "${newArticle.name}" cadastrado com sucesso! Código: ${targetCode}`);
  };

  // --------------------------------------------------------------------------
  // Exclusões com Validação de Integridade
  // --------------------------------------------------------------------------

  const handleDeleteType = (typeId: string) => {
    const hasGroups = database.groups.some((g) => g.typeId === typeId);
    if (hasGroups) {
      showFeedback('Não é possível excluir este Tipo: existem Grupos vinculados a ele.', true);
      return;
    }
    onUpdateDatabase((prev) => ({
      ...prev,
      types: prev.types.filter((t) => t.id !== typeId),
    }));
    showFeedback('Tipo excluído com sucesso.');
  };

  const handleDeleteGroup = (groupId: string) => {
    const hasSubgroups = database.subgroups.some((s) => s.groupId === groupId);
    if (hasSubgroups) {
      showFeedback('Não é possível excluir este Grupo: existem Subgrupos vinculados a ele.', true);
      return;
    }
    onUpdateDatabase((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
    }));
    showFeedback('Grupo excluído com sucesso.');
  };

  const handleDeleteSubgroup = (subgroupId: string) => {
    const hasArticles = database.articles.some((a) => a.subgroupId === subgroupId);
    if (hasArticles) {
      showFeedback('Não é possível excluir este Subgrupo: existem Artigos vinculados a ele.', true);
      return;
    }
    onUpdateDatabase((prev) => ({
      ...prev,
      subgroups: prev.subgroups.filter((s) => s.id !== subgroupId),
    }));
    showFeedback('Subgrupo excluído com sucesso.');
  };

  const handleDeleteArticle = (articleId: string) => {
    const article = database.articles.find((a) => a.id === articleId);
    if (!article) return;

    if (article.currentStock > 0) {
      showFeedback(
        `Não é permitido excluir o artigo "${article.code}" pois ele possui saldo físico (${article.currentStock} ${article.unit}). Efetue a baixa antes.`,
        true
      );
      return;
    }

    onUpdateDatabase((prev) => ({
      ...prev,
      articles: prev.articles.filter((a) => a.id !== articleId),
    }));
    showFeedback(`Artigo ${article.code} excluído com sucesso.`);
  };

  // Grupos filtrados pelo Tipo selecionado no assistente
  const availableGroups = database.groups.filter((g) => g.typeId === wizardTypeId);
  // Subgrupos filtrados pelo Grupo selecionado no assistente
  const availableSubgroups = database.subgroups.filter((s) => s.groupId === wizardGroupId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#E30613]" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Estrutura Hierárquica de Materiais
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Classificação em 4 níveis (Tipo → Grupo → Subgrupo → Artigo) com geração automática de códigos únicos.
          </p>
        </div>

        {/* Segmented Control de Abas (Sem pills desnecessárias) */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('wizard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'wizard'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Assistente de Cadastro
          </button>
          <button
            onClick={() => setActiveSubTab('types')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'types'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Tipos ({database.types.length})
          </button>
          <button
            onClick={() => setActiveSubTab('groups')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'groups'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Grupos ({database.groups.length})
          </button>
          <button
            onClick={() => setActiveSubTab('subgroups')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'subgroups'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Subgrupos ({database.subgroups.length})
          </button>
          <button
            onClick={() => setActiveSubTab('articles')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'articles'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Artigos ({database.articles.length})
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all ${
            feedbackMsg.error
              ? 'bg-red-50 text-[#E30613] border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {feedbackMsg.error ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 1: ASSISTENTE DE CADASTRO HIERÁRQUICO COMPLETO */}
      {/* ==================================================================== */}
      {activeSubTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Seleção e Criação em Cascata (Tipo → Grupo → Subgrupo) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E30613]" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    1. Defina a Árvore de Classificação
                  </h3>
                </div>
              </div>

              {/* Nível 1: Tipo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-mono">
                      1
                    </span>
                    <span>Tipo de Material</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateTypeModal(true)}
                    className="text-[11px] text-[#E30613] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Novo Tipo</span>
                  </button>
                </div>
                <select
                  value={wizardTypeId}
                  onChange={(e) => {
                    setWizardTypeId(e.target.value);
                    setWizardGroupId('');
                    setWizardSubgroupId('');
                  }}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-medium text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                >
                  <option value="">-- Selecione o Tipo --</option>
                  {database.types.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.name}
                    </option>
                  ))}
                </select>
                {database.types.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Nenhum Tipo cadastrado ainda. Clique em "+ Novo Tipo" acima.
                  </p>
                )}
              </div>

              {/* Nível 2: Grupo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-mono">
                      2
                    </span>
                    <span>Grupo de Itens</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!wizardTypeId) {
                        showFeedback('Selecione primeiro um Tipo para criar um Grupo.', true);
                        return;
                      }
                      setNewGroupTypeId(wizardTypeId);
                      setShowCreateGroupModal(true);
                    }}
                    className="text-[11px] text-[#E30613] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Novo Grupo</span>
                  </button>
                </div>
                <select
                  value={wizardGroupId}
                  disabled={!wizardTypeId}
                  onChange={(e) => {
                    setWizardGroupId(e.target.value);
                    setWizardSubgroupId('');
                  }}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-medium text-neutral-900 disabled:opacity-50 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                >
                  <option value="">
                    {wizardTypeId ? '-- Selecione o Grupo --' : '-- Aguardando Tipo --'}
                  </option>
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.code}] {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nível 3: Subgrupo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-mono">
                      3
                    </span>
                    <span>Subgrupo de Itens</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!wizardGroupId) {
                        showFeedback('Selecione primeiro um Grupo para criar um Subgrupo.', true);
                        return;
                      }
                      setNewSubgroupGroupId(wizardGroupId);
                      setShowCreateSubgroupModal(true);
                    }}
                    className="text-[11px] text-[#E30613] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Novo Subgrupo</span>
                  </button>
                </div>
                <select
                  value={wizardSubgroupId}
                  disabled={!wizardGroupId}
                  onChange={(e) => setWizardSubgroupId(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-medium text-neutral-900 disabled:opacity-50 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                >
                  <option value="">
                    {wizardGroupId ? '-- Selecione o Subgrupo --' : '-- Aguardando Grupo --'}
                  </option>
                  {availableSubgroups.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview do Caminho Hierárquico */}
              {wizardSubgroupId && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                    Caminho Hierárquico Vinculado
                  </div>
                  <div className="mt-1 flex items-center flex-wrap gap-1 text-neutral-800 font-medium">
                    <span>{database.types.find((t) => t.id === wizardTypeId)?.name}</span>
                    <ChevronRight className="w-3 h-3 text-neutral-400" />
                    <span>{database.groups.find((g) => g.id === wizardGroupId)?.name}</span>
                    <ChevronRight className="w-3 h-3 text-neutral-400" />
                    <span className="text-[#E30613] font-bold">
                      {database.subgroups.find((s) => s.id === wizardSubgroupId)?.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Formulário de Cadastro do Artigo */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleCreateArticle}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#E30613]" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    2. Dados do Artigo (Item de Inventário)
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  Código Sugerido: <span className="font-bold text-neutral-900">{generateArticleCode(database.articles)}</span>
                </div>
              </div>

              {/* Linha 1: Código e Nome */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Código Único
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={articleCode}
                      onChange={(e) => setArticleCode(e.target.value)}
                      placeholder={generateArticleCode(database.articles)}
                      className="w-full text-xs font-mono uppercase bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                    />
                    <Hash className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-3" />
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    Vazio = gerado automaticamente
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Descrição Completa do Artigo *
                  </label>
                  <input
                    type="text"
                    required
                    value={articleName}
                    onChange={(e) => setArticleName(e.target.value)}
                    placeholder="Ex: Barra Redonda Trefilada Aço 1020 Ø 1/2'' x 3000mm"
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Linha 2: Unidade de Medida, Estoque Mínimo, Estoque Máximo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Unidade de Medida (UN)
                  </label>
                  <select
                    value={articleUnit}
                    onChange={(e) => setArticleUnit(e.target.value)}
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="M">M - Metro Linear</option>
                    <option value="L">L - Litro</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="BARRA">BARRA - Barra Industrial</option>
                    <option value="ROLO">ROLO - Rolo</option>
                    <option value="PAR">PAR - Par (EPI / Calçado)</option>
                    <option value="JOGO">JOGO - Jogo / Conjunto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={articleMinStock}
                    onChange={(e) => setArticleMinStock(Number(e.target.value))}
                    className="w-full text-xs font-mono bg-white border border-neutral-300 rounded-lg p-2.5 tabular-nums text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Gera alerta de compra
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Estoque Máximo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={articleMaxStock}
                    onChange={(e) => setArticleMaxStock(Number(e.target.value))}
                    className="w-full text-xs font-mono bg-white border border-neutral-300 rounded-lg p-2.5 tabular-nums text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Capacidade ideal de estocagem
                  </span>
                </div>
              </div>

              {/* Linha 3: Localização de Armazenamento e Custo Unitário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Endereço de Armazenamento / Localização
                  </label>
                  <select
                    value={articleLocationId}
                    onChange={(e) => setArticleLocationId(e.target.value)}
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  >
                    <option value="">-- Padrão (Almoxarifado Central) --</option>
                    {database.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        [{loc.code}] {loc.name} ({loc.building})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={articleUnitCost}
                    onChange={(e) => setArticleUnitCost(Number(e.target.value))}
                    className="w-full text-xs font-mono bg-white border border-neutral-300 rounded-lg p-2.5 tabular-nums text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Linha 4: Saldo Inicial Opcional e Código de Barras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Saldo Inicial em Estoque (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={articleInitialStock}
                    onChange={(e) => setArticleInitialStock(Number(e.target.value))}
                    className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 tabular-nums font-bold text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Se &gt; 0, registra entrada inicial de inventário
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Código de Barras / SKU Secundário
                  </label>
                  <input
                    type="text"
                    value={articleBarcode}
                    onChange={(e) => setArticleBarcode(e.target.value)}
                    placeholder="Ex: 7891234567890"
                    className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!wizardSubgroupId}
                  className="px-5 py-2.5 bg-[#E30613] hover:bg-[#C0040F] disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Artigo no Estoque</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 2: LISTAGEM E GESTÃO DE TIPOS */}
      {/* ==================================================================== */}
      {activeSubTab === 'types' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Tipos de Materiais (Nível 1)
              </h3>
              <p className="text-xs text-neutral-500">
                Categorias macro do almoxarifado (ex: Matéria-Prima, EPI, Ferramentas).
              </p>
            </div>
            <button
              onClick={() => setShowCreateTypeModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Tipo</span>
            </button>
          </div>

          {database.types.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Folder className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhum Tipo cadastrado.</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Crie o primeiro Tipo para estruturar sua árvore de inventário.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="py-2.5 px-3 font-mono">Código</th>
                    <th className="py-2.5 px-3">Nome do Tipo</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-center">Grupos Vinculados</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {database.types.map((type) => {
                    const groupsCount = database.groups.filter((g) => g.typeId === type.id).length;
                    return (
                      <tr key={type.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                          {type.code}
                        </td>
                        <td className="py-3 px-3 font-bold text-neutral-900">{type.name}</td>
                        <td className="py-3 px-3 text-neutral-600">{type.description || '—'}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold tabular-nums text-neutral-800">
                          {groupsCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteType(type.id)}
                            className="p-1.5 text-neutral-400 hover:text-[#E30613] rounded-md transition-colors"
                            title="Excluir Tipo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 3: LISTAGEM E GESTÃO DE GRUPOS */}
      {/* ==================================================================== */}
      {activeSubTab === 'groups' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Grupos de Materiais (Nível 2)</h3>
              <p className="text-xs text-neutral-500">
                Segmentação intermediária vinculada a um Tipo (ex: Metais Ferrosos, Proteção Respiratória).
              </p>
            </div>
            <button
              onClick={() => {
                if (database.types.length === 0) {
                  showFeedback('Cadastre pelo menos um Tipo antes de criar um Grupo.', true);
                  return;
                }
                setNewGroupTypeId(database.types[0].id);
                setShowCreateGroupModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Grupo</span>
            </button>
          </div>

          {database.groups.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Folder className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhum Grupo cadastrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="py-2.5 px-3 font-mono">Código</th>
                    <th className="py-2.5 px-3">Tipo Vinculado</th>
                    <th className="py-2.5 px-3">Nome do Grupo</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-center">Subgrupos</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {database.groups.map((grp) => {
                    const parentType = database.types.find((t) => t.id === grp.typeId);
                    const subCount = database.subgroups.filter((s) => s.groupId === grp.id).length;

                    return (
                      <tr key={grp.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                          {grp.code}
                        </td>
                        <td className="py-3 px-3 text-neutral-700">
                          {parentType ? `${parentType.name} (${parentType.code})` : '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-neutral-900">{grp.name}</td>
                        <td className="py-3 px-3 text-neutral-600">{grp.description || '—'}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold tabular-nums text-neutral-800">
                          {subCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteGroup(grp.id)}
                            className="p-1.5 text-neutral-400 hover:text-[#E30613] rounded-md transition-colors"
                            title="Excluir Grupo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 4: LISTAGEM E GESTÃO DE SUBGRUPOS */}
      {/* ==================================================================== */}
      {activeSubTab === 'subgroups' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Subgrupos de Materiais (Nível 3)
              </h3>
              <p className="text-xs text-neutral-500">
                Classificação específica vinculada a um Grupo (ex: Barras de Aço 1020, Máscaras de Solda).
              </p>
            </div>
            <button
              onClick={() => {
                if (database.groups.length === 0) {
                  showFeedback('Cadastre pelo menos um Grupo antes de criar um Subgrupo.', true);
                  return;
                }
                setNewSubgroupGroupId(database.groups[0].id);
                setShowCreateSubgroupModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Subgrupo</span>
            </button>
          </div>

          {database.subgroups.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Folder className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhum Subgrupo cadastrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="py-2.5 px-3 font-mono">Código</th>
                    <th className="py-2.5 px-3">Grupo Vinculado</th>
                    <th className="py-2.5 px-3">Nome do Subgrupo</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-center">Artigos Cadastrados</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {database.subgroups.map((sub) => {
                    const parentGroup = database.groups.find((g) => g.id === sub.groupId);
                    const artCount = database.articles.filter((a) => a.subgroupId === sub.id).length;

                    return (
                      <tr key={sub.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                          {sub.code}
                        </td>
                        <td className="py-3 px-3 text-neutral-700">
                          {parentGroup ? `${parentGroup.name} (${parentGroup.code})` : '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-neutral-900">{sub.name}</td>
                        <td className="py-3 px-3 text-neutral-600">{sub.description || '—'}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold tabular-nums text-neutral-800">
                          {artCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteSubgroup(sub.id)}
                            className="p-1.5 text-neutral-400 hover:text-[#E30613] rounded-md transition-colors"
                            title="Excluir Subgrupo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 5: LISTAGEM DE ARTIGOS */}
      {/* ==================================================================== */}
      {activeSubTab === 'articles' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Catálogo de Artigos (Nível 4 - Itens de Estoque)
              </h3>
              <p className="text-xs text-neutral-500">
                Lista de todos os artigos com localização física e saldo atual.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar artigo ou código..."
                  className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg pl-8 pr-3 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              </div>

              <button
                onClick={() => setActiveSubTab('wizard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Novo Artigo</span>
              </button>
            </div>
          </div>

          {database.articles.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhum Artigo cadastrado.</p>
              <button
                onClick={() => setActiveSubTab('wizard')}
                className="mt-3 text-xs text-[#E30613] font-bold hover:underline"
              >
                Abrir Assistente de Cadastro &rarr;
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="py-2.5 px-3 font-mono">Código</th>
                    <th className="py-2.5 px-3">Descrição do Artigo</th>
                    <th className="py-2.5 px-3">Hierarquia (Subgrupo)</th>
                    <th className="py-2.5 px-3">Localização</th>
                    <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                    <th className="py-2.5 px-3 text-right">Est. Mínimo</th>
                    <th className="py-2.5 px-3 text-right">Custo Unit.</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {database.articles
                    .filter(
                      (a) =>
                        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.code.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((article) => {
                      const sub = database.subgroups.find((s) => s.id === article.subgroupId);
                      const loc = database.locations.find((l) => l.id === article.defaultLocationId);
                      const isLow = article.currentStock <= article.minStock;

                      return (
                        <tr key={article.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                            {article.code}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-neutral-900">{article.name}</div>
                            {article.description && (
                              <div className="text-[11px] text-neutral-500 truncate max-w-xs">
                                {article.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-neutral-600">
                            {sub ? sub.name : '—'}
                          </td>
                          <td className="py-3 px-3 text-neutral-700">
                            {loc ? `${loc.code} · ${loc.name}` : 'Almoxarifado Central'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                            <span className={isLow ? 'text-[#E30613]' : 'text-neutral-900'}>
                              {article.currentStock} {article.unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-500">
                            {article.minStock} {article.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-800">
                            R$ {article.unitCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-1.5 text-neutral-400 hover:text-[#E30613] rounded-md transition-colors"
                              title="Excluir Artigo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: NOVO TIPO */}
      {/* ==================================================================== */}
      {showCreateTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Cadastrar Novo Tipo (Nível 1)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Código gerado automaticamente: <span className="font-mono font-bold text-[#E30613]">{generateTypeCode(database.types)}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Nome do Tipo *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Ex: Matéria-Prima, EPI, Ferramentas"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Descrição / Finalidade
                </label>
                <textarea
                  rows={2}
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  placeholder="Ex: Materiais brutos e insumos para aulas de usinagem"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateTypeModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateType}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Salvar Tipo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: NOVO GRUPO */}
      {/* ==================================================================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Cadastrar Novo Grupo (Nível 2)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Vinculado a um Tipo existente com código hierárquico sequencial.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tipo Pai *
                </label>
                <select
                  value={newGroupTypeId}
                  onChange={(e) => setNewGroupTypeId(e.target.value)}
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                >
                  <option value="">-- Selecione o Tipo --</option>
                  {database.types.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Nome do Grupo *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Metais Ferrosos, Proteção Respiratória"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Ex: Barras laminadas e trefiladas em aço carbono"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Salvar Grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: NOVO SUBGRUPO */}
      {/* ==================================================================== */}
      {showCreateSubgroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Cadastrar Novo Subgrupo (Nível 3)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Vinculado a um Grupo existente com geração de código subordinado.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Grupo Pai *
                </label>
                <select
                  value={newSubgroupGroupId}
                  onChange={(e) => setNewSubgroupGroupId(e.target.value)}
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                >
                  <option value="">-- Selecione o Grupo --</option>
                  {database.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.code}] {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Nome do Subgrupo *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newSubgroupName}
                  onChange={(e) => setNewSubgroupName(e.target.value)}
                  placeholder="Ex: Barras Redondas Aço 1020, Óculos Antirrisco"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={newSubgroupDesc}
                  onChange={(e) => setNewSubgroupDesc(e.target.value)}
                  placeholder="Ex: Barras de 3 metros para corte e torneamento"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateSubgroupModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateSubgroup}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Salvar Subgrupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
