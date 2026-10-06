/**
 * Barra Lateral de Navegação (Sidebar) - SENAI-SP SIGE
 * Visual industrial, sóbrio (Preto, Vermelho e Branco), alta legibilidade e acesso rápido.
 * Responsável Técnica: Gabriela Cares
 */

import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  ArrowLeftRight,
  PackageCheck,
  MapPin,
  FileSpreadsheet,
  GitBranch,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab, DatabaseState } from '../types/inventory';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  database: DatabaseState;
  onOpenTechInfo: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  database,
  onOpenTechInfo,
}) => {
  const criticalItems = database.articles.filter(
    (a) => a.currentStock <= a.minStock
  ).length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      sublabel: 'Indicadores e painel de controle',
      icon: LayoutDashboard,
    },
    {
      id: 'hierarchy',
      label: 'Cadastro Hierárquico',
      sublabel: 'Tipo → Grupo → Subgrupo → Artigo',
      icon: FolderTree,
      badge: database.articles.length,
    },
    {
      id: 'movements',
      label: 'Movimentações',
      sublabel: 'Entrada e saída de materiais',
      icon: ArrowLeftRight,
      badge: database.movements.length,
    },
    {
      id: 'stock-position',
      label: 'Posição do Estoque',
      sublabel: 'Saldos em tempo real e Kardex',
      icon: PackageCheck,
      badge: criticalItems > 0 ? criticalItems : undefined,
      highlight: criticalItems > 0,
    },
    {
      id: 'locations',
      label: 'Localizações Físicas',
      sublabel: 'Almoxarifado e endereçamento',
      icon: MapPin,
      badge: database.locations.length,
    },
    {
      id: 'reports',
      label: 'Relatórios Oficiais',
      sublabel: 'Posição, histórico e reposição',
      icon: FileSpreadsheet,
    },
    {
      id: 'persistence',
      label: 'GitHub & Backup',
      sublabel: 'Sincronização e persistência',
      icon: GitBranch,
      badge: database.gitCommits.length > 0 ? database.gitCommits.length : undefined,
    },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-[#0F172A] text-neutral-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)] border-r border-neutral-800 no-print select-none">
      {/* Seção Superior: Menu de Navegação Operacional */}
      <div className="p-4 space-y-6">
        {/* Unidade Operacional SENAI */}
        <div className="px-3 py-2.5 rounded-md bg-neutral-900/80 border border-neutral-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#E30613]/20 border border-[#E30613]/40 flex items-center justify-center text-[#E30613] shrink-0 font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white tracking-wide truncate">
              SENAI · São Paulo
            </div>
            <div className="text-[11px] text-neutral-400 truncate">
              Gestão Técnica de Almoxarifado
            </div>
          </div>
        </div>

        {/* Lista de Menus Destacados */}
        <nav className="space-y-1.5" aria-label="Navegação Principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group text-left px-3.5 py-2.5 rounded-lg transition-all duration-150 flex items-center justify-between border ${
                  isActive
                    ? 'bg-[#E30613] text-white border-[#E30613] shadow-md shadow-red-950/40 font-semibold'
                    : 'bg-transparent text-neutral-300 hover:bg-neutral-800/70 hover:text-white border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight truncate">
                      {item.label}
                    </div>
                    <div
                      className={`text-[10px] leading-tight truncate ${
                        isActive ? 'text-white/80' : 'text-neutral-500 group-hover:text-neutral-400'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {typeof item.badge === 'number' && (
                    <span
                      className={`font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-sm font-bold ${
                        isActive
                          ? 'bg-black/30 text-white'
                          : item.highlight
                          ? 'bg-[#E30613] text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-white/70 translate-x-0.5' : 'text-neutral-600 group-hover:text-neutral-400'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Seção Inferior: Cartão de Responsabilidade Técnica & Status */}
      <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/60">
        <button
          onClick={onOpenTechInfo}
          className="w-full text-left p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E30613]" />
              <span>Responsável Técnica</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-medium">v1.0.0</span>
          </div>
          <div className="text-xs font-bold text-white group-hover:text-[#E30613] transition-colors">
            Gabriela Cares
          </div>
          <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
            Engenharia de Software · SENAI-SP
          </div>
        </button>

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-neutral-500 font-mono px-1">
          <span>Banco: {database.articles.length === 0 ? 'Vazio (Pronto)' : `${database.articles.length} Artigos`}</span>
          <span className="text-neutral-400">ISO 9001 / 5S</span>
        </div>
      </div>
    </aside>
  );
};
