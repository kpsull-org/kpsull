'use client';

import { useState } from 'react';
import { Search, MapPin, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RelayPoint } from '@/lib/schemas/checkout.schema';

/** Mock relay points indexed by postal code prefix (2 first digits) */
const MOCK_RELAY_POINTS: Record<string, RelayPoint[]> = {
  '75': [
    { id: 'PR-75001', name: 'Tabac Presse Châtelet', address: '12 rue de Rivoli', city: 'Paris', postalCode: '75001', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'PR-75002', name: 'Épicerie du Marais', address: '34 boulevard de Sébastopol', city: 'Paris', postalCode: '75002', openingHours: 'Lun-Dim 7h-22h' },
    { id: 'PR-75003', name: 'Librairie République', address: '8 rue du Temple', city: 'Paris', postalCode: '75003', openingHours: 'Lun-Sam 9h-19h' },
  ],
  '14': [
    { id: 'PR-14001', name: 'Tabac du Centre', address: '5 place de la République', city: 'Caen', postalCode: '14000', openingHours: 'Lun-Sam 7h30-19h30' },
    { id: 'PR-14002', name: 'Superette Vaucelles', address: '22 avenue Henry Cheron', city: 'Caen', postalCode: '14000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'PR-14003', name: 'Pressing Malherbe', address: '3 rue Malherbe', city: 'Caen', postalCode: '14000', openingHours: 'Mar-Sam 9h-18h' },
  ],
  '69': [
    { id: 'PR-69001', name: 'Épicerie Bellecour', address: '15 place Bellecour', city: 'Lyon', postalCode: '69002', openingHours: 'Lun-Sam 8h-21h' },
    { id: 'PR-69002', name: 'Tabac Croix-Rousse', address: '40 boulevard de la Croix-Rousse', city: 'Lyon', postalCode: '69004', openingHours: 'Lun-Dim 7h-20h' },
    { id: 'PR-69003', name: 'Librairie Guillotière', address: '8 avenue Berthelot', city: 'Lyon', postalCode: '69007', openingHours: 'Lun-Sam 9h-19h' },
  ],
  '13': [
    { id: 'PR-13001', name: 'Tabac Vieux-Port', address: '2 quai du Port', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 7h-20h' },
    { id: 'PR-13002', name: 'Epicerie Noailles', address: '18 rue de la République', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 8h-21h' },
  ],
};

const DEFAULT_RELAY_POINTS: RelayPoint[] = [
  { id: 'PR-DEF-01', name: 'Bureau de Tabac Central', address: '1 place de la Mairie', city: 'Votre ville', postalCode: '00000', openingHours: 'Lun-Sam 8h-19h' },
  { id: 'PR-DEF-02', name: 'Supermarché du Centre', address: '5 rue Principale', city: 'Votre ville', postalCode: '00000', openingHours: 'Lun-Dim 8h-20h' },
  { id: 'PR-DEF-03', name: 'Pressing Pressing', address: '12 avenue de la Gare', city: 'Votre ville', postalCode: '00000', openingHours: 'Mar-Sam 9h-18h' },
];

function getMockRelayPoints(postalCode: string): RelayPoint[] {
  const prefix = postalCode.substring(0, 2);
  return MOCK_RELAY_POINTS[prefix] ?? DEFAULT_RELAY_POINTS;
}

interface RelayPointSelectorProps {
  readonly carrierName: string;
  readonly selectedRelayPoint: RelayPoint | null;
  readonly onSelect: (point: RelayPoint) => void;
}

/**
 * RelayPointSelector
 *
 * Composant de sélection d'un point relais.
 * Recherche par code postal (données mock en mode démo).
 * En production, les APIs Mondial Relay / Relais Colis remplaceraient le mock.
 */
export function RelayPointSelector({ carrierName, selectedRelayPoint, onSelect }: RelayPointSelectorProps) {
  const [postalCode, setPostalCode] = useState('');
  const [searchedPostalCode, setSearchedPostalCode] = useState('');
  const [results, setResults] = useState<RelayPoint[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!/^\d{5}$/.test(postalCode)) return;
    const points = getMockRelayPoints(postalCode);
    setResults(points);
    setSearchedPostalCode(postalCode);
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/3 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
        <p className="text-sm font-medium font-sans">
          Sélectionner un point {carrierName}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          placeholder="Code postal (ex: 75001)"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value.replaceAll(/\D/g, '').slice(0, 5))}
          onKeyDown={handleKeyDown}
          className="font-sans"
          aria-label="Code postal pour rechercher un point relais"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={postalCode.length !== 5}
          className="flex-shrink-0"
        >
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-sans">
            {results.length} point{results.length > 1 ? 's' : ''} relais trouvé{results.length > 1 ? 's' : ''} près de {searchedPostalCode}
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((point) => {
              const isSelected = selectedRelayPoint?.id === point.id;
              return (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => onSelect(point)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all text-sm',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/20'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2 flex-shrink-0 mt-0.5',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold font-sans truncate">{point.name}</p>
                    <p className="text-muted-foreground font-sans">{point.address}</p>
                    <p className="text-muted-foreground font-sans">{point.postalCode} {point.city}</p>
                    {point.openingHours && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground/80 mt-1 font-sans">
                        <Clock className="h-3 w-3" />
                        {point.openingHours}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected summary */}
      {selectedRelayPoint && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-sm">
          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 font-sans">{selectedRelayPoint.name}</p>
            <p className="text-green-700 font-sans">{selectedRelayPoint.address}, {selectedRelayPoint.postalCode} {selectedRelayPoint.city}</p>
          </div>
        </div>
      )}
    </div>
  );
}
