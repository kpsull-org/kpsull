'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProduct, updateProduct, type ActionResult } from '@/app/(dashboard)/dashboard/products/actions';

const CATEGORY_TREE: Record<string, string[]> = {
  'Hauts': ['T-shirt', 'Chemise', 'Polo', 'Haut', 'Blouse', 'Top', 'Débardeur', 'Body'],
  'Pulls & Sweats': ['Pull', 'Sweat', 'Hoodie', 'Gilet', 'Cardigan'],
  'Vestes & Manteaux': ['Veste', 'Manteau', 'Parka', 'Trench', 'Blazer', 'Doudoune', 'Imperméable'],
  'Bas': ['Pantalon', 'Jean', 'Short', 'Jogger', 'Legging', 'Bermuda', 'Chino'],
  'Robes & Combinaisons': ['Robe', 'Combinaison', 'Combishort', 'Combinaison pantalon'],
  'Tenues traditionnelles': ['Djellaba', 'Kaftan', 'Maroc Kinri', 'Takchita', 'Abaya', 'Burnous', 'Gandoura', 'Jellabiya'],
  'Accessoires mode': ['Sac', 'Ceinture', 'Chapeau', 'Bonnet', 'Écharpe', 'Gants', 'Lunettes', 'Montre', 'Portefeuille', 'Cravate', 'Nœud papillon'],
  'Bijoux': ['Collier', 'Bracelet', 'Bague', "Boucles d'oreilles", 'Broche', 'Pendentif', 'Chaîne'],
  'Chaussures': ['Sneakers', 'Baskets', 'Sandales', 'Escarpins', 'Bottes', 'Bottines', 'Mocassins', 'Derbies', 'Ballerines', 'Chaussures de sport'],
  'Lingerie & Nuit': ['Soutien-gorge', 'Culotte', 'Boxer', 'Slip', 'Pyjama', 'Nuisette', 'Robe de chambre'],
  'Sport & Activewear': ['Maillot de sport', 'Short de sport', 'Legging de sport', 'Veste de sport', 'Chaussures de sport', 'Sac de sport'],
};

const SUB_TO_MAIN: Record<string, string> = Object.entries(CATEGORY_TREE).reduce(
  (acc, [main, subs]) => {
    subs.forEach((sub) => { acc[sub] = main; });
    return acc;
  },
  {} as Record<string, string>
);

const FIT_OPTIONS = ['Regular', 'Slim', 'Oversize', 'Cropped', 'Boyfriend', 'Straight', 'Flare', 'Relaxed'];
const SEASON_OPTIONS = ['Printemps-Été', 'Automne-Hiver', 'Toute saison'];

const TEXTILE_CERTIFICATIONS = [
  'B Corp',
  'Better Cotton Initiative (BCI)',
  'Bluesign',
  'Cradle to Cradle (C2C)',
  'Demeter Bio-dynamique',
  'ECARF (Allergie certifiée)',
  'EU Ecolabel',
  'Fair Wear Foundation (FWF)',
  'Fairtrade Textile',
  'Global Organic Textile Standard (GOTS)',
  'Global Recycled Standard (GRS)',
  'Higg Index',
  'ISO 14001 (Environnement)',
  'ISO 9001 (Qualité)',
  'IVN Best (Naturtextil)',
  'Label Origine France Garantie',
  'Leaping Bunny (Sans cruauté)',
  'MADE IN GREEN by OEKO-TEX',
  'OEKO-TEX STANDARD 100',
  'OEKO-TEX STeP',
  'Origine France Garantie',
  'PETA-Approved Vegan',
  'Rainforest Alliance',
  'Responsible Down Standard (RDS)',
  'Responsible Mohair Standard (RMS)',
  'Responsible Wool Standard (RWS)',
  'SA8000 (Responsabilité sociale)',
  'Sedex SMETA',
  'Textile Exchange',
  'Vegan Society',
  'Woolmark',
];

const SELECT_CLASS = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const TEXTAREA_CLASS = 'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const INPUT_TEXT_CLASS = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

interface CollectionOption {
  id: string;
  name: string;
}

