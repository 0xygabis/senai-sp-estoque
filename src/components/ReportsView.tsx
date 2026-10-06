/**
 * Módulo de Relatórios Oficiais e Auditoria de Estoques - SENAI-SP SIGE
 * Relatórios: Posição Completa, Livro Kardex, Reposição de Compras e Inventário Físico por Localização.
 * Exportação em CSV/Excel e Impressão Corporativa Oficial com Responsável Técnica Gabriela Cares.
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  PackageCheck,
  Clock,
  AlertTriangle,
  MapPin,
  Building2,
  Calendar,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { DatabaseState } from '../types/inventory';
import { exportCSV } from '../services/storage';

interface ReportsViewProps {
  database: DatabaseState;
}

type ReportType = 'POSICAO' | 'KARDEX' | 'REPOSICAO' | 'LOCALIZACOES';

export const ReportsView: React.FC<ReportsViewProps> = ({ database }) => {
  const [reportType, setReportType] = useState<ReportType>('POSICAO');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterTypeHier, setFilterTypeHier] = useState('TODOS');
  const [filterMovementType, setFilterMovementType] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const currentDateStr = new Date().toLocaleDateString('pt-BR');
  const currentTimeStr = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // --------------------------------------------------------------------------
  // Processamento dos Dados por Relatório
  // --------------------------------------------------------------------------

  // 1. Posição Completa
  const filteredArticles = database.articles.filter((art) => {
    if (filterTypeHier !== 'TODOS') {
      const sub = database.subgroups.find((s) => s.id === art.subgroupId);
      const grp = sub ? database.groups.find((g) => g.id === sub.groupId) : null;
      if (!grp || grp.typeId !== filterTypeHier) return false;
    }
    return true;
  });

  const totalPhysicalUnits = filteredArticles.reduce((acc, a) => acc + (a.currentStock || 0), 0);
  const totalValuation = filteredArticles.reduce(
    (acc, a) => acc + (a.currentStock || 0) * (a.unitCost || 0),
    0
  );

  // 2. Livro Kardex / Histórico
  const filteredMovements = database.movements.filter((mov) => {
    if (filterMovementType !== 'TODOS' && mov.type !== filterMovementType) return false;

    if (filterStartDate) {
      const movDate = mov.timestamp.slice(0, 10);
      if (movDate < filterStartDate) return false;
    }
    if (filterEndDate) {
      const movDate = mov.timestamp.slice(0, 10);
      if (movDate > filterEndDate) return false;
    }

    return true;
  });

  // 3. Relatório de Reposição
  const replenishmentArticles = database.articles.filter((a) => a.currentStock <= a.minStock);

  // --------------------------------------------------------------------------
  // Handlers de Exportação CSV
  // --------------------------------------------------------------------------

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (reportType === 'POSICAO') {
      const headers = [
        'Codigo',
        'Artigo',
        'Tipo',
        'Grupo',
        'Subgrupo',
        'Localizacao',
        'Saldo_Atual',
        'Unidade',
        'Estoque_Minimo',
        'Custo_Unitario_BRL',
        'Valor_Total_BRL',
        'Status',
      ];
      const rows = filteredArticles.map((art) => {
        const sub = database.subgroups.find((s) => s.id === art.subgroupId);
        const grp = sub ? database.groups.find((g) => g.id === sub.groupId) : null;
        const tip = grp ? database.types.find((t) => t.id === grp.typeId) : null;
        const loc = database.locations.find((l) => l.id === art.defaultLocationId);
        const isCritical = art.currentStock <= art.minStock;

        return [
          art.code,
          art.name,
          tip?.name || '',
          grp?.name || '',
          sub?.name || '',
          loc ? `${loc.code} - ${loc.name}` : 'Almoxarifado Geral',
          art.currentStock,
          art.unit,
          art.minStock,
          art.unitCost.toFixed(2),
          (art.currentStock * art.unitCost).toFixed(2),
          isCritical ? 'PONTO DE REPOSICAO' : 'REGULAR',
        ];
      });
      exportCSV(`SENAI_SP_Posicao_Estoque_${timestamp}`, headers, rows);
    } else if (reportType === 'KARDEX') {
      const headers = [
        'Data_Hora',
        'Operacao',
        'Codigo_Artigo',
        'Artigo',
        'Quantidade',
        'Unidade',
        'Saldo_Anterior',
        'Saldo_Novo',
        'Localizacao',
        'Tipo_Documento',
        'Numero_Documento',
        'Origem_Destino',
        'Motivo',
        'Operador',
      ];
      const rows = filteredMovements.map((mov) => {
        const art = database.articles.find((a) => a.id === mov.articleId);
        const loc = database.locations.find((l) => l.id === mov.locationId);

        return [
          new Date(mov.timestamp).toLocaleString('pt-BR'),
          mov.type,
          art?.code || '',
          art?.name || '',
          mov.quantity,
          art?.unit || 'UN',
          mov.previousStock,
          mov.newStock,
          loc?.code || 'Almoxarifado',
          mov.documentType,
          mov.documentNumber,
          mov.requesterOrOrigin,
          mov.reason,
          mov.operator,
        ];
      });
      exportCSV(`SENAI_SP_Livro_Kardex_${timestamp}`, headers, rows);
    } else if (reportType === 'REPOSICAO') {
      const headers = [
        'Codigo',
        'Artigo',
        'Localizacao',
        'Saldo_Atual',
        'Estoque_Minimo',
        'Estoque_Maximo',
        'Unidade',
        'Necessidade_Compra',
        'Custo_Unitario_BRL',
        'Estimativa_Custo_BRL',
      ];
      const rows = replenishmentArticles.map((art) => {
        const loc = database.locations.find((l) => l.id === art.defaultLocationId);
        const defasagem = Math.max(0, art.maxStock - art.currentStock);
        const custoEstimado = defasagem * art.unitCost;

        return [
          art.code,
          art.name,
          loc?.code || 'Almoxarifado',
          art.currentStock,
          art.minStock,
          art.maxStock,
          art.unit,
          defasagem,
          art.unitCost.toFixed(2),
          custoEstimado.toFixed(2),
        ];
      });
      exportCSV(`SENAI_SP_Necessidade_Reposicao_${timestamp}`, headers, rows);
    } else {
      const headers = [
        'Localizacao_Codigo',
        'Localizacao_Nome',
        'Predio',
        'Rua',
        'Estante',
        'Nivel',
        'Codigo_Artigo',
        'Artigo',
        'Saldo_Armazenado',
        'Unidade',
      ];
      const rows: (string | number)[][] = [];
      database.locations.forEach((loc) => {
        const items = database.articles.filter((a) => a.defaultLocationId === loc.id);
        if (items.length === 0) {
          rows.push([loc.code, loc.name, loc.building, loc.aisle, loc.shelf, loc.level, '—', '—', 0, '—']);
        } else {
          items.forEach((art) => {
            rows.push([
              loc.code,
              loc.name,
              loc.building,
              loc.aisle,
              loc.shelf,
              loc.level,
              art.code,
              art.name,
              art.currentStock,
              art.unit,
            ]);
          });
        }
      });
      exportCSV(`SENAI_SP_Inventario_Localizacao_${timestamp}`, headers, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles e Seleção de Relatório (Oculta na Impressão) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#E30613]" />
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                Emissão de Relatórios Oficiais de Estoque
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Gere extratos consolidados com saldos, localizações e histórico de movimentações para auditoria SENAI-SP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-neutral-600" />
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#E30613] hover:bg-[#C0040F] rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Imprimir Relatório Oficial</span>
            </button>
          </div>
        </div>

        {/* Seletor de Tipo de Relatório */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-100 rounded-xl">
          <button
            onClick={() => setReportType('POSICAO')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              reportType === 'POSICAO'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PackageCheck className="w-4 h-4 text-[#E30613]" />
            <span>1. Posição Completa do Estoque</span>
          </button>

          <button
            onClick={() => setReportType('KARDEX')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              reportType === 'KARDEX'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-4 h-4 text-neutral-700" />
            <span>2. Livro Kardex (Movimentações)</span>
          </button>

          <button
            onClick={() => setReportType('REPOSICAO')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              reportType === 'REPOSICAO'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>3. Necessidade de Reposição ({replenishmentArticles.length})</span>
          </button>

          <button
            onClick={() => setReportType('LOCALIZACOES')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              reportType === 'LOCALIZACOES'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-neutral-700" />
            <span>4. Inventário por Localização Física</span>
          </button>
        </div>

        {/* Filtros Contextuais */}
        {reportType === 'KARDEX' && (
          <div className="p-3 bg-white border border-neutral-200 rounded-lg flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-neutral-700">Filtros do Kardex:</span>
            <div className="flex items-center gap-1.5">
              <label className="text-neutral-500">De:</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="bg-neutral-50 border border-neutral-300 rounded-md px-2 py-1 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-neutral-500">Até:</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="bg-neutral-50 border border-neutral-300 rounded-md px-2 py-1 text-xs"
              />
            </div>
            <select
              value={filterMovementType}
              onChange={(e) => setFilterMovementType(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-300 rounded-md px-2.5 py-1 text-xs"
            >
              <option value="TODOS">Todas Movimentações</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="SAIDA">Apenas Saídas</option>
            </select>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* ÁREA DE RELATÓRIO FORMATADO (APRESENTAÇÃO EM TELA E IMPRESSÃO OFICIAL) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-8 shadow-xs print-container">
        {/* Cabeçalho Oficial Corporativo SENAI-SP */}
        <div className="border-b-2 border-neutral-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="bg-[#E30613] text-white px-3 py-2 rounded-xs font-black text-xl tracking-wider font-mono">
                SENAI
              </div>
              <div>
                <h1 className="text-base font-extrabold text-neutral-900 uppercase tracking-tight">
                  Serviço Nacional de Aprendizagem Industrial
                </h1>
                <div className="text-xs text-neutral-600 font-semibold">
                  Departamento Regional de São Paulo · Almoxarifado Central e Controle de Estoques
                </div>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-neutral-600">
              <div>Emissão: <strong className="text-neutral-900">{currentDateStr} às {currentTimeStr}</strong></div>
              <div>Sistema: <strong className="text-neutral-900">SIGE v1.0.0</strong></div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Documento Oficial de Inventário
              </span>
              <h2 className="text-base font-bold text-neutral-900 mt-0.5">
                {reportType === 'POSICAO' && 'Relatório de Posição Completa do Estoque Físico e Financeiro'}
                {reportType === 'KARDEX' && 'Livro Registro Kardex · Histórico Consolidado de Movimentações'}
                {reportType === 'REPOSICAO' && 'Relatório de Necessidade de Reposição e Suprimentos'}
                {reportType === 'LOCALIZACOES' && 'Inventário Físico Setorizado por Endereço de Armazenamento'}
              </h2>
            </div>

            <div className="text-right text-xs">
              <span className="font-semibold text-neutral-700">Responsável Técnica: </span>
              <span className="font-bold text-neutral-900">Gabriela Cares</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TABELA: 1. POSIÇÃO COMPLETA */}
        {/* ------------------------------------------------------------------ */}
        {reportType === 'POSICAO' && (
          <div>
            {/* Resumo de Cabeçalho do Relatório */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs mb-4">
              <div>
                <span className="text-neutral-500">Itens Listados:</span>
                <div className="font-mono font-bold text-neutral-900">{filteredArticles.length}</div>
              </div>
              <div>
                <span className="text-neutral-500">Total Unidades Físicas:</span>
                <div className="font-mono font-bold text-neutral-900">{totalPhysicalUnits.toLocaleString('pt-BR')}</div>
              </div>
              <div>
                <span className="text-neutral-500">Valor Contábil Avaliado:</span>
                <div className="font-mono font-bold text-neutral-900">{formatCurrency(totalValuation)}</div>
              </div>
              <div>
                <span className="text-neutral-500">Itens em Reposição:</span>
                <div className="font-mono font-bold text-[#E30613]">{replenishmentArticles.length}</div>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                Nenhum dado cadastrado para emissão da posição de estoque.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800">
                    <th className="py-2 px-2.5 font-mono">Código</th>
                    <th className="py-2 px-2.5">Descrição do Artigo</th>
                    <th className="py-2 px-2.5">Hierarquia (Tipo / Subgrupo)</th>
                    <th className="py-2 px-2.5">Localização</th>
                    <th className="py-2 px-2.5 text-right">Saldo Físico</th>
                    <th className="py-2 px-2.5 text-right">Est. Mín.</th>
                    <th className="py-2 px-2.5 text-right">Custo Médio</th>
                    <th className="py-2 px-2.5 text-right">Valor Total</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredArticles.map((art) => {
                    const sub = database.subgroups.find((s) => s.id === art.subgroupId);
                    const grp = sub ? database.groups.find((g) => g.id === sub.groupId) : null;
                    const tip = grp ? database.types.find((t) => t.id === grp.typeId) : null;
                    const loc = database.locations.find((l) => l.id === art.defaultLocationId);
                    const isCritical = art.currentStock <= art.minStock;

                    return (
                      <tr key={art.id}>
                        <td className="py-2 px-2.5 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          {art.code}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-neutral-900">{art.name}</td>
                        <td className="py-2 px-2.5 text-neutral-600">
                          {tip?.name || '—'} / {sub?.name || '—'}
                        </td>
                        <td className="py-2 px-2.5 text-neutral-700 whitespace-nowrap">
                          {loc ? `${loc.code} - ${loc.name}` : 'Almoxarifado Central'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                          {art.currentStock} {art.unit}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-neutral-600 whitespace-nowrap">
                          {art.minStock} {art.unit}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                          {formatCurrency(art.unitCost)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                          {formatCurrency(art.currentStock * art.unitCost)}
                        </td>
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                              isCritical
                                ? 'bg-red-100 text-[#E30613]'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {isCritical ? 'REPOSIÇÃO' : 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-400">
                    <td colSpan={4} className="py-2.5 px-2.5 text-neutral-900">
                      TOTAL CONSOLIDADO GERAL:
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                      {totalPhysicalUnits.toLocaleString('pt-BR')} UN
                    </td>
                    <td colSpan={2}></td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-neutral-900">
                      {formatCurrency(totalValuation)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TABELA: 2. LIVRO KARDEX */}
        {/* ------------------------------------------------------------------ */}
        {reportType === 'KARDEX' && (
          <div>
            {filteredMovements.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                Nenhuma movimentação registrada no período selecionado.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800">
                    <th className="py-2 px-2.5">Data / Hora</th>
                    <th className="py-2 px-2.5">Tipo</th>
                    <th className="py-2 px-2.5">Artigo</th>
                    <th className="py-2 px-2.5 text-right">Qtd</th>
                    <th className="py-2 px-2.5 text-right font-mono">Saldo Ant. &rarr; Novo</th>
                    <th className="py-2 px-2.5">Localização</th>
                    <th className="py-2 px-2.5">Documento</th>
                    <th className="py-2 px-2.5">Origem / Destino</th>
                    <th className="py-2 px-2.5">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredMovements.map((mov) => {
                    const art = database.articles.find((a) => a.id === mov.articleId);
                    const loc = database.locations.find((l) => l.id === mov.locationId);
                    const isEntrada = mov.type === 'ENTRADA';

                    return (
                      <tr key={mov.id}>
                        <td className="py-2 px-2.5 font-mono text-neutral-600 whitespace-nowrap">
                          {new Date(mov.timestamp).toLocaleDateString('pt-BR')}{' '}
                          {new Date(mov.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap font-bold">
                          <span
                            className={
                              isEntrada ? 'text-emerald-700' : 'text-[#E30613]'
                            }
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="font-mono font-bold">{art?.code}</span> - {art?.name}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                          {isEntrada ? '+' : '-'}
                          {mov.quantity} {art?.unit || 'UN'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                          {mov.previousStock} &rarr; <strong>{mov.newStock}</strong>
                        </td>
                        <td className="py-2 px-2.5 text-neutral-600 whitespace-nowrap">
                          {loc?.code || 'Almoxarifado'}
                        </td>
                        <td className="py-2 px-2.5 font-mono whitespace-nowrap">
                          {mov.documentType} {mov.documentNumber}
                        </td>
                        <td className="py-2 px-2.5 text-neutral-600">{mov.requesterOrOrigin}</td>
                        <td className="py-2 px-2.5 text-neutral-600 whitespace-nowrap">
                          {mov.operator}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TABELA: 3. NECESSIDADE DE REPOSIÇÃO */}
        {/* ------------------------------------------------------------------ */}
        {reportType === 'REPOSICAO' && (
          <div>
            {replenishmentArticles.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-neutral-900">Estoque 100% abastecido!</p>
                <p className="text-neutral-500 mt-0.5">
                  Nenhum artigo atingiu o ponto de pedido ou estoque mínimo no momento.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800">
                    <th className="py-2 px-2.5 font-mono">Código</th>
                    <th className="py-2 px-2.5">Descrição do Artigo</th>
                    <th className="py-2 px-2.5">Localização</th>
                    <th className="py-2 px-2.5 text-right">Saldo Atual</th>
                    <th className="py-2 px-2.5 text-right">Estoque Mínimo</th>
                    <th className="py-2 px-2.5 text-right">Estoque Máximo</th>
                    <th className="py-2 px-2.5 text-right font-bold text-[#E30613]">Sugestão Compra</th>
                    <th className="py-2 px-2.5 text-right">Custo Unitário</th>
                    <th className="py-2 px-2.5 text-right font-bold">Investimento Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {replenishmentArticles.map((art) => {
                    const loc = database.locations.find((l) => l.id === art.defaultLocationId);
                    const defasagem = Math.max(0, art.maxStock - art.currentStock);
                    const custoEstimado = defasagem * art.unitCost;

                    return (
                      <tr key={art.id}>
                        <td className="py-2 px-2.5 font-mono font-bold text-[#E30613] whitespace-nowrap">
                          {art.code}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-neutral-900">{art.name}</td>
                        <td className="py-2 px-2.5 text-neutral-700 whitespace-nowrap">
                          {loc?.code || 'Almoxarifado'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-[#E30613] tabular-nums whitespace-nowrap">
                          {art.currentStock} {art.unit}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-neutral-600 whitespace-nowrap">
                          {art.minStock} {art.unit}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-neutral-600 whitespace-nowrap">
                          {art.maxStock} {art.unit}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-[#E30613] tabular-nums whitespace-nowrap">
                          {defasagem} {art.unit}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                          {formatCurrency(art.unitCost)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                          {formatCurrency(custoEstimado)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TABELA: 4. INVENTÁRIO POR LOCALIZAÇÃO */}
        {/* ------------------------------------------------------------------ */}
        {reportType === 'LOCALIZACOES' && (
          <div className="space-y-6">
            {database.locations.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                Nenhuma localização física cadastrada.
              </div>
            ) : (
              database.locations.map((loc) => {
                const itemsInLoc = database.articles.filter((a) => a.defaultLocationId === loc.id);

                return (
                  <div key={loc.id} className="border border-neutral-300 rounded-lg overflow-hidden">
                    <div className="bg-neutral-100 p-2.5 border-b border-neutral-300 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded-xs border border-neutral-300">
                          {loc.code}
                        </span>
                        <span className="font-bold text-neutral-900">{loc.name}</span>
                        <span className="text-neutral-500">
                          ({loc.building} · {loc.aisle} · {loc.shelf} · {loc.level})
                        </span>
                      </div>
                      <div className="font-mono font-bold text-neutral-800">
                        {itemsInLoc.length} {itemsInLoc.length === 1 ? 'artigo alocado' : 'artigos alocados'}
                      </div>
                    </div>

                    {itemsInLoc.length === 0 ? (
                      <div className="p-3 text-xs text-neutral-400 italic">
                        Endereço de armazenamento sem artigos atribuídos no momento.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                            <th className="py-1.5 px-3 font-mono">Código</th>
                            <th className="py-1.5 px-3">Descrição do Artigo</th>
                            <th className="py-1.5 px-3 text-right">Saldo Físico</th>
                            <th className="py-1.5 px-3 text-right">Estoque Mínimo</th>
                            <th className="py-1.5 px-3 text-center">Conferência Física (Visto)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {itemsInLoc.map((art) => (
                            <tr key={art.id}>
                              <td className="py-2 px-3 font-mono font-bold text-neutral-900">
                                {art.code}
                              </td>
                              <td className="py-2 px-3 font-bold text-neutral-800">{art.name}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                                {art.currentStock} {art.unit}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-500">
                                {art.minStock} {art.unit}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="inline-block w-24 border-b border-neutral-400"></span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Rodapé Oficial de Autenticação e Assinatura */}
        <div className="mt-12 pt-6 border-t-2 border-neutral-900 grid grid-cols-2 gap-8 text-xs text-neutral-700">
          <div>
            <div className="font-bold text-neutral-900 uppercase">
              Responsabilidade Técnica pelo Sistema
            </div>
            <div className="mt-1">
              Desenvolvedora Full-Stack: <strong>Gabriela Cares</strong>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Engenharia de Software · Sistema Integrado de Gestão de Estoques SENAI-SP
            </div>
            <div className="mt-6 border-t border-neutral-400 pt-1 text-[11px] text-neutral-500 w-64">
              Assinatura do Responsável Técnico
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="font-bold text-neutral-900 uppercase">
              Conferência Operacional do Almoxarifado
            </div>
            <div className="mt-1 text-neutral-600">
              Visto do Almoxarife de Plantão / Supervisor da Unidade
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              SENAI São Paulo · Gerência de Logística e Infraestrutura
            </div>
            <div className="mt-6 border-t border-neutral-400 pt-1 text-[11px] text-neutral-500 w-64 text-center">
              Visto / Assinatura do Supervisor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
