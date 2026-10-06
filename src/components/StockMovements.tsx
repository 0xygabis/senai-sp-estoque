/**
 * Gestão de Estoque e Movimentações - SENAI-SP SIGE
 * Registrar Entrada e Saída de Materiais com rastreamento de localização e saldo em tempo real.
 * Responsável Técnica: Gabriela Cares
 */

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  Warehouse,
  User,
  DollarSign,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  Article,
  DatabaseState,
  DocumentType,
  MovementType,
  StockMovement,
  StorageLocation,
} from '../types/inventory';
import { generateLocationCode } from '../services/storage';

interface StockMovementsProps {
  database: DatabaseState;
  onUpdateDatabase: (updater: (prev: DatabaseState) => DatabaseState) => void;
  initialMovementType?: MovementType;
  initialArticleId?: string;
}

export const StockMovements: React.FC<StockMovementsProps> = ({
  database,
  onUpdateDatabase,
  initialMovementType = 'ENTRADA',
  initialArticleId = '',
}) => {
  const [activeTab, setActiveTab] = useState<'ENTRADA' | 'SAIDA' | 'HISTORICO'>(
    initialMovementType === 'SAIDA' ? 'SAIDA' : 'ENTRADA'
  );

  // Estados do Formulário de Movimentação
  const [selectedArticleId, setSelectedArticleId] = useState<string>(initialArticleId);
  const [quantity, setQuantity] = useState<number>(1);
  const [locationId, setLocationId] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType>('NF');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [requesterOrOrigin, setRequesterOrOrigin] = useState<string>('');
  const [operator, setOperator] = useState<string>('Carlos Almoxarife');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Filtros do Histórico
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [historyArticleFilter, setHistoryArticleFilter] = useState<string>('TODOS');

  // Feedback
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const showFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback(null), 4500);
  };

  const selectedArticle = database.articles.find((a) => a.id === selectedArticleId);

  // Atualiza custos e localização padrão quando o artigo é selecionado
  const handleArticleChange = (artId: string) => {
    setSelectedArticleId(artId);
    const art = database.articles.find((a) => a.id === artId);
    if (art) {
      setUnitCost(art.unitCost || 0);
      setLocationId(art.defaultLocationId || (database.locations[0]?.id ?? ''));
    }
  };

  // --------------------------------------------------------------------------
  // Processamento de Entrada
  // --------------------------------------------------------------------------
  const handleRegisterEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) {
      showFeedback('Selecione o Artigo para registrar a entrada.', true);
      return;
    }
    if (quantity <= 0) {
      showFeedback('A quantidade de entrada deve ser maior que zero.', true);
      return;
    }

    let targetLocId = locationId;
    let nextLocations = [...database.locations];

    // Se nenhuma localização existir, cria uma padrão
    if (!targetLocId) {
      if (database.locations.length > 0) {
        targetLocId = database.locations[0].id;
      } else {
        const autoLocCode = generateLocationCode(database.locations);
        const newLoc: StorageLocation = {
          id: `loc_${Date.now()}`,
          code: autoLocCode,
          name: 'Almoxarifado Central SENAI-SP',
          building: 'Bloco Principal',
          aisle: 'Rua A',
          shelf: 'Estante 01',
          level: 'Nível 1',
          createdAt: new Date().toISOString(),
        };
        nextLocations.push(newLoc);
        targetLocId = newLoc.id;
      }
    }

    const previousStock = selectedArticle.currentStock;
    const newStock = previousStock + Number(quantity);
    const itemCost = Number(unitCost) || selectedArticle.unitCost || 0;
    const totalCost = itemCost * Number(quantity);

    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      articleId: selectedArticle.id,
      type: 'ENTRADA',
      quantity: Number(quantity),
      previousStock,
      newStock,
      unitCost: itemCost,
      totalCost,
      locationId: targetLocId,
      documentType,
      documentNumber: documentNumber.trim() || 'S/N',
      reason: reason.trim() || 'Recebimento de materiais em estoque',
      requesterOrOrigin: requesterOrOrigin.trim() || 'Fornecedor Externo',
      operator: operator.trim() || 'Almoxarife Responsável',
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase((prev) => ({
      ...prev,
      locations: nextLocations,
      articles: prev.articles.map((art) =>
        art.id === selectedArticle.id
          ? {
              ...art,
              currentStock: newStock,
              unitCost: itemCost > 0 ? itemCost : art.unitCost,
              defaultLocationId: targetLocId,
              updatedAt: new Date().toISOString(),
            }
          : art
      ),
      movements: [movement, ...prev.movements],
    }));

    // Reset campos de transação
    setQuantity(1);
    setDocumentNumber('');
    setReason('');
    setNotes('');
    showFeedback(
      `Entrada de ${quantity} ${selectedArticle.unit} registrada com sucesso! Novo saldo: ${newStock} ${selectedArticle.unit}.`
    );
  };

  // --------------------------------------------------------------------------
  // Processamento de Saída (com validação estrita de saldo)
  // --------------------------------------------------------------------------
  const handleRegisterSaida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) {
      showFeedback('Selecione o Artigo para registrar a saída.', true);
      return;
    }
    if (quantity <= 0) {
      showFeedback('A quantidade de saída deve ser maior que zero.', true);
      return;
    }
    if (quantity > selectedArticle.currentStock) {
      showFeedback(
        `Saldo insuficiente! Saldo atual é de apenas ${selectedArticle.currentStock} ${selectedArticle.unit}. A saída de ${quantity} ${selectedArticle.unit} foi bloqueada para evitar estoque negativo.`,
        true
      );
      return;
    }

    const previousStock = selectedArticle.currentStock;
    const newStock = previousStock - Number(quantity);
    const itemCost = selectedArticle.unitCost || 0;
    const totalCost = itemCost * Number(quantity);
    const targetLocId = locationId || selectedArticle.defaultLocationId;

    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      articleId: selectedArticle.id,
      type: 'SAIDA',
      quantity: Number(quantity),
      previousStock,
      newStock,
      unitCost: itemCost,
      totalCost,
      locationId: targetLocId,
      documentType,
      documentNumber: documentNumber.trim() || 'REQ-INTERNA',
      reason: reason.trim() || 'Consumo em aula prática ou manutenção',
      requesterOrOrigin: requesterOrOrigin.trim() || 'Oficina Técnica SENAI',
      operator: operator.trim() || 'Almoxarife Responsável',
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    };

    onUpdateDatabase((prev) => ({
      ...prev,
      articles: prev.articles.map((art) =>
        art.id === selectedArticle.id
          ? {
              ...art,
              currentStock: newStock,
              updatedAt: new Date().toISOString(),
            }
          : art
      ),
      movements: [movement, ...prev.movements],
    }));

    // Reset campos de transação
    setQuantity(1);
    setDocumentNumber('');
    setReason('');
    setNotes('');
    showFeedback(
      `Saída de ${quantity} ${selectedArticle.unit} efetuada com sucesso! Saldo restante: ${newStock} ${selectedArticle.unit}.`
    );
  };

  // --------------------------------------------------------------------------
  // Filtros da Tabela de Histórico
  // --------------------------------------------------------------------------
  const filteredMovements = database.movements.filter((mov) => {
    if (historyTypeFilter !== 'TODOS' && mov.type !== historyTypeFilter) return false;
    if (historyArticleFilter !== 'TODOS' && mov.articleId !== historyArticleFilter) return false;

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const article = database.articles.find((a) => a.id === mov.articleId);
      const matchesDoc = mov.documentNumber.toLowerCase().includes(q);
      const matchesReason = mov.reason.toLowerCase().includes(q);
      const matchesOrigin = mov.requesterOrOrigin.toLowerCase().includes(q);
      const matchesArticle =
        article && (article.name.toLowerCase().includes(q) || article.code.toLowerCase().includes(q));

      return matchesDoc || matchesReason || matchesOrigin || matchesArticle;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Abas de Navegação Operacional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#E30613]" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Movimentações de Estoque & Almoxarifado
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Registro com rastreamento de localização física, validação de saldo e auditoria de documentos.
          </p>
        </div>

        {/* Abas Operacionais */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0">
          <button
            onClick={() => {
              setActiveTab('ENTRADA');
              setDocumentType('NF');
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'ENTRADA'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registrar Entrada</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('SAIDA');
              setDocumentType('REQUISICAO');
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'SAIDA'
                ? 'bg-[#E30613] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-white" />
            <span>Registrar Saída</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORICO')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'HISTORICO'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-neutral-600" />
            <span>Histórico ({database.movements.length})</span>
          </button>
        </div>
      </div>

      {/* Alerta de Notificação */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all ${
            feedback.error
              ? 'bg-red-50 text-[#E30613] border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {feedback.error ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA DE ENTRADA OU SAÍDA */}
      {/* ==================================================================== */}
      {activeTab !== 'HISTORICO' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Resumo do Artigo Selecionado */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Status do Artigo Selecionado
              </div>

              {selectedArticle ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#E30613] bg-red-50 px-2 py-0.5 rounded-sm">
                      {selectedArticle.code}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900 mt-1.5">
                      {selectedArticle.name}
                    </h4>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Saldo Atual em Estoque:</span>
                      <span className="font-mono font-bold tabular-nums text-neutral-900">
                        {selectedArticle.currentStock} {selectedArticle.unit}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Estoque Mínimo:</span>
                      <span className="font-mono tabular-nums text-neutral-600">
                        {selectedArticle.minStock} {selectedArticle.unit}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Custo Médio Unitário:</span>
                      <span className="font-mono tabular-nums text-neutral-800">
                        R$ {selectedArticle.unitCost.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs pt-1 border-t border-neutral-200">
                      <span className="text-neutral-500">Localização Padrão:</span>
                      <span className="font-medium text-neutral-900 truncate max-w-[150px]">
                        {database.locations.find((l) => l.id === selectedArticle.defaultLocationId)?.code ||
                          'Almoxarifado Central'}
                      </span>
                    </div>
                  </div>

                  {/* Previsão pós movimentação */}
                  {quantity > 0 && (
                    <div
                      className={`p-3 rounded-lg border text-xs font-medium ${
                        activeTab === 'ENTRADA'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : selectedArticle.currentStock - quantity < 0
                          ? 'bg-red-50 text-[#E30613] border-red-200'
                          : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Previsão de Saldo Final:</span>
                        <span className="font-mono font-bold tabular-nums">
                          {activeTab === 'ENTRADA'
                            ? selectedArticle.currentStock + Number(quantity)
                            : selectedArticle.currentStock - Number(quantity)}{' '}
                          {selectedArticle.unit}
                        </span>
                      </div>
                      {activeTab === 'SAIDA' && selectedArticle.currentStock - quantity < 0 && (
                        <div className="mt-1 text-[11px] font-bold text-[#E30613]">
                          Atenção: Quantidade solicitada excede o saldo físico!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  Selecione um artigo no formulário ao lado para carregar dados de saldo e localização.
                </div>
              )}
            </div>
          </div>

          {/* Formulário Principal de Movimentação */}
          <div className="lg:col-span-8">
            <form
              onSubmit={activeTab === 'ENTRADA' ? handleRegisterEntrada : handleRegisterSaida}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  {activeTab === 'ENTRADA' ? (
                    <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-[#E30613]" />
                  )}
                  <h3 className="text-sm font-bold text-neutral-900">
                    {activeTab === 'ENTRADA'
                      ? 'Registro de Entrada de Materiais (Recebimento / Almoxarifado)'
                      : 'Registro de Saída de Materiais (Baixa para Produção / Didática)'}
                  </h3>
                </div>
              </div>

              {/* Linha 1: Seleção do Artigo */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Artigo a Movimentar *
                </label>
                <select
                  required
                  value={selectedArticleId}
                  onChange={(e) => handleArticleChange(e.target.value)}
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 font-medium text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                >
                  <option value="">-- Selecione o Artigo do Estoque --</option>
                  {database.articles.map((art) => (
                    <option key={art.id} value={art.id}>
                      [{art.code}] {art.name} (Saldo: {art.currentStock} {art.unit})
                    </option>
                  ))}
                </select>
                {database.articles.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Nenhum artigo cadastrado no banco. Vá até a aba "Cadastro Hierárquico" primeiro.
                  </p>
                )}
              </div>

              {/* Linha 2: Quantidade e Localização de Armazenamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Quantidade a {activeTab === 'ENTRADA' ? 'Entrar' : 'Dar Baixa'} *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-white border border-neutral-300 rounded-lg p-2.5 tabular-nums text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                    />
                    <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-3 py-2.5 rounded-lg border border-neutral-200 shrink-0">
                      {selectedArticle?.unit || 'UN'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Localização de Armazenamento *
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  >
                    <option value="">-- Localização Padrão --</option>
                    {database.locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        [{loc.code}] {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 3: Documento de Suporte e Número */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 font-medium text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  >
                    <option value="NF">Nota Fiscal (NF)</option>
                    <option value="REQUISICAO">Requisição Interna (REQ)</option>
                    <option value="ORDEM_SERVICO">Ordem de Serviço (OS)</option>
                    <option value="TRANSFERENCIA">Transferência entre Unidades</option>
                    <option value="INVENTARIO">Ajuste de Inventário</option>
                    <option value="OUTRO">Outro Comprovante</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Número do Documento / Comprovante
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder={activeTab === 'ENTRADA' ? 'Ex: NF-108293' : 'Ex: REQ-2026/012'}
                    className="w-full text-xs font-mono uppercase bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    {activeTab === 'ENTRADA' ? 'Fornecedor / Origem' : 'Destino / Setor Solicitante *'}
                  </label>
                  <input
                    type="text"
                    required={activeTab === 'SAIDA'}
                    value={requesterOrOrigin}
                    onChange={(e) => setRequesterOrOrigin(e.target.value)}
                    placeholder={
                      activeTab === 'ENTRADA'
                        ? 'Ex: Gerdau Aços S.A.'
                        : 'Ex: Oficina de Torneamento - Turma 01'
                    }
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Linha 4: Motivo da Movimentação e Operador */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Motivo / Aplicação *
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      activeTab === 'ENTRADA'
                        ? 'Ex: Reposição de estoque para início do semestre letivo'
                        : 'Ex: Aula Prática de Usinagem CNC - Fabricação de Eixos'
                    }
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Operador / Almoxarife *
                  </label>
                  <input
                    type="text"
                    required
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    placeholder="Ex: Almoxarife Carlos"
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Linha 5: Custo Unitário (se for entrada) e Observações */}
              {activeTab === 'ENTRADA' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-100">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Custo Unitário da NF (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      className="w-full text-xs font-mono bg-white border border-neutral-300 rounded-lg p-2.5 tabular-nums text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Valor Total da Entrada
                    </label>
                    <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-xs font-bold text-neutral-900">
                      R$ {(quantity * unitCost).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Confirmação */}
              <div className="pt-3 flex items-center justify-between border-t border-neutral-100">
                <span className="text-[11px] text-neutral-500">
                  Operação auditada · Atualiza saldo e ficha Kardex imediatamente
                </span>

                <button
                  type="submit"
                  disabled={!selectedArticleId || (activeTab === 'SAIDA' && selectedArticle ? quantity > selectedArticle.currentStock : false)}
                  className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 ${
                    activeTab === 'ENTRADA'
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-40'
                      : 'bg-[#E30613] hover:bg-[#C0040F] text-white disabled:opacity-40'
                  }`}
                >
                  {activeTab === 'ENTRADA' ? (
                    <>
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      <span>Confirmar Entrada no Estoque</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-white" />
                      <span>Confirmar Saída do Estoque</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA DE HISTÓRICO GERAL (LIVRO KARDEX COMPLETO) */}
      {/* ==================================================================== */}
      {activeTab === 'HISTORICO' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Livro Kardex · Registro Geral de Movimentações
              </h3>
              <p className="text-xs text-neutral-500">
                Histórico imutável de todas as entradas e saídas de materiais no almoxarifado.
              </p>
            </div>

            {/* Filtros em linha */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filtrar por doc, motivo ou artigo..."
                  className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg pl-8 pr-3 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden w-52 sm:w-64"
                />
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
              >
                <option value="TODOS">Todas Movimentações</option>
                <option value="ENTRADA">Apenas Entradas</option>
                <option value="SAIDA">Apenas Saídas</option>
              </select>

              <select
                value={historyArticleFilter}
                onChange={(e) => setHistoryArticleFilter(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden max-w-44 truncate"
              >
                <option value="TODOS">Todos os Artigos</option>
                {database.articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.code}] {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhum registro de movimentação encontrado.</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Utilize as abas acima para registrar a primeira entrada ou saída de materiais.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Artigo</th>
                    <th className="py-2.5 px-3 text-right">Qtd Movimentada</th>
                    <th className="py-2.5 px-3 text-right font-mono">Saldo Anterior &rarr; Novo</th>
                    <th className="py-2.5 px-3">Localização</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3">Destino / Origem</th>
                    <th className="py-2.5 px-3">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredMovements.map((mov) => {
                    const article = database.articles.find((a) => a.id === mov.articleId);
                    const loc = database.locations.find((l) => l.id === mov.locationId);
                    const isEntrada = mov.type === 'ENTRADA';

                    return (
                      <tr key={mov.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono text-neutral-500 whitespace-nowrap">
                          {new Date(mov.timestamp).toLocaleDateString('pt-BR')}{' '}
                          <span className="text-[11px] text-neutral-400">
                            {new Date(mov.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-sm ${
                              isEntrada
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-[#E30613] border border-red-200'
                            }`}
                          >
                            {isEntrada ? '+' : '-'} {mov.type}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-neutral-900 font-mono text-[11px]">
                            {article?.code || 'ART'}
                          </div>
                          <div className="text-neutral-700 font-medium truncate max-w-xs text-[11px]">
                            {article?.name || 'Artigo'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                          <span className={isEntrada ? 'text-emerald-700' : 'text-[#E30613]'}>
                            {isEntrada ? '+' : '-'}
                            {mov.quantity} {article?.unit || 'UN'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap text-neutral-600">
                          {mov.previousStock} &rarr; <span className="font-bold text-neutral-900">{mov.newStock}</span>
                        </td>
                        <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">
                          {loc ? loc.code : 'Almoxarifado'}
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-700 whitespace-nowrap">
                          {mov.documentNumber}
                        </td>
                        <td className="py-3 px-3 text-neutral-600 truncate max-w-xs">
                          {mov.requesterOrOrigin}
                        </td>
                        <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                          {mov.operator}
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
    </div>
  );
};
