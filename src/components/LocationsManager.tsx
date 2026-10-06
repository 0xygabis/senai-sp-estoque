/**
 * Gestão de Localizações Físicas de Armazenamento - SENAI-SP SIGE
 * Cadastro de endereços do almoxarifado (Prédio, Rua, Estante, Nível) e conferência de itens alocados.
 * Responsável Técnica: Gabriela Cares
 */

import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Warehouse,
  Boxes,
  Trash2,
  ChevronRight,
  Package,
  Layers,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { DatabaseState, StorageLocation } from '../types/inventory';
import { generateLocationCode } from '../services/storage';

interface LocationsManagerProps {
  database: DatabaseState;
  onUpdateDatabase: (updater: (prev: DatabaseState) => DatabaseState) => void;
}

export const LocationsManager: React.FC<LocationsManagerProps> = ({
  database,
  onUpdateDatabase,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Form de Nova Localização
  const [locCode, setLocCode] = useState('');
  const [locName, setLocName] = useState('');
  const [locBuilding, setLocBuilding] = useState('Bloco Principal');
  const [locAisle, setLocAisle] = useState('Rua 01');
  const [locShelf, setLocShelf] = useState('Estante A');
  const [locLevel, setLocLevel] = useState('Nível 1');
  const [locNotes, setLocNotes] = useState('');

  const showFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) {
      showFeedback('Informe a descrição/nome da localização.', true);
      return;
    }

    const codeToUse = locCode.trim() || generateLocationCode(database.locations);

    if (database.locations.some((l) => l.code.toUpperCase() === codeToUse.toUpperCase())) {
      showFeedback(`Já existe uma localização cadastrada com o código ${codeToUse}.`, true);
      return;
    }

    const newLoc: StorageLocation = {
      id: `loc_${Date.now()}`,
      code: codeToUse,
      name: locName.trim(),
      building: locBuilding.trim() || 'Bloco Central',
      aisle: locAisle.trim() || 'Rua Geral',
      shelf: locShelf.trim() || 'Estante 01',
      level: locLevel.trim() || 'Nível 1',
      notes: locNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    onUpdateDatabase((prev) => ({
      ...prev,
      locations: [...prev.locations, newLoc],
    }));

    // Reset
    setLocCode('');
    setLocName('');
    setLocNotes('');
    setShowCreateModal(false);
    showFeedback(`Localização "${newLoc.name}" (${codeToUse}) cadastrada com sucesso!`);
  };

  const handleDeleteLocation = (locationId: string) => {
    const hasArticles = database.articles.some((a) => a.defaultLocationId === locationId);
    if (hasArticles) {
      showFeedback(
        'Não é possível excluir esta localização: existem artigos alocados nela. Realoque os artigos antes.',
        true
      );
      return;
    }

    onUpdateDatabase((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l.id !== locationId),
    }));

    if (selectedLocation?.id === locationId) {
      setSelectedLocation(null);
    }
    showFeedback('Localização removida com sucesso.');
  };

  const filteredLocations = database.locations.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.building.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Artigos alocados na localização selecionada
  const articlesInSelectedLocation = selectedLocation
    ? database.articles.filter((a) => a.defaultLocationId === selectedLocation.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-[#E30613]" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Localizações de Armazenamento & Endereçamento
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Mapeamento físico do almoxarifado (Prédio, Rua, Estante, Nível) com rastreamento por item.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar localização..."
              className="text-xs bg-neutral-50 border border-neutral-300 rounded-lg pl-8 pr-3 py-1.5 text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden w-56"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Localização</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all ${
            feedback.error
              ? 'bg-red-50 text-[#E30613] border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {feedback.error ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: Lista de Localizações + Detalhes dos Itens Alocados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Cartões de Localizações */}
        <div className="lg:col-span-7 space-y-3">
          {filteredLocations.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-neutral-500 shadow-xs">
              <MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-medium">Nenhuma localização de armazenamento encontrada.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-xs text-[#E30613] font-bold hover:underline"
              >
                Cadastrar primeiro endereço de almoxarifado &rarr;
              </button>
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const allocatedArticles = database.articles.filter(
                (a) => a.defaultLocationId === loc.id
              );
              const totalUnits = allocatedArticles.reduce(
                (acc, a) => acc + (a.currentStock || 0),
                0
              );
              const isSelected = selectedLocation?.id === loc.id;

              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-4 bg-white border rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#E30613] ring-2 ring-red-100'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0 font-mono font-bold text-xs mt-0.5">
                      <MapPin className="w-4 h-4 text-[#E30613]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-900">
                          {loc.code}
                        </span>
                        <span className="text-neutral-300" aria-hidden="true">·</span>
                        <span className="text-xs font-bold text-neutral-800">{loc.name}</span>
                      </div>

                      <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>{loc.building}</span>
                        <span aria-hidden="true">/</span>
                        <span>{loc.aisle}</span>
                        <span aria-hidden="true">/</span>
                        <span>{loc.shelf}</span>
                        <span aria-hidden="true">/</span>
                        <span className="text-neutral-700 font-semibold">{loc.level}</span>
                      </div>

                      {loc.notes && (
                        <div className="text-[11px] text-neutral-400 mt-1 italic">
                          "{loc.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-neutral-900 tabular-nums">
                        {allocatedArticles.length} {allocatedArticles.length === 1 ? 'artigo' : 'artigos'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono tabular-nums">
                        {totalUnits} unidades
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocation(loc.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-[#E30613] rounded-md transition-colors"
                      title="Excluir localização"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Coluna Direita: Artigos Armazenados no Endereço Selecionado */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#E30613]" />
                <h3 className="text-sm font-bold text-neutral-900">
                  {selectedLocation
                    ? `Itens em ${selectedLocation.code}`
                    : 'Selecione uma Localização'}
                </h3>
              </div>
            </div>

            {selectedLocation ? (
              <div className="space-y-3">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <div className="font-bold text-neutral-900">{selectedLocation.name}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {selectedLocation.building} · {selectedLocation.aisle} · {selectedLocation.shelf} · {selectedLocation.level}
                  </div>
                </div>

                {articlesInSelectedLocation.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 text-xs">
                    Nenhum artigo atualmente atribuído a este endereço de estoque.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto pr-1">
                    {articlesInSelectedLocation.map((art) => (
                      <div key={art.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-mono text-xs font-bold text-neutral-900">
                            {art.code}
                          </div>
                          <div className="text-xs text-neutral-700 font-medium truncate max-w-[200px]">
                            {art.name}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-neutral-900 tabular-nums">
                            {art.currentStock} {art.unit}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Mín: {art.minStock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-400 text-xs">
                Clique em qualquer localização na lista ao lado para ver os artigos e quantidades armazenadas naquele endereço.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: NOVA LOCALIZAÇÃO */}
      {/* ==================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateLocation}
            className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-neutral-200"
          >
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Cadastrar Novo Endereço de Armazenamento
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Código sugerido: <span className="font-mono font-bold text-[#E30613]">{generateLocationCode(database.locations)}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Código do Endereço
                </label>
                <input
                  type="text"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  placeholder={generateLocationCode(database.locations)}
                  className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-bold text-neutral-900 focus:bg-white focus:border-[#E30613] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Nome / Identificador do Endereço *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Ex: Almoxarifado Central - Prateleira A1"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Prédio / Bloco
                  </label>
                  <input
                    type="text"
                    value={locBuilding}
                    onChange={(e) => setLocBuilding(e.target.value)}
                    placeholder="Ex: Bloco A - Mecânica"
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Corredor / Rua
                  </label>
                  <input
                    type="text"
                    value={locAisle}
                    onChange={(e) => setLocAisle(e.target.value)}
                    placeholder="Ex: Rua 02"
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Estante / Armário
                  </label>
                  <input
                    type="text"
                    value={locShelf}
                    onChange={(e) => setLocShelf(e.target.value)}
                    placeholder="Ex: Estante 03"
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Nível / Prateleira
                  </label>
                  <input
                    type="text"
                    value={locLevel}
                    onChange={(e) => setLocLevel(e.target.value)}
                    placeholder="Ex: Nível 2 / Vão B"
                    className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Observações / Recomendações
                </label>
                <textarea
                  rows={2}
                  value={locNotes}
                  onChange={(e) => setLocNotes(e.target.value)}
                  placeholder="Ex: Armário com controle de temperatura ou trancado com chave"
                  className="w-full text-xs bg-white border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:border-[#E30613] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E30613] hover:bg-[#C0040F] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Salvar Localização
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