interface StyleOption {
  id: string;
  name: string;
  isCustom: boolean;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initialValues?: {
    name: string;
    description?: string;
    price: number;
    projectId?: string;
    styleId?: string;
    category?: string;
    gender?: string;
    materials?: string;
    fit?: string;
    season?: string;
    madeIn?: string;
    careInstructions?: string;
    certifications?: string;
    weight?: number;
  };
  collections: CollectionOption[];
  styles?: StyleOption[];
  onCreated?: (id: string) => void;
  onGenderChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border/60">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function CertificationSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (certs: string[]) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = TEXTILE_CERTIFICATIONS.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(cert: string, checked: boolean) {
    onChange(checked ? [...value, cert] : value.filter((c) => c !== cert));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Widget principal — hauteur fixe */}
      <div className="flex h-52 flex-col overflow-hidden rounded-md border border-input bg-background">
        {/* Barre de recherche + count */}
        <div className="flex shrink-0 items-center border-b border-input">
          <input
            type="text"
            placeholder="Rechercher une certification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground outline-none"
          />
          {value.length > 0 && (
            <span className="mr-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {value.length}
            </span>
          )}
        </div>
        {/* Liste scrollable */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Aucun résultat</p>
          ) : (
            filtered.map((cert) => (
              <label
                key={cert}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  checked={value.includes(cert)}
                  onChange={(e) => toggle(cert, e.target.checked)}
                  className="h-3.5 w-3.5 shrink-0 rounded border"
                />
                <span>{cert}</span>
              </label>
            ))
          )}
        </div>
      </div>
      {/* Badges sous le widget */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {cert}
              <button
                type="button"
                onClick={() => toggle(cert, false)}
                className="leading-none hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductForm({ mode, productId, initialValues, collections, styles = [], onCreated, onGenderChange, onCategoryChange }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedInfo, setSavedInfo] = useState(false);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [price, setPrice] = useState<number>(
    initialValues ? initialValues.price / 100 : NaN
  );
  const [projectId, setProjectId] = useState(initialValues?.projectId ?? '');
  const [styleId, setStyleId] = useState(initialValues?.styleId ?? '');
  const [gender, setGender] = useState<string>(initialValues?.gender ?? '');
  const [mainCategory, setMainCategory] = useState<string>(() => {
    const saved = initialValues?.category ?? '';
    return SUB_TO_MAIN[saved] ?? '';
  });
  const [category, setCategory] = useState(initialValues?.category ?? '');

  // Textile characteristics
  const [materials, setMaterials] = useState(initialValues?.materials ?? '');
  const [fit, setFit] = useState(initialValues?.fit ?? '');
  const [season, setSeason] = useState(initialValues?.season ?? '');
  const [madeIn, setMadeIn] = useState(initialValues?.madeIn ?? '');
  const [careInstructions, setCareInstructions] = useState(initialValues?.careInstructions ?? '');
  const [certifications, setCertifications] = useState<string[]>(() => {
    const saved = initialValues?.certifications ?? '';
    return saved ? saved.split(',').filter(Boolean) : [];
  });
  const [weight, setWeight] = useState<string>(initialValues?.weight?.toString() ?? '');

  const subCategories = mainCategory ? (CATEGORY_TREE[mainCategory] ?? []) : [];

  function handleMainCategoryChange(value: string) {
    setMainCategory(value);
    setCategory('');
    onCategoryChange?.('');
  }

  function triggerSave() {
    setError(null);
    startTransition(async () => {
      const result: ActionResult = await updateProduct(productId!, {
        name: name.trim(),
        description: description.trim() || undefined,
        price: price,
        projectId: projectId || null,
        styleId: styleId || null,
        category: category || null,
        gender: gender || null,
        materials: materials || null,
        fit: fit || null,
        season: season || null,
        madeIn: madeIn || null,
        careInstructions: careInstructions || null,
        certifications: certifications.length > 0 ? certifications.join(',') : null,
        weight: weight ? Number.parseInt(weight, 10) : null,
      });

      if (!result.success) {
        setError(result.error ?? 'Une erreur est survenue');
        return;
      }

      setSavedInfo(true);
      router.refresh();
    });
  }

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!name.trim() || !Number.isFinite(price) || price <= 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSave();
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, description, price, projectId, styleId, gender, category, materials, fit, season, madeIn, careInstructions, certifications, weight, mode]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!savedInfo) return;
    const t = setTimeout(() => setSavedInfo(false), 3000);
    return () => clearTimeout(t);
  }, [savedInfo]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== 'create') return;
    setError(null);

    if (!name.trim()) {
      setError('Le nom du produit est requis');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    startTransition(async () => {
      const result: ActionResult = await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        price: price,
        projectId: projectId || undefined,
      });

      if (!result.success) {
        setError(result.error ?? 'Une erreur est survenue');
        return;
      }

      if (result.id) {
        if (onCreated) {
          onCreated(result.id);
        } else {
          router.push(`/dashboard/products/${result.id}`);
        }
      }
    });
  }

  const systemStyles = styles.filter((s) => !s.isCustom);
  const customStyles = styles.filter((s) => s.isCustom);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {mode === 'create' ? 'Nouveau produit' : 'Informations générales'}
        </CardTitle>
        {mode === 'edit' && (
          <span className="text-xs text-muted-foreground">
            {isPending ? 'Enregistrement...' : savedInfo ? '✓ Enregistré' : ''}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Section — Informations de base */}
          <div className="space-y-3">
            <SectionTitle label="Informations de base" />
            {/* Nom (2/4) + Collection (1/4) + Prix (1/4) */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom du produit"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="collection">Collection</Label>
                <select
                  id="collection"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={`${SELECT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Aucune collection</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Prix (EUR) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={Number.isFinite(price) ? price : ''}
                  onChange={(e) => setPrice(e.target.valueAsNumber)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            {/* Description pleine largeur */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du produit..."
                rows={2}
                className={TEXTAREA_CLASS}
              />
            </div>
            {/* Style (si disponible) */}
            {styles.length > 0 && (
              <div className="space-y-1.5 max-w-xs">
                <Label htmlFor="style">Style</Label>
                <select
                  id="style"
                  value={styleId}
                  onChange={(e) => setStyleId(e.target.value)}
                  className={`${SELECT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Aucun style</option>
                  {systemStyles.length > 0 && (
                    <optgroup label="Styles">
                      {systemStyles.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {customStyles.length > 0 && (
                    <optgroup label="Mes styles">
                      {customStyles.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Section — Catégorie & Genre */}
          <div className="space-y-3">
            <SectionTitle label="Catégorie & Genre" />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mainCategory">Catégorie</Label>
                <select
                  id="mainCategory"
                  value={mainCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">— Catégorie —</option>
                  {Object.keys(CATEGORY_TREE).map((main) => (
                    <option key={main} value={main}>{main}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Type d&apos;article</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); onCategoryChange?.(e.target.value); }}
                  className={SELECT_CLASS}
                  disabled={!mainCategory}
                >
                  <option value="">— Type —</option>
                  {subCategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Genre</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => { setGender(e.target.value); onGenderChange?.(e.target.value); }}
                  className={SELECT_CLASS}
                >
                  <option value="">— Tous genres —</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                  <option value="Unisexe">Unisexe</option>
                  <option value="Enfant">Enfant</option>
                  <option value="Bébé">Bébé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sections edit uniquement */}
          {mode === 'edit' && (
            <>
              {/* Section — Composition & Matières */}
              <div className="space-y-3">
                <SectionTitle label="Composition & Matières" />
                <div className="space-y-1.5">
                  <Label htmlFor="materials">Composition / Matière</Label>
                  <textarea
                    id="materials"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="ex: 100% Coton biologique"
                    rows={2}
                    className={TEXTAREA_CLASS}
                  />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fit">Coupe</Label>
                    <select
                      id="fit"
                      value={fit}
                      onChange={(e) => setFit(e.target.value)}
                      className={SELECT_CLASS}
                    >
                      <option value="">— Coupe —</option>
                      {FIT_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="season">Saison</Label>
                    <select
                      id="season"
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className={SELECT_CLASS}
                    >
                      <option value="">— Saison —</option>
                      {SEASON_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="madeIn">Pays de fabrication</Label>
                    <input
                      id="madeIn"
                      type="text"
                      value={madeIn}
                      onChange={(e) => setMadeIn(e.target.value)}
                      placeholder="ex: France"
                      className={INPUT_TEXT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight">Grammage (g/m²)</Label>
                    <input
                      id="weight"
                      type="number"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="ex: 180"
                      className={INPUT_TEXT_CLASS}
                    />
                  </div>
                </div>
              </div>

              {/* Section — Entretien & Certifications */}
              <div className="space-y-3">
                <SectionTitle label="Entretien & Certifications" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="careInstructions">Conseils d&apos;entretien</Label>
                    <textarea
                      id="careInstructions"
                      value={careInstructions}
                      onChange={(e) => setCareInstructions(e.target.value)}
                      placeholder="ex: Lavage machine 30°, Séchage à plat, Ne pas repasser"
                      className={`${TEXTAREA_CLASS} h-52 resize-none`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Certifications</Label>
                    <CertificationSelect
                      value={certifications}
                      onChange={setCertifications}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          {mode === 'create' && (
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement...' : 'Créer le produit'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Annuler
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
