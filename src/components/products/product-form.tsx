'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
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
const CERTIFICATION_OPTIONS = ['OEKO-TEX', 'GOTS Bio', 'Fairtrade', 'Label Européen', 'Éco-conception'];

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

export function ProductForm({ mode, productId, initialValues, collections, styles = [], onCreated, onGenderChange, onCategoryChange }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [priceEur, setPriceEur] = useState(
    initialValues ? (initialValues.price / 100).toFixed(2) : ''
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

  function handleCertificationChange(cert: string, checked: boolean) {
    setCertifications((prev) =>
      checked ? [...prev, cert] : prev.filter((c) => c !== cert)
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceInCents = Math.round(parseFloat(priceEur) * 100);

    if (!name.trim()) {
      setError('Le nom du produit est requis');
      return;
    }

    if (isNaN(priceInCents) || priceInCents <= 0) {
      setError('Le prix doit etre un nombre positif');
      return;
    }

    startTransition(async () => {
      let result: ActionResult;

      if (mode === 'create') {
        result = await createProduct({
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceInCents,
          projectId: projectId || undefined,
        });
      } else {
        result = await updateProduct(productId!, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceInCents,
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
      }

      if (!result.success) {
        setError(result.error ?? 'Une erreur est survenue');
        return;
      }

      if (mode === 'create' && result.id) {
        if (onCreated) {
          onCreated(result.id);
        } else {
          router.push(`/dashboard/products/${result.id}`);
        }
      } else {
        router.refresh();
      }
    });
  }

  const systemStyles = styles.filter((s) => !s.isCustom);
  const customStyles = styles.filter((s) => s.isCustom);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nouveau produit' : 'Informations generales'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du produit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du produit..."
              rows={4}
              className={TEXTAREA_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainCategory">Catégorie</Label>
              <select
                id="mainCategory"
                value={mainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">— Choisir une catégorie —</option>
                {Object.keys(CATEGORY_TREE).map((main) => (
                  <option key={main} value={main}>{main}</option>
                ))}
              </select>
            </div>

            {mainCategory && (
              <div className="space-y-2">
                <Label htmlFor="category">Type d&apos;article</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); onCategoryChange?.(e.target.value); }}
                  className={SELECT_CLASS}
                >
                  <option value="">— Choisir un type —</option>
                  {subCategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
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

          {mode === 'edit' && (
            <details className="group">
              <summary className="cursor-pointer select-none flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-2 list-none">
                <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                Caractéristiques du produit
              </summary>
              <div className="pt-3 space-y-4">
                <div className="space-y-2">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fit">Coupe</Label>
                    <select
                      id="fit"
                      value={fit}
                      onChange={(e) => setFit(e.target.value)}
                      className={SELECT_CLASS}
                    >
                      <option value="">— Choisir —</option>
                      {FIT_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="season">Saison</Label>
                    <select
                      id="season"
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className={SELECT_CLASS}
                    >
                      <option value="">— Choisir —</option>
                      {SEASON_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="madeIn">Pays de fabrication</Label>
                    <input
                      id="madeIn"
                      type="text"
                      value={madeIn}
                      onChange={(e) => setMadeIn(e.target.value)}
                      placeholder="ex: France, Maroc, Portugal"
                      className={INPUT_TEXT_CLASS}
                    />
                  </div>
                  <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label>Certifications</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {CERTIFICATION_OPTIONS.map((cert) => (
                      <label key={cert} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={certifications.includes(cert)}
                          onChange={(e) => handleCertificationChange(cert, e.target.checked)}
                          className="h-4 w-4 rounded border"
                        />
                        {cert}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careInstructions">Entretien</Label>
                  <textarea
                    id="careInstructions"
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    placeholder="ex: Lavage machine 30°, Séchage à plat, Ne pas repasser"
                    rows={2}
                    className={TEXTAREA_CLASS}
                  />
                </div>
              </div>
            </details>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Prix de base (EUR) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Chaque variante peut avoir un prix specifique. Ce prix est utilise par defaut.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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

            {styles.length > 0 && (
              <div className="space-y-2">
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

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Enregistrement...'
                : mode === 'create'
                  ? 'Creer le produit'
                  : 'Enregistrer'}
            </Button>
            {mode === 'create' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
