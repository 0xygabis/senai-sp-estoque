/**
 * Posição Atual do Estoque em Tempo Real & Ficha Kardex - SENAI-SP SIGE
 * Consulta de saldos, localizações físicas, status de reposição e histórico individual.
 * Responsável Técnica: Gabriela Cares
 */

import React, { useState } from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  MapPin,
  X,
  Printer,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { Article, DatabaseState } from '../types/inventory';

interface StockPositionProps {
  database: DatabaseState;
  onOpenQuickMovement: (type: 'ENTRADA' | 'SAIDA', articleId?: string) => void;
}

export const StockPosition: React.FC<StockPositionProps> = ({
  database,
  onOpenQuickMovement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'CRITICO' | 'ZERADO' | 'NORMAL'>('TODOS');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');

  // Modal de Ficha Kardex Individual
  const [kardexArticle, setKardexArticle] = useState<Article | null>(null);

  // Filtragem dos Artigos
  const filteredArticles = database.articles.filter((art) => {
    // Filtro por status
    const isZero = art.currentStock <= 0;
    const isCritical = art.currentStock <= art.minStock && !isZero;

    if (statusFilter === 'ZERADO' && !isZero) return false;
    if (statusFilter === 'CRITICO' && !isCritical) return false;
    if (statusFilter === 'NORMAL' && (isZero || isCritical)) return false;

    // Filtro por Tipo hierárquico
    if (typeFilter !== 'TODOS') {
      const sub = database.subgroups.find((s) => s.id === art.subgroupId);
      const grp = sub ? database.groups.find((g) => g.id === sub.groupId) : null;
      if (!grp || grp.typeId !== typeFilter) return false;
    }

    // Busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const loc = database.locations.find((l) => l.id === art.defaultLocationId);
      const matchesCode = art.code.toLowerCase().includes(q);
      const matchesName = art.name.toLowerCase().includes(q);
      const matchesLoc = loc && loc.name.toLowerCase().includes(q);
      const matchesBarcode = art.barcode && art.barcode.toLowerCase().includes(q);

      return matchesCode || matchesName || matchesLoc || matchesBarcode;
    }

    return true;
  });

  // Movimentações do artigo selecionado na Ficha Kardex
  const articleMovements = kardexArticle
    ? database.movements
        .filter((m) => m.articleId === kardexArticle.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Posição */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#E30613]" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Posição do Estoque em Tempo Real
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Consulta consolidada de saldos físicos, localizações no almoxarifado e ficha Kardex individual.
          </p>
        </div>

        {/* Controles de Busca e Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, artigo ou localização..."
              className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg pl-8 pr-3 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden w-64"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="CRITICO">Ponto de Reposição (Crítico)</option>
            <option value="ZERADO">Estoque Zerado</option>
            <option value="NORMAL">Estoque Normal</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden max-w-44 truncate"
          >
            <option value="TODOS">Todos os Tipos</option>
            {database.types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Posição de Estoque */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
        {filteredArticles.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <Boxes className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-xs font-medium">Nenhum artigo encontrado para os filtros selecionados.</p>
            {database.articles.length === 0 && (
              <p className="text-[11px] text-neutral-400 mt-0.5">
                O banco de dados está vazio. Cadastre artigos para acompanhar a posição física.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                  <th className="py-2.5 px-3 font-mono">Código</th>
                  <th className="py-2.5 px-3">Descrição do Artigo</th>
                  <th className="py-2.5 px-3">Classificação Hierárquica</th>
                  <th className="py-2.5 px-3">Localização Física</th>
                  <th className="py-2.5 px-3 text-right">Saldo Físico</th>
                  <th className="py-2.5 px-3 text-right">Est. Mínimo</th>
                  <th className="py-2.5 px-3 text-right">Custo Médio</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredArticles.map((art) => {
                  const sub = database.subgroups.find((s) => s.id === art.subgroupId);
                  const grp = sub ? database.groups.find((g) => g.id === sub.groupId) : null;
                  const type = grp ? database.types.find((t) => t.id === grp.typeId) : null;
                  const loc = database.locations.find((l) => l.id === art.defaultLocationId);

                  const isZero = art.currentStock <= 0;
                  const isCritical = art.currentStock <= art.minStock && !isZero;
                  const totalValue = (art.currentStock || 0) * (art.unitCost || 0);

                  return (
                    <tr key={art.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {art.code}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900 leading-snug">{art.name}</div>
                        {art.barcode && (
                          <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                            SKU/EAN: {art.barcode}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-neutral-600">
                        <div className="text-[11px] truncate max-w-xs font-medium">
                          {type?.name || 'Tipo'} &rarr; {grp?.name || 'Grupo'} &rarr;{' '}
                          <span className="text-neutral-900 font-semibold">{sub?.name || 'Subgrupo'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{loc ? `${loc.code} · ${loc.shelf}` : 'Almoxarifado Central'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isZero
                              ? 'text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded-sm'
                              : isCritical
                              ? 'text-[#E30613] bg-red-50 px-1.5 py-0.5 rounded-sm'
                              : 'text-neutral-900'
                          }
                        >
                          {art.currentStock} {art.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-500 whitespace-nowrap">
                        {art.minStock} {art.unit}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700 whitespace-nowrap">
                        {formatCurrency(art.unitCost)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-neutral-900 whitespace-nowrap">
                        {formatCurrency(totalValue)}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isZero ? (
                          <span className="text-[10px] font-bold text-neutral-900 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-xs">
                            ZERADO
                          </span>
                        ) : isCritical ? (
                          <span className="text-[10px] font-bold text-[#E30613] bg-red-50 border border-red-200 px-2 py-0.5 rounded-xs">
                            CRÍTICO
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                            NORMAL
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setKardexArticle(art)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                            title="Ver Ficha Kardex"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenQuickMovement('ENTRADA', art.id)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Entrada deste item"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenQuickMovement('SAIDA', art.id)}
                            disabled={art.currentStock <= 0}
                            className="p-1.5 text-[#E30613] hover:text-[#C0040F] hover:bg-red-50 disabled:opacity-30 rounded-md transition-colors"
                            title="Saída deste item"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL DE FICHA KARDEX INDIVIDUAL */}
      {/* ==================================================================== */}
      {kardexArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-neutral-200 max-h-[90vh] flex flex-col">
            {/* Cabeçalho da Ficha Kardex */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-200 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E30613] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs">
                    SENAI-SP · FICHA KARDEX
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    {kardexArticle.code}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 mt-1">
                  {kardexArticle.name}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                  <span>Saldo Físico Atual: <strong className="font-mono text-neutral-900">{kardexArticle.currentStock} {kardexArticle.unit}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Estoque Mínimo: <strong className="font-mono text-neutral-900">{kardexArticle.minStock} {kardexArticle.unit}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Custo Médio: <strong className="font-mono text-neutral-900">{formatCurrency(kardexArticle.unitCost)}</strong></span>
                </div>
              </div>

              <button
                onClick={() => setKardexArticle(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo: Extrato Cronológico de Movimentações */}
            <div className="mt-4 overflow-y-auto flex-1 pr-1">
              {articleMovements.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-xs">
                  Nenhuma movimentação registrada para este artigo no livro Kardex.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                      <th className="py-2.5 px-3">Data / Hora</th>
                      <th className="py-2.5 px-3">Operação</th>
                      <th className="py-2.5 px-3">Documento</th>
                      <th className="py-2.5 px-3">Origem / Destino</th>
                      <th className="py-2.5 px-3 text-right">Qtd</th>
                      <th className="py-2.5 px-3 text-right font-mono">Saldo Anterior</th>
                      <th className="py-2.5 px-3 text-right font-mono font-bold">Saldo Novo</th>
                      <th className="py-2.5 px-3">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {articleMovements.map((mov) => {
                      const isEntrada = mov.type === 'ENTRADA';
                      return (
                        <tr key={mov.id} className="hover:bg-neutral-50/70">
                          <td className="py-2.5 px-3 font-mono text-neutral-500 whitespace-nowrap">
                            {new Date(mov.timestamp).toLocaleDateString('pt-BR')}{' '}
                            <span className="text-[10px]">
                              {new Date(mov.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`font-bold text-[10px] px-1.5 py-0.5 rounded-xs ${
                                isEntrada
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-red-50 text-[#E30613] border border-red-200'
                              }`}
                            >
                              {mov.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-700 whitespace-nowrap">
                            {mov.documentNumber}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-600 truncate max-w-[140px]">
                            {mov.requesterOrOrigin}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                            <span className={isEntrada ? 'text-emerald-700' : 'text-[#E30613]'}>
                              {isEntrada ? '+' : '-'}
                              {mov.quantity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-500">
                            {mov.previousStock}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-neutral-900">
                            {mov.newStock}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                            {mov.operator}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-400">
                Ficha Kardex Oficial · Responsável Técnica: Gabriela Cares
              </span>
              <button
                type="button"
                onClick={() => setKardexArticle(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
