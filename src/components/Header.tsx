/**
 * Cabeçalho Superior - SENAI-SP SIGE
 * Top Bar Contract: Brand Wordmark (Zone 1) - Navigation/Context (Zone 2) - Actions (Zone 3)
 * Responsável Técnica: Gabriela Cares
 */

import React from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  GitBranch,
  HardDrive,
  RefreshCw,
  Info,
} from 'lucide-react';
import { ActiveTab, DatabaseState } from '../types/inventory';

interface HeaderProps {
  database: DatabaseState;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickMovement: (type: 'ENTRADA' | 'SAIDA') => void;
  onOpenTechInfo: () => void;
  isSyncing: boolean;
  onQuickSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  database,
  activeTab,
  setActiveTab,
  onOpenQuickMovement,
  onOpenTechInfo,
  isSyncing,
  onQuickSync,
}) => {
  const totalArticles = database.articles.length;
  const criticalItems = database.articles.filter(
    (a) => a.currentStock <= a.minStock
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 lg:px-8 py-3.5 flex items-center justify-between no-print shadow-xs">
      {/* Zona 1: Identidade SENAI-SP (Único elemento de wordmark corporativo) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-hidden"
          title="Ir para Visão Geral"
        >
          <div className="bg-[#E30613] text-white px-2.5 py-1.5 rounded-sm font-extrabold text-sm tracking-wider shadow-xs flex items-center gap-1.5 transition-transform group-hover:scale-102">
            <span className="font-mono text-base font-black">SENAI</span>
            <span className="text-[10px] bg-black/30 px-1 py-0.5 rounded-xs tracking-normal">SP</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-neutral-900 group-hover:text-[#E30613] transition-colors leading-tight">
              SIGE · Controle de Estoques
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium leading-none">
              Almoxarifado & Gestão Técnica de Materiais
            </p>
          </div>
        </button>
      </div>

      {/* Zona 2: Contexto Operacional e Metadados Limpos (Sem pill badges desnecessárias) */}
      <div className="hidden md:flex items-center gap-4 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium text-neutral-800">Persistência Local: Ativa</span>
        </div>
        <span className="text-neutral-300" aria-hidden="true">·</span>
        <div className="flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5 text-neutral-500" />
          <span className="font-mono font-semibold tabular-nums text-neutral-900">
            {totalArticles}
          </span>
          <span>{totalArticles === 1 ? 'artigo cadastrado' : 'artigos cadastrados'}</span>
        </div>
        {criticalItems > 0 && (
          <>
            <span className="text-neutral-300" aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('stock-position')}
              className="text-[#E30613] font-semibold hover:underline flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-[#E30613] animate-pulse"></span>
              <span className="font-mono tabular-nums">{criticalItems}</span> em ponto de reposição
            </button>
          </>
        )}
      </div>

      {/* Zona 3: Ações Primárias e de Alta Frequência */}
      <div className="flex items-center gap-2">
        <button
          onClick={onQuickSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#E30613]"
          title="Sincronizar com GitHub / Persistência"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#E30613]' : 'text-neutral-600'}`} />
          <span className="hidden lg:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>

        <button
          onClick={() => onOpenQuickMovement('ENTRADA')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Entrada</span>
        </button>

        <button
          onClick={() => onOpenQuickMovement('SAIDA')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#E30613] hover:bg-[#C0040F] rounded-md shadow-xs transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#E30613]"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-white" />
          <span>+ Saída</span>
        </button>

        <button
          onClick={onOpenTechInfo}
          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
          title="Informações do Sistema & Responsável Técnica"
          aria-label="Informações Técnicas"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
