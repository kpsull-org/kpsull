'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, MapPin, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RelayPoint } from '@/lib/schemas/checkout.schema';

// TODO (production): Remplacer Brand "BDTEST13" par le Brand ID officiel Mondial Relay
// Obtenir les credentials partenaire : https://www.mondialrelay.fr/nous-rejoindre/devenir-partenaire/
// Documentation widget : https://widget.mondialrelay.com/

type MRSelectedData = {
  ID: string;
  Nom: string;
  Adresse1: string;
  Ville: string;
  CP: string;
};

type MROptions = {
  Target: string;
  Brand: string;
  PostCode: string;
  ColLivMod: string;
  AllowedCountries: string;
  EnableGmap: boolean;
  Responsive: boolean;
  OnParcelShopSelected: (data: MRSelectedData) => void;
};

type JQueryMR = (selector: string) => { MR_ParcelShopPicker: (options: MROptions) => void };

const MR_WIDGET_CSS =
  'https://widget.mondialrelay.com/parcelshop-picker/v4_0/CSS/mondialrelay-widget-v4_0.min.css';
const MR_WIDGET_JS =
  'https://widget.mondialrelay.com/parcelshop-picker/v4_0/jquery.plugin.mondialrelay.parcelshoppicker.min.js';
const JQUERY_CDN = 'https://code.jquery.com/jquery-3.7.1.min.js';

/**
 * Chef-lieu de chaque département français (code 2 chiffres → ville principale).
 * Utilisé pour le fallback quand aucun point relais mock n'est défini pour ce département.
 */
const DEPARTMENT_CHIEF_CITY: Record<string, string> = {
  '01': 'Bourg-en-Bresse', '02': 'Laon', '03': 'Moulins', '04': 'Digne-les-Bains',
  '05': 'Gap', '06': 'Nice', '07': 'Privas', '08': 'Charleville-Mézières',
  '09': 'Foix', '10': 'Troyes', '11': 'Carcassonne', '12': 'Rodez',
  '13': 'Marseille', '14': 'Caen', '15': 'Aurillac', '16': 'Angoulême',
  '17': 'La Rochelle', '18': 'Bourges', '19': 'Tulle', '20': 'Ajaccio',
  '21': 'Dijon', '22': 'Saint-Brieuc', '23': 'Guéret', '24': 'Périgueux',
  '25': 'Besançon', '26': 'Valence', '27': 'Évreux', '28': 'Chartres',
  '29': 'Quimper', '30': 'Nîmes', '31': 'Toulouse', '32': 'Auch',
  '33': 'Bordeaux', '34': 'Montpellier', '35': 'Rennes', '36': 'Châteauroux',
  '37': 'Tours', '38': 'Grenoble', '39': 'Lons-le-Saunier', '40': 'Mont-de-Marsan',
  '41': 'Blois', '42': 'Saint-Étienne', '43': 'Le Puy-en-Velay', '44': 'Nantes',
  '45': 'Orléans', '46': 'Cahors', '47': 'Agen', '48': 'Mende',
  '49': 'Angers', '50': 'Saint-Lô', '51': 'Châlons-en-Champagne', '52': 'Chaumont',
  '53': 'Laval', '54': 'Nancy', '55': 'Bar-le-Duc', '56': 'Vannes',
  '57': 'Metz', '58': 'Nevers', '59': 'Lille', '60': 'Beauvais',
  '61': 'Alençon', '62': 'Arras', '63': 'Clermont-Ferrand', '64': 'Pau',
  '65': 'Tarbes', '66': 'Perpignan', '67': 'Strasbourg', '68': 'Colmar',
  '69': 'Lyon', '70': 'Vesoul', '71': 'Mâcon', '72': 'Le Mans',
  '73': 'Chambéry', '74': 'Annecy', '75': 'Paris', '76': 'Rouen',
  '77': 'Melun', '78': 'Versailles', '79': 'Niort', '80': 'Amiens',
  '81': 'Albi', '82': 'Montauban', '83': 'Toulon', '84': 'Avignon',
  '85': 'La Roche-sur-Yon', '86': 'Poitiers', '87': 'Limoges', '88': 'Épinal',
  '89': 'Auxerre', '90': 'Belfort', '91': 'Évry-Courcouronnes', '92': 'Nanterre',
  '93': 'Bobigny', '94': 'Créteil', '95': 'Cergy', '97': 'Outre-Mer',
};

