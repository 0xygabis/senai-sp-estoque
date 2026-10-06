/**
 * Central de Persistência, Sincronização GitHub e Armazenamento - SENAI-SP SIGE
 * Suporta persistência contínua entre sessões, GitHub REST API com versionamento,
 * e exportação/importação de backups compatíveis com Google Drive.
 * Responsável Técnica: Gabriela Cares
 */

import React, { useState } from 'react';
import {
  GitBranch,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Trash2,
  Lock,
  ExternalLink,
  Clock,
  ShieldCheck,
  FolderSync,
} from 'lucide-react';
import { DatabaseState, GitCommitRecord, GitHubConfig } from '../types/inventory';
import {
  clearAllData,
  exportDatabaseJSON,
  generateSampleData,
  saveDatabase,
} from '../services/storage';
import { pullFromGitHub, pushToGitHub, testGitHubConnection } from '../services/githubSync';

interface PersistenceManagerProps {
  database: DatabaseState;
  onUpdateDatabase: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onReplaceDatabase: (newDb: DatabaseState) => void;
}

export const PersistenceManager: React.FC<PersistenceManagerProps> = ({
  database,
  onUpdateDatabase,
  onReplaceDatabase,
}) => {
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>(database.githubConfig);
  const [customCommitMessage, setCustomCommitMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Modais de confirmação
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showLoadSampleModal, setShowLoadSampleModal] = useState(false);

  const showFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleSaveConfig = () => {
    onUpdateDatabase((prev) => ({
      ...prev,
      githubConfig,
    }));
    showFeedback('Configurações de sincronização salvas localmente.');
  };

  // --------------------------------------------------------------------------
  // Ações do GitHub
  // --------------------------------------------------------------------------

  const handleTestConnection = async () => {
    setIsProcessing(true);
    const res = await testGitHubConnection(githubConfig);
    setIsProcessing(false);
    showFeedback(res.message, !res.success);

    if (res.success) {
      setGithubConfig((prev) => ({ ...prev, connected: true }));
      onUpdateDatabase((prev) => ({
        ...prev,
        githubConfig: { ...prev.githubConfig, connected: true },
      }));
    }
  };

  const handlePushToGitHub = async () => {
    setIsProcessing(true);
    const res = await pushToGitHub(database, githubConfig, customCommitMessage);
    setIsProcessing(false);

    if (res.success) {
      const newCommitRecord: GitCommitRecord = {
        sha: res.sha || Math.random().toString(16).substring(2, 9),
        message:
          customCommitMessage ||
          `chore(estoque): backup SENAI-SP [${database.articles.length} artigos, ${database.movements.length} movimentações]`,
        author: 'Gabriela Cares (Resp. Técnica)',
        timestamp: new Date().toISOString(),
        snapshotSummary: {
          typesCount: database.types.length,
          groupsCount: database.groups.length,
          subgroupsCount: database.subgroups.length,
          articlesCount: database.articles.length,
          movementsCount: database.movements.length,
          totalStockUnits: database.articles.reduce((acc, a) => acc + (a.currentStock || 0), 0),
        },
      };

      onUpdateDatabase((prev) => ({
        ...prev,
        gitCommits: [newCommitRecord, ...prev.gitCommits],
        githubConfig: {
          ...prev.githubConfig,
          lastSyncAt: new Date().toISOString(),
          connected: true,
        },
      }));
      setCustomCommitMessage('');
      showFeedback(res.message);
    } else {
      showFeedback(res.message, true);
    }
  };

  const handlePullFromGitHub = async () => {
    setIsProcessing(true);
    const res = await pullFromGitHub(githubConfig);
    setIsProcessing(false);

    if (res.success && res.data) {
      onReplaceDatabase({
        ...res.data,
        githubConfig: {
          ...githubConfig,
          lastSyncAt: new Date().toISOString(),
          connected: true,
        },
      });
      showFeedback(res.message);
    } else {
      showFeedback(res.message, true);
    }
  };

  // --------------------------------------------------------------------------
  // Importação e Exportação JSON / Drive
  // --------------------------------------------------------------------------

  const handleExportDriveJSON = () => {
    exportDatabaseJSON(database);
    showFeedback('Backup estruturado exportado com sucesso (compatível com Google Drive).');
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as DatabaseState;

        if (!Array.isArray(parsed.articles) || !Array.isArray(parsed.types)) {
          throw new Error('Formato de arquivo incompatível ou corrompido.');
        }

        onReplaceDatabase({
          types: parsed.types || [],
          groups: parsed.groups || [],
          subgroups: parsed.subgroups || [],
          articles: parsed.articles || [],
          locations: parsed.locations || [],
          movements: parsed.movements || [],
          gitCommits: parsed.gitCommits || [],
          githubConfig: { ...githubConfig, ...(parsed.githubConfig || {}) },
          lastModified: new Date().toISOString(),
          version: parsed.version || '1.0.0',
        });

        showFeedback(`Backup restaurado com sucesso! ${parsed.articles.length} artigos carregados.`);
      } catch (err: any) {
        showFeedback(`Erro ao importar arquivo: ${err.message}`, true);
      }
    };
    reader.readAsText(file);
    // Limpa o input
    event.target.value = '';
  };

  // --------------------------------------------------------------------------
  // Gestão de Base de Testes (Limpar ou Amostras Didáticas)
  // --------------------------------------------------------------------------

  const handleConfirmClear = () => {
    const emptyDb = clearAllData();
    onReplaceDatabase(emptyDb);
    setShowClearConfirmModal(false);
    showFeedback('Banco de dados completamente resetado. Estrutura 100% vazia pronta para novos testes.');
  };

  const handleConfirmLoadSamples = () => {
    const sampleDb = generateSampleData();
    onReplaceDatabase(sampleDb);
    setShowLoadSampleModal(false);
    showFeedback('Dados de demonstração do SENAI-SP carregados com sucesso para validação imediata!');
  };

  const storageUsageKb = (JSON.stringify(database).length / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#E30613]" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Persistência de Dados & Sincronização GitHub / Drive
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Armazenamento permanente entre sessões, versionamento via GitHub e backup compatível com Google Drive.
          </p>
        </div>

        {/* Status de Persistência Atual */}
        <div className="flex items-center gap-3 text-xs bg-neutral-100 px-3.5 py-1.5 rounded-lg shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <HardDrive className="w-4 h-4" />
            <span>Persistência Local Ativa</span>
          </div>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <span className="font-mono text-neutral-600 tabular-nums">
            {storageUsageKb} KB em uso
          </span>
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

      {/* Grid: GitHub Sync + Google Drive / Local Backups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel GitHub (Versionamento e Commits de Inventário) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#E30613]" />
              <h3 className="text-sm font-bold text-neutral-900">
                Integração & Versionamento com GitHub
              </h3>
            </div>
            {githubConfig.lastSyncAt && (
              <span className="text-[11px] text-neutral-500 font-mono">
                Último sync: {new Date(githubConfig.lastSyncAt).toLocaleString('pt-BR')}
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            Permite versionar todos os artigos, movimentações e relatórios em um repositório GitHub.
            Cada alteração pode gerar um commit com hash para auditoria e rollback.
          </p>

          {/* Configurações do Repositório */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Personal Access Token (PAT) do GitHub
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={githubConfig.token}
                  onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
                  placeholder="ghp_... (token com permissão de 'repo')"
                  className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                />
                <Lock className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-3" />
              </div>
              <span className="text-[10px] text-neutral-400">
                * Mesmo sem token real, o sistema mantém histórico local de commits e versionamento para testes imediatos.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Usuário / Organização (Owner)
                </label>
                <input
                  type="text"
                  value={githubConfig.owner}
                  onChange={(e) => setGithubConfig({ ...githubConfig, owner: e.target.value })}
                  placeholder="Ex: seu-usuario"
                  className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Repositório (Repo)
                </label>
                <input
                  type="text"
                  value={githubConfig.repo}
                  onChange={(e) => setGithubConfig({ ...githubConfig, repo: e.target.value })}
                  placeholder="Ex: senai-sp-estoque"
                  className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={githubConfig.branch}
                  onChange={(e) => setGithubConfig({ ...githubConfig, branch: e.target.value })}
                  placeholder="main"
                  className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Caminho do Arquivo JSON no Repo
                </label>
                <input
                  type="text"
                  value={githubConfig.filePath}
                  onChange={(e) => setGithubConfig({ ...githubConfig, filePath: e.target.value })}
                  placeholder="dados/inventario_senai_sp.json"
                  className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Mensagem de Commit para o Push */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Mensagem do Próximo Commit (Opcional)
              </label>
              <input
                type="text"
                value={customCommitMessage}
                onChange={(e) => setCustomCommitMessage(e.target.value)}
                placeholder="Ex: feat(estoque): entrada de lote de aço 1020 e inventário geral"
                className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Botões de Ação do GitHub */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isProcessing}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Testar Conexão
            </button>

            <button
              onClick={handleSaveConfig}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Salvar Parâmetros
            </button>

            <button
              onClick={handlePullFromGitHub}
              disabled={isProcessing}
              className="px-3.5 py-2 text-xs font-bold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Pull (Baixar do GitHub)</span>
            </button>

            <button
              onClick={handlePushToGitHub}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span>Push (Commit Snapshot)</span>
            </button>
          </div>

          {/* Histórico de Commits e Versionamento Local/Nuvem */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-800">
                Histórico de Versões & Commits ({database.gitCommits.length})
              </span>
            </div>

            {database.gitCommits.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">
                Nenhum snapshot de commit registrado ainda. Clique em "Push" para criar a primeira versão.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {database.gitCommits.map((c) => (
                  <div
                    key={c.sha}
                    className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-neutral-200 px-1.5 py-0.5 rounded-xs text-neutral-900">
                          {c.sha.substring(0, 7)}
                        </span>
                        <span className="font-semibold text-neutral-900">{c.message}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1.5">
                        <span>{c.author}</span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(c.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-neutral-500">
                      {c.snapshotSummary.articlesCount} artigos
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Google Drive / Backup em Arquivo & Gestão de Testes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Google Drive e Backups Locais */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-[#E30613]" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Google Drive & Exportação de Arquivos
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Exporte o banco de dados completo estruturado em formato JSON padrão para salvar
              em sua pasta do Google Drive ou restaurar quando desejar.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleExportDriveJSON}
                className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Exportar Backup JSON (Google Drive)</span>
              </button>

              <label className="w-full py-2.5 px-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-neutral-600" />
                <span>Restaurar / Importar Arquivo de Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Card: Gestão de Banco para Validação do Usuário */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E30613]" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Ambiente de Testes & Validação
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              O sistema foi configurado inicialmente com base vazia conforme a especificação.
              Você pode carregar dados didáticos simulados do SENAI-SP com 1 clique para testar
              ou zerar a qualquer momento.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => setShowLoadSampleModal(true)}
                className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Carregar Dados Didáticos SENAI-SP (3 Artigos, 5 Movs)</span>
              </button>

              <button
                onClick={() => setShowClearConfirmModal(true)}
                className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-[#E30613] border border-red-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-[#E30613]" />
                <span>Limpar Todo o Banco (Zerar para Testes)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL DE CONFIRMAÇÃO: LIMPAR BANCO */}
      {/* ==================================================================== */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#E30613] flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Tem certeza que deseja zerar o banco de dados?
            </h3>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
              Esta ação removerá todos os Tipos, Grupos, Subgrupos, Artigos, Localizações e Histórico de Movimentações salvos no navegador, deixando a estrutura 100% vazia para novos testes.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE CONFIRMAÇÃO: CARREGAR AMOSTRAS */}
      {/* ==================================================================== */}
      {showLoadSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Carregar dados didáticos de exemplo do SENAI-SP?
            </h3>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
              Isso preencherá a árvore hierárquica (Matéria-Prima, EPI, Ferramental), 3 artigos com saldos, 3 localizações e 5 movimentações com notas fiscais para facilitar testes rápidos e visualização dos relatórios.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLoadSampleModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLoadSamples}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Carregar Amostras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
