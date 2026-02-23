'use client';

import { useState } from 'react';
import { Search, MapPin, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RelayPoint } from '@/lib/schemas/checkout.schema';

// TODO: Remplacer par l'API Mondial Relay en production
// https://api.mondialrelay.com/Web_Services.asmx (SOAP) ou partenaire REST

/** Mock relay points indexed by postal code prefix (2 first digits) */
const MOCK_RELAY_POINTS: Record<string, RelayPoint[]> = {
  // --- Paris (75xxx) ---
  '75': [
    // Mondial Relay
    { id: 'MR-75001', name: 'Tabac Presse Châtelet', address: '12 rue de Rivoli', city: 'Paris', postalCode: '75001', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'MR-75002', name: 'Épicerie du Marais', address: '34 boulevard de Sébastopol', city: 'Paris', postalCode: '75002', openingHours: 'Lun-Dim 7h-22h' },
    { id: 'MR-75003', name: 'Librairie République', address: '8 rue du Temple', city: 'Paris', postalCode: '75003', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-75004', name: 'Pressing Opéra', address: '22 rue du 4 Septembre', city: 'Paris', postalCode: '75002', openingHours: 'Lun-Sam 8h-19h' },
    { id: 'RC-75005', name: 'Superette Bastille', address: '6 rue de la Roquette', city: 'Paris', postalCode: '75011', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'RC-75006', name: 'Tabac Nation', address: '1 place de la Nation', city: 'Paris', postalCode: '75011', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-75007', name: 'Pharmacie Saint-Michel', address: '15 boulevard Saint-Michel', city: 'Paris', postalCode: '75005', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-75008', name: 'Fleuriste Montparnasse', address: '89 boulevard du Montparnasse', city: 'Paris', postalCode: '75006', openingHours: 'Lun-Sam 9h-19h30' },
    { id: 'CP-75009', name: 'Boulangerie Pigalle', address: '3 rue de Douai', city: 'Paris', postalCode: '75009', openingHours: 'Lun-Sam 7h-20h' },
  ],

  // --- Lyon (69xxx) ---
  '69': [
    // Mondial Relay
    { id: 'MR-69001', name: 'Épicerie Bellecour', address: '15 place Bellecour', city: 'Lyon', postalCode: '69002', openingHours: 'Lun-Sam 8h-21h' },
    { id: 'MR-69002', name: 'Tabac Croix-Rousse', address: '40 boulevard de la Croix-Rousse', city: 'Lyon', postalCode: '69004', openingHours: 'Lun-Dim 7h-20h' },
    { id: 'MR-69003', name: 'Librairie Guillotière', address: '8 avenue Berthelot', city: 'Lyon', postalCode: '69007', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-69004', name: 'Superette Part-Dieu', address: '17 rue du Docteur Bouchut', city: 'Lyon', postalCode: '69003', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-69005', name: 'Pressing Confluence', address: '2 cours Charlemagne', city: 'Lyon', postalCode: '69002', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-69006', name: 'Tabac Vieux-Lyon', address: '10 rue Saint-Jean', city: 'Lyon', postalCode: '69005', openingHours: 'Lun-Sam 7h30-19h30' },
    // Chronopost Pickup
    { id: 'CP-69007', name: 'Pharmacie Terreaux', address: '3 place des Terreaux', city: 'Lyon', postalCode: '69001', openingHours: 'Lun-Sam 9h-19h30' },
    { id: 'CP-69008', name: 'Fleuriste Monplaisir', address: '56 avenue Berthelot', city: 'Lyon', postalCode: '69008', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-69009', name: 'Boulangerie Brotteaux', address: '102 boulevard des Brotteaux', city: 'Lyon', postalCode: '69006', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Marseille (13xxx) ---
  '13': [
    // Mondial Relay
    { id: 'MR-13001', name: 'Tabac Vieux-Port', address: '2 quai du Port', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 7h-20h' },
    { id: 'MR-13002', name: 'Épicerie Noailles', address: '18 rue de la République', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 8h-21h' },
    { id: 'MR-13003', name: 'Pressing Castellane', address: '4 avenue du Prado', city: 'Marseille', postalCode: '13006', openingHours: 'Lun-Sam 8h-19h' },
    // Relais Colis
    { id: 'RC-13004', name: 'Superette Cours Julien', address: '20 cours Julien', city: 'Marseille', postalCode: '13006', openingHours: 'Lun-Dim 8h-22h' },
    { id: 'RC-13005', name: 'Librairie Canebière', address: '45 la Canebière', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'RC-13006', name: 'Tabac Belsunce', address: '7 cours Belsunce', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 7h30-20h' },
    // Chronopost Pickup
    { id: 'CP-13007', name: 'Pharmacie Réformés', address: '1 place des Réformés', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-13008', name: 'Fleuriste Longchamp', address: '23 boulevard Longchamp', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-13009', name: "Boulangerie Endoume", address: "12 rue d'Endoume", city: 'Marseille', postalCode: '13007', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Bordeaux (33xxx) ---
  '33': [
    // Mondial Relay
    { id: 'MR-33001', name: 'Tabac Place de la Bourse', address: '2 place de la Bourse', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-33002', name: 'Épicerie Saint-Pierre', address: '14 place du Parlement', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'MR-33003', name: 'Librairie Sainte-Catherine', address: '65 rue Sainte-Catherine', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-33004', name: 'Pressing Capucins', address: '3 place des Capucins', city: 'Bordeaux', postalCode: '33800', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-33005', name: 'Superette Chartrons', address: '40 cours du Médoc', city: 'Bordeaux', postalCode: '33300', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-33006', name: 'Tabac Victoire', address: '1 place de la Victoire', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-33007', name: 'Pharmacie Grand-Théâtre', address: '5 allées de Tourny', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-33008', name: 'Fleuriste Gambetta', address: '22 cours Gambetta', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-33009', name: 'Boulangerie Bastide', address: '8 rue Lucien Faure', city: 'Bordeaux', postalCode: '33100', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Toulouse (31xxx) ---
  '31': [
    // Mondial Relay
    { id: 'MR-31001', name: 'Tabac Capitole', address: '1 place du Capitole', city: 'Toulouse', postalCode: '31000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-31002', name: 'Épicerie Saint-Sernin', address: '20 rue du Taur', city: 'Toulouse', postalCode: '31000', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'MR-31003', name: 'Librairie Wilson', address: '15 allées Jean Jaurès', city: 'Toulouse', postalCode: '31000', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-31004', name: 'Pressing Esquirol', address: '3 place Esquirol', city: 'Toulouse', postalCode: '31000', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-31005', name: 'Superette Carmes', address: '8 rue des Carmes', city: 'Toulouse', postalCode: '31000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-31006', name: 'Tabac Saint-Georges', address: '2 place Saint-Georges', city: 'Toulouse', postalCode: '31000', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-31007', name: 'Pharmacie Saint-Cyprien', address: '45 allées Charles de Fitte', city: 'Toulouse', postalCode: '31300', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-31008', name: 'Fleuriste Minimes', address: '12 avenue des Minimes', city: 'Toulouse', postalCode: '31000', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-31009', name: "Boulangerie Patte d'Oie", address: '6 chemin de la Junquière', city: 'Toulouse', postalCode: '31300', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Nice (06xxx) ---
  '06': [
    // Mondial Relay
    { id: 'MR-06001', name: 'Tabac Masséna', address: '4 place Masséna', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-06002', name: 'Épicerie Vieux-Nice', address: '12 cours Saleya', city: 'Nice', postalCode: '06300', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'MR-06003', name: 'Librairie Promenade', address: '50 promenade des Anglais', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-06004', name: 'Pressing Cimiez', address: '5 avenue de Cimiez', city: 'Nice', postalCode: '06000', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-06005', name: 'Superette Jean Médecin', address: '30 avenue Jean Médecin', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-06006', name: 'Tabac Garibaldi', address: '7 place Garibaldi', city: 'Nice', postalCode: '06300', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-06007', name: 'Pharmacie Musiciens', address: '14 rue de France', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-06008', name: 'Fleuriste Gambetta', address: '22 avenue Gambetta', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-06009', name: 'Boulangerie Libération', address: '9 avenue de la Libération', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Nantes (44xxx) ---
  '44': [
    // Mondial Relay
    { id: 'MR-44001', name: 'Tabac Commerce', address: '3 place du Commerce', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-44002', name: 'Épicerie Bouffay', address: '18 place du Bouffay', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'MR-44003', name: 'Librairie Graslin', address: '8 place Graslin', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-44004', name: "Pressing Île de Nantes", address: '15 boulevard de la Prairie-au-Duc', city: 'Nantes', postalCode: '44200', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-44005', name: 'Superette Talensac', address: '9 rue de Talensac', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-44006', name: 'Tabac Duchesse Anne', address: '2 place de la Duchesse Anne', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-44007', name: 'Pharmacie Canclaux', address: '5 rue de Gigant', city: 'Nantes', postalCode: '44100', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-44008', name: 'Fleuriste Hauts-Pavés', address: '24 boulevard des Hauts-Pavés', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-44009', name: 'Boulangerie Erdre', address: '6 rue de Launay', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Strasbourg (67xxx) ---
  '67': [
    // Mondial Relay
    { id: 'MR-67001', name: 'Tabac Place Kléber', address: '1 place Kléber', city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-67002', name: 'Épicerie Petite France', address: '10 rue du Bain-aux-Plantes', city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'MR-67003', name: 'Librairie Gutenberg', address: '4 place Gutenberg', city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-67004', name: 'Pressing Cathédrale', address: '6 place de la Cathédrale', city: 'Strasbourg', postalCode: '67000', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-67005', name: 'Superette Neudorf', address: '34 route de Colmar', city: 'Strasbourg', postalCode: '67100', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-67006', name: 'Tabac Contades', address: '5 allée de la Robertsau', city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-67007', name: "Pharmacie Homme de Fer", address: "1 place de l'Homme de Fer", city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-67008', name: 'Fleuriste Cronenbourg', address: '12 avenue du Neuhof', city: 'Strasbourg', postalCode: '67200', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-67009', name: 'Boulangerie Orangerie', address: '3 allée de la Robertsau', city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Lille (59xxx) ---
  '59': [
    // Mondial Relay
    { id: 'MR-59001', name: 'Tabac Grand-Place', address: '2 place du Général de Gaulle', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-59002', name: 'Épicerie Vieux-Lille', address: '15 rue de la Monnaie', city: 'Lille', postalCode: '59800', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'MR-59003', name: 'Librairie République', address: '6 place de la République', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-59004', name: 'Pressing Wazemmes', address: '18 place Nouvelle Aventure', city: 'Lille', postalCode: '59000', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-59005', name: 'Superette Gambetta', address: '40 rue Gambetta', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-59006', name: 'Tabac Fives', address: '7 rue Pierre Legrand', city: 'Lille', postalCode: '59800', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-59007', name: 'Pharmacie Solférino', address: '3 boulevard de la Liberté', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-59008', name: 'Fleuriste Moulins', address: '9 rue du Faubourg de Béthune', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-59009', name: 'Boulangerie Bois-Blancs', address: '5 avenue du Peuple Belge', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Rennes (35xxx) ---
  '35': [
    // Mondial Relay
    { id: 'MR-35001', name: 'Tabac République', address: '1 place de la République', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-35002', name: 'Épicerie Thabor', address: '20 avenue du Thabor', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Dim 8h-21h' },
    { id: 'MR-35003', name: 'Librairie Sainte-Anne', address: '5 place Sainte-Anne', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Sam 9h-19h' },
    // Relais Colis
    { id: 'RC-35004', name: "Pressing Colombier", address: "12 rue d'Estrées", city: 'Rennes', postalCode: '35000', openingHours: 'Mar-Sam 9h-18h30' },
    { id: 'RC-35005', name: 'Superette Hoche', address: '8 rue Hoche', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'RC-35006', name: 'Tabac Madeleine', address: '3 place de la Madeleine', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Sam 7h-20h' },
    // Chronopost Pickup
    { id: 'CP-35007', name: 'Pharmacie Vilaine', address: '6 quai Chateaubriand', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Sam 9h-20h' },
    { id: 'CP-35008', name: 'Fleuriste Beaulieu', address: '14 avenue Charles Tillon', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Sam 9h-19h' },
    { id: 'CP-35009', name: 'Boulangerie Bréquigny', address: '2 boulevard de Verdun', city: 'Rennes', postalCode: '35200', openingHours: 'Lun-Dim 7h-20h' },
  ],

  // --- Caen (14xxx) — conservé pour rétrocompatibilité ---
  '14': [
    { id: 'MR-14001', name: 'Tabac du Centre', address: '5 place de la République', city: 'Caen', postalCode: '14000', openingHours: 'Lun-Sam 7h30-19h30' },
    { id: 'RC-14002', name: 'Superette Vaucelles', address: '22 avenue Henry Cheron', city: 'Caen', postalCode: '14000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'CP-14003', name: 'Pressing Malherbe', address: '3 rue Malherbe', city: 'Caen', postalCode: '14000', openingHours: 'Mar-Sam 9h-18h' },
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
