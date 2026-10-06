/**
 * Aplicação Principal - SENAI-SP SIGE (Sistema Integrado de Gestão de Estoques)
 * Responsável Técnica: Gabriela Cares | Engenharia de Software & Logística
 */

import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  DatabaseState,
  MovementType,
} from './types/inventory';
import {
  loadDatabase,
  saveDatabase,
  generateSampleData,
} from './services/storage';
import { pushToGitHub } from './services/githubSync';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { HierarchyManager } from './components/HierarchyManager';
import { StockMovements } from './components/StockMovements';
import { StockPosition } from './components/StockPosition';
import { LocationsManager } from './components/LocationsManager';
import { ReportsView } from './components/ReportsView';
import { PersistenceManager } from './components/PersistenceManager';
import { TechInfoModal } from './components/TechInfoModal';
import { Footer } from './components/Footer';

export default function App() {
  // Carregamento inicial do banco do localStorage (inicia vazio se nunca inicializado)
  const [database, setDatabase] = useState<DatabaseState>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Controle de Sincronização
  const [isSyncing, setIsSyncing] = useState(false);

  // Modais Globais
  const [showTechInfo, setShowTechInfo] = useState(false);
  const [quickMovementParams, setQuickMovementParams] = useState<{
    isOpen: boolean;
    type: MovementType;
    articleId?: string;
  }>({
    isOpen: false,
    type: 'ENTRADA',
  });

  // Salva no localStorage a cada atualização do estado
  useEffect(() => {
    saveDatabase(database);
  }, [database]);

  // Handler de Atualização Parcial
  const handleUpdateDatabase = (updater: (prev: DatabaseState) => DatabaseState) => {
    setDatabase((prev) => {
      const next = updater(prev);
      saveDatabase(next);
      return next;
    });
  };

  // Handler de Substituição Completa (Importação / Rollback / Reset)
  const handleReplaceDatabase = (newDb: DatabaseState) => {
    setDatabase(newDb);
    saveDatabase(newDb);
  };

  // Sincronização Rápida
  const handleQuickSync = async () => {
    setIsSyncing(true);
    await pushToGitHub(
      database,
      database.githubConfig,
      `sync(estoque): sincronização de rotina SENAI-SP [${new Date().toLocaleTimeString('pt-BR')}]`
    );
    setIsSyncing(false);
  };

  // Carregamento de Amostras para Teste Rápido
  const handleLoadSampleData = () => {
    const samples = generateSampleData();
    handleReplaceDatabase(samples);
  };

  // Abertura de Movimentação Rápida
  const handleOpenQuickMovement = (type: MovementType, articleId?: string) => {
    setActiveTab('movements');
    setQuickMovementParams({
      isOpen: true,
      type,
      articleId,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-neutral-900 flex flex-col font-sans">
      {/* 1. Cabeçalho Corporativo SENAI-SP */}
      <Header
        database={database}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickMovement={(type) => handleOpenQuickMovement(type)}
        onOpenTechInfo={() => setShowTechInfo(true)}
        isSyncing={isSyncing}
        onQuickSync={handleQuickSync}
      />

      {/* 2. Área Central de Trabalho (Sidebar + Conteúdo Principal) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Barra Lateral Institucional */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          database={database}
          onOpenTechInfo={() => setShowTechInfo(true)}
        />

        {/* Viewport Principal do Módulo Ativo */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              database={database}
              setActiveTab={setActiveTab}
              onOpenQuickMovement={handleOpenQuickMovement}
              onLoadSampleData={handleLoadSampleData}
            />
          )}

          {activeTab === 'hierarchy' && (
            <HierarchyManager
              database={database}
              onUpdateDatabase={handleUpdateDatabase}
              onRegisterMovementPrompt={(artId) => handleOpenQuickMovement('ENTRADA', artId)}
            />
          )}

          {activeTab === 'movements' && (
            <StockMovements
              key={`${quickMovementParams.type}_${quickMovementParams.articleId || 'default'}`}
              database={database}
              onUpdateDatabase={handleUpdateDatabase}
              initialMovementType={quickMovementParams.type}
              initialArticleId={quickMovementParams.articleId}
            />
          )}

          {activeTab === 'stock-position' && (
            <StockPosition
              database={database}
              onOpenQuickMovement={handleOpenQuickMovement}
            />
          )}

          {activeTab === 'locations' && (
            <LocationsManager
              database={database}
              onUpdateDatabase={handleUpdateDatabase}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView database={database} />
          )}

          {activeTab === 'persistence' && (
            <PersistenceManager
              database={database}
              onUpdateDatabase={handleUpdateDatabase}
              onReplaceDatabase={handleReplaceDatabase}
            />
          )}
        </main>
      </div>

      {/* 3. Rodapé Institucional com Responsabilidade Técnica de Gabriela Cares */}
      <Footer
        database={database}
        onOpenTechInfo={() => setShowTechInfo(true)}
      />

      {/* 4. Modal de Informações Técnicas e Responsabilidade */}
      <TechInfoModal
        isOpen={showTechInfo}
        onClose={() => setShowTechInfo(false)}
        database={database}
      />
    </div>
  );
}