/** Mock relay points — utilisés en fallback si le widget ne se charge pas */
const FALLBACK_RELAY_POINTS: Record<string, RelayPoint[]> = {
  '06': [
    { id: 'MR-06001', name: 'Tabac Masséna', address: '4 place Masséna', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-06002', name: 'Presse Gambetta', address: '18 av. Gambetta', city: 'Nice', postalCode: '06000', openingHours: 'Lun-Sam 7h-19h30' },
  ],
  '13': [
    { id: 'MR-13001', name: 'Tabac Vieux-Port', address: '2 quai du Port', city: 'Marseille', postalCode: '13001', openingHours: 'Lun-Sam 7h-20h' },
    { id: 'MR-13006', name: 'Épicerie Cours Julien', address: '20 cours Julien', city: 'Marseille', postalCode: '13006', openingHours: 'Lun-Dim 8h-22h' },
    { id: 'MR-13008', name: 'Tabac Prado', address: '135 av. du Prado', city: 'Marseille', postalCode: '13008', openingHours: 'Lun-Sam 7h-20h' },
  ],
  '14': [
    { id: 'MR-14001', name: 'Tabac de la Paix', address: '3 place de la République', city: 'Caen', postalCode: '14000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-14002', name: 'Presse Saint-Pierre', address: '12 rue Saint-Pierre', city: 'Caen', postalCode: '14000', openingHours: 'Lun-Sam 8h-19h' },
  ],
  '21': [
    { id: 'MR-21001', name: 'Tabac Darcy', address: '1 place Darcy', city: 'Dijon', postalCode: '21000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-21002', name: 'Épicerie Clemenceau', address: '8 av. Clemenceau', city: 'Dijon', postalCode: '21000', openingHours: 'Lun-Dim 8h-21h' },
  ],
  '29': [
    { id: 'MR-29001', name: 'Tabac Cordeliers', address: '2 rue des Cordeliers', city: 'Quimper', postalCode: '29000', openingHours: 'Lun-Sam 7h30-19h30' },
    { id: 'MR-29002', name: 'Presse Brest Centre', address: '15 rue de Siam', city: 'Brest', postalCode: '29200', openingHours: 'Lun-Sam 7h-20h' },
  ],
  '31': [
    { id: 'MR-31001', name: 'Tabac Capitole', address: '1 place du Capitole', city: 'Toulouse', postalCode: '31000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-31002', name: 'Épicerie Saint-Cyprien', address: '22 allées Charles-de-Fitte', city: 'Toulouse', postalCode: '31300', openingHours: 'Lun-Dim 8h-22h' },
  ],
  '33': [
    { id: 'MR-33001', name: 'Tabac Place de la Bourse', address: '2 place de la Bourse', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-33002', name: 'Épicerie Chartrons', address: '5 cours du Médoc', city: 'Bordeaux', postalCode: '33000', openingHours: 'Lun-Dim 8h-21h' },
  ],
  '34': [
    { id: 'MR-34001', name: 'Tabac Comédie', address: '3 place de la Comédie', city: 'Montpellier', postalCode: '34000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-34002', name: 'Presse Antigone', address: '10 bd du Jeu-de-Paume', city: 'Montpellier', postalCode: '34000', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '35': [
    { id: 'MR-35001', name: 'Tabac République', address: '6 place de la République', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-35002', name: 'Épicerie Thabor', address: '14 rue Nantaise', city: 'Rennes', postalCode: '35000', openingHours: 'Lun-Dim 8h-21h' },
  ],
  '38': [
    { id: 'MR-38001', name: 'Tabac Victor Hugo', address: '2 place Victor-Hugo', city: 'Grenoble', postalCode: '38000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-38002', name: 'Presse Championnet', address: '8 rue Championnet', city: 'Grenoble', postalCode: '38000', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '44': [
    { id: 'MR-44001', name: 'Tabac Commerce', address: '3 place du Commerce', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-44002', name: 'Épicerie Bouffay', address: '12 rue de la Juiverie', city: 'Nantes', postalCode: '44000', openingHours: 'Lun-Dim 8h-22h' },
  ],
  '45': [
    { id: 'MR-45001', name: 'Tabac Martroi', address: '1 place du Martroi', city: 'Orléans', postalCode: '45000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-45002', name: 'Presse Saint-Charles', address: '6 rue Saint-Charles', city: 'Orléans', postalCode: '45000', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '49': [
    { id: 'MR-49001', name: 'Tabac Ralliement', address: '4 place du Ralliement', city: 'Angers', postalCode: '49000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-49002', name: 'Épicerie Doutre', address: '8 place de la Laiterie', city: 'Angers', postalCode: '49100', openingHours: 'Lun-Dim 8h-21h' },
  ],
  '51': [
    { id: 'MR-51001', name: 'Tabac République', address: '5 place de la République', city: 'Reims', postalCode: '51100', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-51002', name: 'Presse Erlon', address: '22 place d\'Erlon', city: 'Reims', postalCode: '51100', openingHours: 'Lun-Sam 8h-20h' },
  ],
  '54': [
    { id: 'MR-54001', name: 'Tabac Stanislas', address: '2 place Stanislas', city: 'Nancy', postalCode: '54000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-54002', name: 'Presse Carnot', address: '16 rue Carnot', city: 'Nancy', postalCode: '54000', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '57': [
    { id: 'MR-57001', name: 'Tabac Gardon', address: '8 place du Gardon', city: 'Metz', postalCode: '57000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-57002', name: 'Épicerie Saint-Étienne', address: '3 rue des Jardins', city: 'Metz', postalCode: '57000', openingHours: 'Lun-Dim 8h-21h' },
  ],
  '59': [
    { id: 'MR-59001', name: 'Tabac Grand-Place', address: '2 place du Gén. de Gaulle', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-59002', name: 'Presse Solférino', address: '10 rue Solférino', city: 'Lille', postalCode: '59000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'MR-59003', name: 'Épicerie Vieux-Lille', address: '4 rue de la Monnaie', city: 'Lille', postalCode: '59800', openingHours: 'Lun-Dim 8h-22h' },
  ],
  '63': [
    { id: 'MR-63001', name: 'Tabac Jaude', address: '1 place de Jaude', city: 'Clermont-Ferrand', postalCode: '63000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-63002', name: 'Presse Blatin', address: '6 av. Blatin', city: 'Clermont-Ferrand', postalCode: '63000', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '67': [
    { id: 'MR-67001', name: 'Tabac Place Kléber', address: '1 place Kléber', city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-67002', name: 'Presse Petite France', address: '12 quai Saint-Thomas', city: 'Strasbourg', postalCode: '67000', openingHours: 'Lun-Sam 8h-20h' },
  ],
  '69': [
    { id: 'MR-69002', name: 'Épicerie Bellecour', address: '15 place Bellecour', city: 'Lyon', postalCode: '69002', openingHours: 'Lun-Sam 8h-21h' },
    { id: 'MR-69004', name: 'Tabac Croix-Rousse', address: '40 bd de la Croix-Rousse', city: 'Lyon', postalCode: '69004', openingHours: 'Lun-Dim 7h-20h' },
    { id: 'MR-69006', name: 'Presse Confluence', address: '2 cours Charlemagne', city: 'Lyon', postalCode: '69002', openingHours: 'Lun-Sam 9h-20h' },
  ],
  '72': [
    { id: 'MR-72001', name: 'Tabac République', address: '2 place de la République', city: 'Le Mans', postalCode: '72000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-72002', name: 'Presse Jacobins', address: '8 rue des Jacobins', city: 'Le Mans', postalCode: '72000', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '74': [
    { id: 'MR-74001', name: 'Tabac Bonlieu', address: '3 rue Jean-Jaurès', city: 'Annecy', postalCode: '74000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-74002', name: 'Épicerie Vieille Ville', address: '10 rue Sainte-Claire', city: 'Annecy', postalCode: '74000', openingHours: 'Lun-Dim 8h-21h' },
  ],
  '75': [
    { id: 'MR-75001', name: 'Tabac Châtelet', address: '12 rue de Rivoli', city: 'Paris', postalCode: '75001', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'MR-75003', name: 'Épicerie du Marais', address: '34 bd de Sébastopol', city: 'Paris', postalCode: '75003', openingHours: 'Lun-Dim 7h-22h' },
    { id: 'MR-75011', name: 'Tabac Nation', address: '1 place de la Nation', city: 'Paris', postalCode: '75011', openingHours: 'Lun-Sam 7h-20h' },
  ],
  '76': [
    { id: 'MR-76001', name: 'Tabac Vieux-Marché', address: '2 place du Vieux-Marché', city: 'Rouen', postalCode: '76000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-76002', name: 'Presse Saint-Sever', address: '10 bd de l\'Yser', city: 'Rouen', postalCode: '76100', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '83': [
    { id: 'MR-83001', name: 'Tabac Liberté', address: '5 place de la Liberté', city: 'Toulon', postalCode: '83000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-83002', name: 'Presse Mayol', address: '18 av. du Maréchal-Leclerc', city: 'Toulon', postalCode: '83000', openingHours: 'Lun-Sam 8h-19h30' },
  ],
  '84': [
    { id: 'MR-84001', name: 'Tabac Horloge', address: '1 place de l\'Horloge', city: 'Avignon', postalCode: '84000', openingHours: 'Lun-Sam 7h30-20h' },
    { id: 'MR-84002', name: 'Épicerie Intra-Muros', address: '8 rue de la République', city: 'Avignon', postalCode: '84000', openingHours: 'Lun-Dim 8h-21h' },
  ],
  '92': [
    { id: 'MR-92001', name: 'Tabac Defense', address: '1 parvis de la Défense', city: 'Courbevoie', postalCode: '92400', openingHours: 'Lun-Ven 7h-21h' },
    { id: 'MR-92002', name: 'Presse Neuilly', address: '6 av. Charles-de-Gaulle', city: 'Neuilly-sur-Seine', postalCode: '92200', openingHours: 'Lun-Sam 7h30-20h' },
  ],
  '93': [
    { id: 'MR-93001', name: 'Tabac Saint-Denis', address: '4 rue de la République', city: 'Saint-Denis', postalCode: '93200', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'MR-93002', name: 'Épicerie Montreuil', address: '10 place Jean-Jaurès', city: 'Montreuil', postalCode: '93100', openingHours: 'Lun-Dim 8h-22h' },
  ],
  '94': [
    { id: 'MR-94001', name: 'Tabac Créteil', address: '3 rue Juliette-Récamier', city: 'Créteil', postalCode: '94000', openingHours: 'Lun-Sam 8h-20h' },
    { id: 'MR-94002', name: 'Presse Vincennes', address: '2 av. de Paris', city: 'Vincennes', postalCode: '94300', openingHours: 'Lun-Sam 7h30-20h' },
  ],
};

function getFallbackRelayPoints(postalCode: string): RelayPoint[] {
  const prefix = postalCode.substring(0, 2);

  // Entrées spécifiques pour ce département
  if (FALLBACK_RELAY_POINTS[prefix]) {
    return FALLBACK_RELAY_POINTS[prefix];
  }

  // Ville réelle du département via son chef-lieu
  const city = DEPARTMENT_CHIEF_CITY[prefix] ?? DEPARTMENT_CHIEF_CITY[postalCode.substring(0, 3)] ?? 'France';
  const deptPostalCode = `${prefix}000`;

  return [
    {
      id: `MR-${prefix}001`,
      name: 'Tabac de la Mairie',
      address: '1 place de la Mairie',
      city,
      postalCode: deptPostalCode,
      openingHours: 'Lun-Sam 8h-19h',
    },
    {
      id: `MR-${prefix}002`,
      name: 'Épicerie du Centre',
      address: '5 rue Principale',
      city,
      postalCode: deptPostalCode,
      openingHours: 'Lun-Dim 8h-20h',
    },
  ];
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script inaccessible: ${src}`));
    document.head.appendChild(script);
  });
}

function loadStyle(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

type WidgetState = 'loading' | 'ready' | 'fallback';

interface RelayPointSelectorProps {
  readonly initialPostalCode?: string;
  readonly selectedRelayPoint: RelayPoint | null;
  readonly onSelect: (point: RelayPoint) => void;
}

/**
 * RelayPointSelector — Widget embarqué Mondial Relay avec fallback mock
 *
 * Tente de charger le widget officiel Mondial Relay (mode test BDTEST13).
 * Si le widget échoue (URL inaccessible, CSP, réseau), bascule automatiquement
 * sur une liste de points relais mock pour ne pas bloquer le parcours checkout.
 *
 * En production : remplacer Brand "BDTEST13" par l'identifiant officiel.
 */
export function RelayPointSelector({
  initialPostalCode,
  selectedRelayPoint,
  onSelect,
}: RelayPointSelectorProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('loading');
  const [fallbackPoints, setFallbackPoints] = useState<RelayPoint[]>([]);
  const widgetInitialized = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (widgetInitialized.current) return;
    widgetInitialized.current = true;

    const initWidget = async () => {
      try {
        if (!(window as Window & { jQuery?: unknown }).jQuery) {
          await loadScript(JQUERY_CDN);
        }
        loadStyle(MR_WIDGET_CSS);
        await loadScript(MR_WIDGET_JS);

        const jq = (window as Window & { jQuery?: JQueryMR }).jQuery;
        if (!jq) throw new Error('jQuery introuvable');

        jq('#MR_Zone_Widget').MR_ParcelShopPicker({
          Target: '#MR_Selected_RS',
          Brand: 'BDTEST13',
          PostCode: initialPostalCode ?? '',
          ColLivMod: '24R',
          AllowedCountries: 'FR',
          EnableGmap: false,
          Responsive: true,
          OnParcelShopSelected: (data: MRSelectedData) => {
            onSelectRef.current({
              id: data.ID,
              name: data.Nom,
              address: data.Adresse1,
              city: data.Ville,
              postalCode: data.CP,
            });
          },
        });

        setWidgetState('ready');
      } catch {
        // Widget inaccessible — basculer sur le fallback mock
        const points = getFallbackRelayPoints(initialPostalCode ?? '');
        setFallbackPoints(points);
        setWidgetState('fallback');
      }
    };

    void initWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Loading ── */
  if (widgetState === 'loading') {
    return (
      <div className="mt-4 flex items-center gap-2 py-8 text-xs text-black/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement des points relais…
      </div>
    );
  }

  /* ── Widget Mondial Relay (ready) ── */
  if (widgetState === 'ready') {
    return (
      <div className="mt-4 space-y-4">
        <p className="text-xs text-black/60 tracking-wide">
          Sélectionnez un point relais Mondial Relay sur la carte ci-dessous
        </p>
        <input type="hidden" id="MR_Selected_RS" />
        <div
          id="MR_Zone_Widget"
          className="min-h-[450px] border border-black/10 bg-gray-50"
          aria-label="Carte des points relais Mondial Relay"
        />
        {selectedRelayPoint && <SelectedSummary point={selectedRelayPoint} />}
      </div>
    );
  }

  /* ── Fallback mock (widget inaccessible) ── */
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 text-xs">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800">
          Le widget Mondial Relay est indisponible en mode démo.
          Sélectionnez un point parmi la liste ci-dessous.
        </p>
      </div>

      <div className="space-y-2">
        {fallbackPoints.map((point) => {
          const isSelected = selectedRelayPoint?.id === point.id;
          return (
            <button
              key={point.id}
              type="button"
              onClick={() => onSelectRef.current(point)}
              className={cn(
                'w-full flex items-start gap-3 p-3 border text-left transition-colors text-sm',
                isSelected
                  ? 'border-black bg-black text-white'
                  : 'border-black/20 hover:border-black bg-white text-black'
              )}
            >
              <div className={cn(
                'w-6 h-6 flex items-center justify-center border flex-shrink-0 mt-0.5',
                isSelected ? 'border-white' : 'border-black/30'
              )}>
                {isSelected ? <Check className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold tracking-wide truncate">{point.name}</p>
                <p className={cn('text-xs mt-0.5', isSelected ? 'text-white/70' : 'text-black/50')}>
                  {point.address} — {point.postalCode} {point.city}
                </p>
                {point.openingHours && (
                  <p className={cn('flex items-center gap-1 text-xs mt-1', isSelected ? 'text-white/60' : 'text-black/40')}>
                    <Clock className="h-3 w-3" />
                    {point.openingHours}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedRelayPoint && <SelectedSummary point={selectedRelayPoint} />}
    </div>
  );
}

function SelectedSummary({ point }: { point: RelayPoint }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 text-sm">
      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-green-800">{point.name}</p>
        <p className="text-green-700 text-xs">
          {point.address}, {point.postalCode} {point.city}
        </p>
      </div>
    </div>
  );
}
