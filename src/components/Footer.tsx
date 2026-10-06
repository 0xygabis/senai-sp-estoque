/**
 * Rodapé Institucional do Sistema - SENAI-SP SIGE
 * Exibe a autoria e responsabilidade técnica de Gabriela Cares de forma elegante e permanente.
 */

import React from 'react';
import { ShieldCheck, HardDrive, GitBranch } from 'lucide-react';
import { DatabaseState } from '../types/inventory';

interface FooterProps {
  database: DatabaseState;
  onOpenTechInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ database, onOpenTechInfo }) => {
  return (
    <footer className="bg-neutral-900 text-neutral-400 border-t border-neutral-800 text-xs py-4 px-4 lg:px-8 no-print select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Esquerda: Identidade SENAI SP */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-bold text-white bg-[#E30613] px-2 py-0.5 rounded-xs text-[11px]">
            SENAI-SP
          </span>
          <span className="text-neutral-300 font-medium">
            Sistema Integrado de Gestão de Estoques e Almoxarifado (SIGE)
          </span>
        </div>

        {/* Direita: Responsável Técnica com gatilho interativo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTechInfo}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors group cursor-pointer focus:outline-hidden"
          >
            <ShieldCheck className="w-4 h-4 text-[#E30613] group-hover:scale-110 transition-transform" />
            <span>
              Responsável Técnica:{' '}
              <strong className="text-white group-hover:text-[#E30613] transition-colors underline decoration-neutral-700 underline-offset-2">
                Gabriela Cares
              </strong>
            </span>
          </button>
          <span className="text-neutral-700" aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-neutral-400">
            {database.articles.length} artigos cadastrados
          </span>
        </div>
      </div>
    </footer>
  );
};
