/**
 * Visão Geral / Dashboard Executivo - SENAI-SP SIGE
 * Exibe métricas de inventário em tempo real, atalhos operacionais e estado vazio pronto para testes.
 * Responsável Técnica: Gabriela Cares
 */

import React from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { ActiveTab, DatabaseState } from '../types/inventory';

interface DashboardOverviewProps {
  database: DatabaseState;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickMovement: (type: 'ENTRADA' | 'SAIDA') => void;
  onLoadSampleData: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  database,
  setActiveTab,
  onOpenQuickMovement,
  onLoadSampleData,
}) => {
  const totalArticles = database.articles.length;
  const totalStockUnits = database.articles.reduce(
    (acc, a) => acc + (a.currentStock || 0),
    0
  );
  const totalInventoryValue = database.articles.reduce(
    (acc, a) => acc + (a.currentStock || 0) * (a.unitCost || 0),
    0
  );
  const criticalArticles = database.articles.filter(
    (a) => a.currentStock <= a.minStock
  );
  const recentMovements = [...database.movements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const isEmpty = totalArticles === 0 && database.movements.length === 0;

  return (
    <div className="space-y-6">
      {/* Faixa de Alerta ou Instrução de Teste Inicial */}
      {isEmpty && (
        <div className="p-6 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md mb-3 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ambiente de Testes Inicializado · Banco Vazio</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              Sistema de Estoques SENAI-SP pronto para validação
            </h2>
            <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">
              A estrutura do banco de dados está completamente vazia e pronta para você testar o
              cadastro hierárquico (Tipo → Grupo → Subgrupo → Artigo), registrar entradas e saídas,
              definir localizações de armazenamento e emitir relatórios.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('hierarchy')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Iniciar Cadastro Hierárquico</span>
              </button>

              <button
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Carregar Dados de Demonstração SENAI-SP (Teste Rápido)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Métricas Principais (60-30-10 Color Discipline com Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Artigos */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Artigos Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {totalArticles}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
            <span>{database.subgroups.length} subgrupos</span>
            <span aria-hidden="true">·</span>
            <span>{database.groups.length} grupos</span>
          </div>
        </div>

        {/* Card 2: Saldo Físico em Unidades */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo em Estoque</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {totalStockUnits.toLocaleString('pt-BR')}
          </div>
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Unidades físicas estocadas</span>
          </div>
        </div>

        {/* Card 3: Valor Total do Inventário */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Valor do Inventário</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 truncate">
            {formatCurrency(totalInventoryValue)}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            <span>Avaliação contábil a custo médio</span>
          </div>
        </div>

        {/* Card 4: Alertas de Ponto de Reposição */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Ponto de Reposição</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                criticalArticles.length > 0
                  ? 'bg-red-50 text-[#E30613]'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              criticalArticles.length > 0 ? 'text-[#E30613]' : 'text-neutral-900'
            }`}
          >
            {criticalArticles.length}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            {criticalArticles.length > 0 ? (
              <button
                onClick={() => setActiveTab('stock-position')}
                className="text-[#E30613] font-semibold hover:underline"
              >
                Ver itens com estoque crítico &rarr;
              </button>
            ) : (
              <span>Nenhum item com estoque baixo</span>
            )}
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ação 1: Entrada */}
        <button
          onClick={() => onOpenQuickMovement('ENTRADA')}
          className="group text-left p-5 bg-white border border-neutral-200 hover:border-neutral-900 rounded-xl transition-all shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-900">Registrar Entrada</div>
              <div className="text-xs text-neutral-500">
                Recebimento por Nota Fiscal ou Fornecedor
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Ação 2: Saída */}
        <button
          onClick={() => onOpenQuickMovement('SAIDA')}
          className="group text-left p-5 bg-white border border-neutral-200 hover:border-[#E30613] rounded-xl transition-all shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#E30613] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-900">Registrar Saída</div>
              <div className="text-xs text-neutral-500">
                Baixa para oficina, aula ou manutenção
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#E30613] group-hover:translate-x-1 transition-all" />
        </button>

        {/* Ação 3: Relatórios Oficiais */}
        <button
          onClick={() => setActiveTab('reports')}
          className="group text-left p-5 bg-white border border-neutral-200 hover:border-neutral-700 rounded-xl transition-all shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5 text-neutral-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-900">Relatórios & Kardex</div>
              <div className="text-xs text-neutral-500">
                Posição completa e exportação oficial
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Grade com Posição Crítica e Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel: Itens que exigem reposição imediata */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#E30613]" />
              <h3 className="text-sm font-bold text-neutral-900">
                Ponto de Pedido & Reposição ({criticalArticles.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('stock-position')}
              className="text-xs font-semibold text-[#E30613] hover:underline"
            >
              Ver todos
            </button>
          </div>

          {criticalArticles.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-medium">Nenhum item com estoque abaixo do mínimo.</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Todos os artigos cadastrados estão em níveis operacionais regulares.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {criticalArticles.slice(0, 5).map((article) => {
                const isZero = article.currentStock <= 0;
                return (
                  <div key={article.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-900">
                          {article.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                            isZero
                              ? 'bg-neutral-900 text-white'
                              : 'bg-red-100 text-[#E30613]'
                          }`}
                        >
                          {isZero ? 'ZERADO' : 'CRÍTICO'}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-700 font-medium truncate max-w-xs mt-0.5">
                        {article.name}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-neutral-900 tabular-nums">
                        {article.currentStock} / {article.minStock} {article.unit}
                      </div>
                      <button
                        onClick={() => onOpenQuickMovement('ENTRADA')}
                        className="text-[11px] text-[#E30613] font-semibold hover:underline mt-0.5 block"
                      >
                        Repor Estoque &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel: Movimentações Recentes (Log de Operações) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-600" />
              <h3 className="text-sm font-bold text-neutral-900">
                Últimas Movimentações ({database.movements.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('movements')}
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:underline"
            >
              Histórico completo
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <Boxes className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhuma movimentação registrada até o momento.</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Entradas e saídas de materiais aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentMovements.map((mov) => {
                const article = database.articles.find((a) => a.id === mov.articleId);
                const isEntrada = mov.type === 'ENTRADA';

                return (
                  <div key={mov.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isEntrada
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-[#E30613]'
                        }`}
                      >
                        {isEntrada ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-semibold text-neutral-900">
                            {isEntrada ? 'Entrada' : 'Saída'}
                          </span>
                          <span className="text-neutral-300" aria-hidden="true">·</span>
                          <span className="font-mono text-neutral-600 font-medium">
                            {article?.code || 'ART'}
                          </span>
                          <span className="text-neutral-300" aria-hidden="true">·</span>
                          <span className="text-neutral-500 text-[11px]">
                            {mov.documentNumber || mov.reason}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {mov.requesterOrOrigin} · Operador: {mov.operator}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono text-xs font-bold tabular-nums ${
                          isEntrada ? 'text-emerald-700' : 'text-[#E30613]'
                        }`}
                      >
                        {isEntrada ? '+' : '-'}
                        {mov.quantity} {article?.unit || 'UN'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {new Date(mov.timestamp).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
