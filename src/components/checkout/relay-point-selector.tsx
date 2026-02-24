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

/** Helper compact pour créer un RelayPoint sans répéter les noms de propriétés */
function rp(
  id: string,
  name: string,
  address: string,
  city: string,
  postalCode: string,
  openingHours: string,
): RelayPoint {
  return { id, name, address, city, postalCode, openingHours };
}

/** Mock relay points — utilisés en fallback si le widget ne se charge pas */
const FALLBACK_RELAY_POINTS: Record<string, RelayPoint[]> = {
  '06': [
    rp('MR-06001', 'Tabac Masséna', '4 place Masséna', 'Nice', '06000', 'Lun-Sam 7h30-20h'),
    rp('MR-06002', 'Presse Gambetta', '18 av. Gambetta', 'Nice', '06000', 'Lun-Sam 7h-19h30'),
  ],
  '13': [
    rp('MR-13001', 'Tabac Vieux-Port', '2 quai du Port', 'Marseille', '13001', 'Lun-Sam 7h-20h'),
    rp('MR-13006', 'Épicerie Cours Julien', '20 cours Julien', 'Marseille', '13006', 'Lun-Dim 8h-22h'),
    rp('MR-13008', 'Tabac Prado', '135 av. du Prado', 'Marseille', '13008', 'Lun-Sam 7h-20h'),
  ],
  '14': [
    rp('MR-14001', 'Tabac de la Paix', '3 place de la République', 'Caen', '14000', 'Lun-Sam 7h30-20h'),
    rp('MR-14002', 'Presse Saint-Pierre', '12 rue Saint-Pierre', 'Caen', '14000', 'Lun-Sam 8h-19h'),
  ],
  '21': [
    rp('MR-21001', 'Tabac Darcy', '1 place Darcy', 'Dijon', '21000', 'Lun-Sam 7h30-20h'),
    rp('MR-21002', 'Épicerie Clemenceau', '8 av. Clemenceau', 'Dijon', '21000', 'Lun-Dim 8h-21h'),
  ],
  '29': [
    rp('MR-29001', 'Tabac Cordeliers', '2 rue des Cordeliers', 'Quimper', '29000', 'Lun-Sam 7h30-19h30'),
    rp('MR-29002', 'Presse Brest Centre', '15 rue de Siam', 'Brest', '29200', 'Lun-Sam 7h-20h'),
  ],
  '31': [
    rp('MR-31001', 'Tabac Capitole', '1 place du Capitole', 'Toulouse', '31000', 'Lun-Sam 7h30-20h'),
    rp('MR-31002', 'Épicerie Saint-Cyprien', '22 allées Charles-de-Fitte', 'Toulouse', '31300', 'Lun-Dim 8h-22h'),
  ],
  '33': [
    rp('MR-33001', 'Tabac Place de la Bourse', '2 place de la Bourse', 'Bordeaux', '33000', 'Lun-Sam 7h30-20h'),
    rp('MR-33002', 'Épicerie Chartrons', '5 cours du Médoc', 'Bordeaux', '33000', 'Lun-Dim 8h-21h'),
  ],
  '34': [
    rp('MR-34001', 'Tabac Comédie', '3 place de la Comédie', 'Montpellier', '34000', 'Lun-Sam 7h30-20h'),
    rp('MR-34002', 'Presse Antigone', '10 bd du Jeu-de-Paume', 'Montpellier', '34000', 'Lun-Sam 8h-19h30'),
  ],
  '35': [
    rp('MR-35001', 'Tabac République', '6 place de la République', 'Rennes', '35000', 'Lun-Sam 7h30-20h'),
    rp('MR-35002', 'Épicerie Thabor', '14 rue Nantaise', 'Rennes', '35000', 'Lun-Dim 8h-21h'),
  ],
  '38': [
    rp('MR-38001', 'Tabac Victor Hugo', '2 place Victor-Hugo', 'Grenoble', '38000', 'Lun-Sam 7h30-20h'),
    rp('MR-38002', 'Presse Championnet', '8 rue Championnet', 'Grenoble', '38000', 'Lun-Sam 8h-19h30'),
  ],
  '44': [
    rp('MR-44001', 'Tabac Commerce', '3 place du Commerce', 'Nantes', '44000', 'Lun-Sam 7h30-20h'),
    rp('MR-44002', 'Épicerie Bouffay', '12 rue de la Juiverie', 'Nantes', '44000', 'Lun-Dim 8h-22h'),
  ],
  '45': [
    rp('MR-45001', 'Tabac Martroi', '1 place du Martroi', 'Orléans', '45000', 'Lun-Sam 7h30-20h'),
    rp('MR-45002', 'Presse Saint-Charles', '6 rue Saint-Charles', 'Orléans', '45000', 'Lun-Sam 8h-19h30'),
  ],
  '49': [
    rp('MR-49001', 'Tabac Ralliement', '4 place du Ralliement', 'Angers', '49000', 'Lun-Sam 7h30-20h'),
    rp('MR-49002', 'Épicerie Doutre', '8 place de la Laiterie', 'Angers', '49100', 'Lun-Dim 8h-21h'),
  ],
  '51': [
    rp('MR-51001', 'Tabac République', '5 place de la République', 'Reims', '51100', 'Lun-Sam 7h30-20h'),
    rp('MR-51002', 'Presse Erlon', "22 place d'Erlon", 'Reims', '51100', 'Lun-Sam 8h-20h'),
  ],
  '54': [
    rp('MR-54001', 'Tabac Stanislas', '2 place Stanislas', 'Nancy', '54000', 'Lun-Sam 7h30-20h'),
    rp('MR-54002', 'Presse Carnot', '16 rue Carnot', 'Nancy', '54000', 'Lun-Sam 8h-19h30'),
  ],
  '57': [
    rp('MR-57001', 'Tabac Gardon', '8 place du Gardon', 'Metz', '57000', 'Lun-Sam 7h30-20h'),
    rp('MR-57002', 'Épicerie Saint-Étienne', '3 rue des Jardins', 'Metz', '57000', 'Lun-Dim 8h-21h'),
  ],
  '59': [
    rp('MR-59001', 'Tabac Grand-Place', '2 place du Gén. de Gaulle', 'Lille', '59000', 'Lun-Sam 7h30-20h'),
    rp('MR-59002', 'Presse Solférino', '10 rue Solférino', 'Lille', '59000', 'Lun-Sam 8h-20h'),
    rp('MR-59003', 'Épicerie Vieux-Lille', '4 rue de la Monnaie', 'Lille', '59800', 'Lun-Dim 8h-22h'),
  ],
  '63': [
    rp('MR-63001', 'Tabac Jaude', '1 place de Jaude', 'Clermont-Ferrand', '63000', 'Lun-Sam 7h30-20h'),
    rp('MR-63002', 'Presse Blatin', '6 av. Blatin', 'Clermont-Ferrand', '63000', 'Lun-Sam 8h-19h30'),
  ],
  '67': [
    rp('MR-67001', 'Tabac Place Kléber', '1 place Kléber', 'Strasbourg', '67000', 'Lun-Sam 7h30-20h'),
    rp('MR-67002', 'Presse Petite France', '12 quai Saint-Thomas', 'Strasbourg', '67000', 'Lun-Sam 8h-20h'),
  ],
  '69': [
    rp('MR-69002', 'Épicerie Bellecour', '15 place Bellecour', 'Lyon', '69002', 'Lun-Sam 8h-21h'),
    rp('MR-69004', 'Tabac Croix-Rousse', '40 bd de la Croix-Rousse', 'Lyon', '69004', 'Lun-Dim 7h-20h'),
    rp('MR-69006', 'Presse Confluence', '2 cours Charlemagne', 'Lyon', '69002', 'Lun-Sam 9h-20h'),
  ],
  '72': [
    rp('MR-72001', 'Tabac République', '2 place de la République', 'Le Mans', '72000', 'Lun-Sam 7h30-20h'),
    rp('MR-72002', 'Presse Jacobins', '8 rue des Jacobins', 'Le Mans', '72000', 'Lun-Sam 8h-19h30'),
  ],
  '74': [
    rp('MR-74001', 'Tabac Bonlieu', '3 rue Jean-Jaurès', 'Annecy', '74000', 'Lun-Sam 7h30-20h'),
    rp('MR-74002', 'Épicerie Vieille Ville', '10 rue Sainte-Claire', 'Annecy', '74000', 'Lun-Dim 8h-21h'),
  ],
  '75': [
    rp('MR-75001', 'Tabac Châtelet', '12 rue de Rivoli', 'Paris', '75001', 'Lun-Sam 8h-20h'),
    rp('MR-75003', 'Épicerie du Marais', '34 bd de Sébastopol', 'Paris', '75003', 'Lun-Dim 7h-22h'),
    rp('MR-75011', 'Tabac Nation', '1 place de la Nation', 'Paris', '75011', 'Lun-Sam 7h-20h'),
  ],
  '76': [
    rp('MR-76001', 'Tabac Vieux-Marché', '2 place du Vieux-Marché', 'Rouen', '76000', 'Lun-Sam 7h30-20h'),
    rp('MR-76002', 'Presse Saint-Sever', "10 bd de l'Yser", 'Rouen', '76100', 'Lun-Sam 8h-19h30'),
  ],
  '83': [
    rp('MR-83001', 'Tabac Liberté', '5 place de la Liberté', 'Toulon', '83000', 'Lun-Sam 7h30-20h'),
    rp('MR-83002', 'Presse Mayol', '18 av. du Maréchal-Leclerc', 'Toulon', '83000', 'Lun-Sam 8h-19h30'),
  ],
  '84': [
    rp('MR-84001', 'Tabac Horloge', "1 place de l'Horloge", 'Avignon', '84000', 'Lun-Sam 7h30-20h'),
    rp('MR-84002', 'Épicerie Intra-Muros', '8 rue de la République', 'Avignon', '84000', 'Lun-Dim 8h-21h'),
  ],
  '92': [
    rp('MR-92001', 'Tabac Defense', '1 parvis de la Défense', 'Courbevoie', '92400', 'Lun-Ven 7h-21h'),
    rp('MR-92002', 'Presse Neuilly', '6 av. Charles-de-Gaulle', 'Neuilly-sur-Seine', '92200', 'Lun-Sam 7h30-20h'),
  ],
  '93': [
    rp('MR-93001', 'Tabac Saint-Denis', '4 rue de la République', 'Saint-Denis', '93200', 'Lun-Sam 8h-20h'),
    rp('MR-93002', 'Épicerie Montreuil', '10 place Jean-Jaurès', 'Montreuil', '93100', 'Lun-Dim 8h-22h'),
  ],
  '94': [
    rp('MR-94001', 'Tabac Créteil', '3 rue Juliette-Récamier', 'Créteil', '94000', 'Lun-Sam 8h-20h'),
    rp('MR-94002', 'Presse Vincennes', '2 av. de Paris', 'Vincennes', '94300', 'Lun-Sam 7h30-20h'),
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
