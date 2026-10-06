/**
 * Modal de Informações Técnicas e Responsabilidade do Sistema - SENAI-SP
 * Exibe dados da Responsável Técnica Gabriela Cares e arquitetura do software.
 */

import React from 'react';
import {
  ShieldCheck,
  X,
  Building2,
  GitBranch,
  Layers,
  Database,
  CheckCircle2,
  Mail,
  Cpu,
} from 'lucide-react';
import { DatabaseState } from '../types/inventory';

interface TechInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: DatabaseState;
}

export const TechInfoModal: React.FC<TechInfoModalProps> = ({
  isOpen,
  onClose,
  database,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E30613] text-white flex items-center justify-center font-bold text-sm font-mono shrink-0 shadow-xs">
              SENAI
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                SIGE · Controle de Estoques SENAI-SP
              </h3>
              <p className="text-xs text-neutral-500">
                Sistema Integrado de Gestão de Almoxarifado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações da Responsável Técnica */}
        <div className="mt-5 space-y-4 text-xs">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-neutral-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#E30613]" />
                <span>Responsabilidade Técnica</span>
              </span>
              <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 font-bold text-[10px]">
                CREA / CFT Habilitado
              </span>
            </div>

            <div className="text-sm font-extrabold text-neutral-900">
              Gabriela Cares
            </div>
            <div className="text-neutral-600 mt-0.5 font-medium">
              Engenharia de Software & Logística Técnica Integrada
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-200/80 flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span>caresgabriela24@gmail.com</span>
            </div>
          </div>

          {/* Especificações de Engenharia do Software */}
          <div className="space-y-2">
            <div className="font-bold text-neutral-800">Arquitetura & Especificações Técnicas:</div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block">Cadastro Hierárquico:</span>
                <strong className="text-neutral-900 font-medium">
                  Tipo &rarr; Grupo &rarr; Subgrupo &rarr; Artigo
                </strong>
              </div>

              <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block">Persistência:</span>
                <strong className="text-neutral-900 font-medium">
                  Contínua (Local + GitHub / Drive)
                </strong>
              </div>

              <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block">Validação de Saldo:</span>
                <strong className="text-neutral-900 font-medium">
                  Bloqueio Estrito de Saldo Negativo
                </strong>
              </div>

              <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block">Rastreamento Físico:</span>
                <strong className="text-neutral-900 font-medium">
                  Endereçamento Completo de Almoxarifado
                </strong>
              </div>
            </div>
          </div>

          {/* Status do Banco no Momento */}
          <div className="p-3 bg-neutral-100 rounded-lg text-[11px] text-neutral-600 font-mono flex items-center justify-between">
            <span>Artigos: {database.articles.length}</span>
            <span>Movimentações: {database.movements.length}</span>
            <span>Localizações: {database.locations.length}</span>
            <span>Versão: 1.0.0</span>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
