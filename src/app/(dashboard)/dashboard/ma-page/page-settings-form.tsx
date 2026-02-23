'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, ImageIcon, ExternalLink, AlertCircle, CheckCircle2, Info, Camera, UserCircle } from 'lucide-react';
import { compressImage, formatFileSize } from '@/lib/utils/image-compression';
import { updatePageSettings, uploadBannerImage, uploadAvatarImage } from './actions';

const BANNER_POSITION_CLASS: Record<'top' | 'center' | 'bottom', string> = {
  top: 'object-top',
  center: 'object-center',
  bottom: 'object-bottom',
};

const TITLE_FONTS = [
  { key: 'jacquard-12', label: 'Jacquard 12', className: 'font-[family-name:var(--font-jacquard-12)]' },
  { key: 'montserrat', label: 'Montserrat', className: 'font-[family-name:var(--font-montserrat)] font-bold' },
  { key: 'archivo', label: 'Archivo', className: 'font-[family-name:var(--font-archivo)] font-bold' },
] as const;

type TitleFontKey = typeof TITLE_FONTS[number]['key'];

const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/votrecompte', recommended: true },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@votrecompte', recommended: true },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.fr/votrecompte', recommended: true },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@votrecompte', recommended: true },
  { key: 'depop', label: 'Depop', placeholder: 'https://depop.com/votrecompte', recommended: false },
  { key: 'behance', label: 'Behance', placeholder: 'https://behance.net/votrecompte', recommended: false },
  { key: 'vsco', label: 'VSCO', placeholder: 'https://vsco.co/votrecompte', recommended: false },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/votrecompte', recommended: false },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/votrecompte', recommended: false },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/votrecompte', recommended: false },
  { key: 'substack', label: 'Substack', placeholder: 'https://votrecompte.substack.com', recommended: false },
];

interface PageSettingsFormProps {
  readonly pageId: string;
  readonly slug: string;
  readonly title?: string;
  readonly tagline?: string;
  readonly description?: string;
  readonly bannerImage?: string;
  readonly bannerPosition?: string;
  readonly titleFont?: string;
  readonly titleColor?: string;
  readonly socialLinks?: Record<string, string>;
  readonly profileImage?: string;
}

interface UploadState {
  isCompressing: boolean;
  originalSize?: number;
  compressedSize?: number;
}

export function PageSettingsForm({
  slug,
  title = '',
  tagline = '',
  description = '',
  bannerImage,
  bannerPosition: initialBannerPosition = 'center',
  titleFont: initialTitleFont,
  titleColor: initialTitleColor,
  socialLinks: initialSocialLinks = {},
  profileImage,
}: PageSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBannerPending, startBannerTransition] = useTransition();
  const [isAvatarPending, startAvatarTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState(bannerImage);
  const [currentAvatar, setCurrentAvatar] = useState(profileImage);
  const [uploadState, setUploadState] = useState<UploadState>({ isCompressing: false });
  const [showMoreNetworks, setShowMoreNetworks] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(initialSocialLinks);
  const [selectedFont, setSelectedFont] = useState<TitleFontKey>((initialTitleFont as TitleFontKey) ?? 'jacquard-12');
  const [selectedColor, setSelectedColor] = useState<'white' | 'black'>((initialTitleColor as 'white' | 'black') ?? 'white');
  const [selectedBannerPosition, setSelectedBannerPosition] = useState<'top' | 'center' | 'bottom'>((initialBannerPosition as 'top' | 'center' | 'bottom') ?? 'center');
  const [previewTitle, setPreviewTitle] = useState(title);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const recommendedNetworks = SOCIAL_NETWORKS.filter((n) => n.recommended);
  const moreNetworks = SOCIAL_NETWORKS.filter((n) => !n.recommended);

  function handleSocialChange(key: string, value: string) {
    setSocialLinks((prev) => {
      const next = { ...prev };
      if (value.trim()) {
        next[key] = value.trim();
      } else {
        delete next[key];
      }
      return next;
    });
  }

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    startAvatarTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadAvatarImage(formData);
      if (result.success && result.url) {
        setCurrentAvatar(result.url);
        router.refresh();
      } else {
        setAvatarError(result.error ?? "Erreur lors de l'upload");
      }
    });

    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }

  async function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerError(null);
    setUploadState({ isCompressing: true, originalSize: file.size });

    let fileToUpload = file;
    try {
      const result = await compressImage(file, { maxDimension: 2400, quality: 0.85 });
      fileToUpload = result.file;
      setUploadState({
        isCompressing: false,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      });
    } catch {
      setUploadState({ isCompressing: false });
    }

    startBannerTransition(async () => {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const result = await uploadBannerImage(formData);
      if (result.success && result.url) {
        setCurrentBanner(result.url);
        router.refresh();
      } else {
        setBannerError(result.error ?? "Erreur lors de l'upload");
      }
      setUploadState({ isCompressing: false });
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set('socialLinks', JSON.stringify(socialLinks));

    startTransition(async () => {
      const result = await updatePageSettings(formData);
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error ?? 'Une erreur est survenue');
      }
    });
  }

  const isBannerLoading = isBannerPending || uploadState.isCompressing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Profil (avatar + nom de compte) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            {/* Avatar circulaire */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isAvatarPending}
                className="group relative w-20 h-20 rounded-full overflow-hidden bg-muted border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Modifier la photo de profil"
              >
                {currentAvatar ? (
                  <Image
                    src={currentAvatar}
                    alt="Photo de profil"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircle className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              {isAvatarPending && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Texte d'aide avatar */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Photo de profil</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cliquez sur l&apos;avatar pour changer votre photo. Elle s&apos;affiche dans la navigation et votre espace personnel.
              </p>
            </div>
          </div>

          {avatarError && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{avatarError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 2 colonnes : Informations gauche / Bannière droite ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Gauche : Informations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Slug (lecture seule) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                URL publique
              </Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border text-sm">
                <span className="text-muted-foreground">kpsull.com/</span>
                <span className="font-medium">{slug}</span>
                <a
                  href={`/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Nom / Titre</Label>
              <Input
                id="title"
                name="title"
                defaultValue={title}
                placeholder="Nom de votre marque ou créateur"
                required
                onChange={(e) => setPreviewTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Affiché sur votre page publique et dans la navigation.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Police du titre</Label>
              <input type="hidden" name="titleFont" value={selectedFont} />
              <input type="hidden" name="titleColor" value={selectedColor} />
              <input type="hidden" name="bannerPosition" value={selectedBannerPosition} />
              <div className="grid grid-cols-3 gap-2">
                {TITLE_FONTS.map((font) => (
                  <button
                    key={font.key}
                    type="button"
                    onClick={() => setSelectedFont(font.key)}
                    className={[
                      'relative rounded-md border px-3 py-2.5 text-center transition-colors text-sm',
                      selectedFont === font.key
                        ? 'border-black bg-black text-white'
                        : 'border-input bg-background hover:bg-muted',
                    ].join(' ')}
                  >
                    <span className={`${font.className} text-base leading-none`}>Aa</span>
                    <span className="block text-[10px] mt-1 opacity-70">{font.label}</span>
                  </button>
                ))}
              </div>
              {/* Couleur du titre */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Couleur :</span>
                <button
                  type="button"
                  onClick={() => setSelectedColor('white')}
                  className={[
                    'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors',
                    selectedColor === 'white' ? 'border-black bg-black text-white' : 'border-input bg-background hover:bg-muted',
                  ].join(' ')}
                >
                  <span className="inline-block h-3 w-3 rounded-full border border-current bg-white" />
                  Blanc
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedColor('black')}
                  className={[
                    'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors',
                    selectedColor === 'black' ? 'border-black bg-black text-white' : 'border-input bg-background hover:bg-muted',
                  ].join(' ')}
                >
                  <span className="inline-block h-3 w-3 rounded-full border border-current bg-black" />
                  Noir
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tagline">Accroche</Label>
              <Input
                id="tagline"
                name="tagline"
                defaultValue={tagline}
                placeholder="CREATING PIECES THAT HAVE SOUL"
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">Max. 120 caractères</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Bio</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={description}
                placeholder="Parlez de votre univers créatif, votre atelier, votre démarche..."
                rows={5}
                maxLength={500}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">Max. 500 caractères</p>
            </div>
          </CardContent>
        </Card>

        {/* Droite : Aperçu + Bannière liés */}
        <div className="flex flex-col">
          {/* Preview mini-hero — lié visuellement à la card Bannière */}
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg border border-border border-b-0 bg-[#1a1a1a]">
            {currentBanner ? (
              <Image
                src={currentBanner}
                alt="Aperçu bannière"
                fill
                className={`object-cover ${BANNER_POSITION_CLASS[selectedBannerPosition]}`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-[rgba(2,20,8,0.4)]" />
            <div className="absolute inset-0 flex items-end p-4">
              <p className={[
                TITLE_FONTS.find((f) => f.key === selectedFont)?.className ?? '',
                'text-2xl leading-none',
                selectedColor === 'black' ? 'text-black' : 'text-white',
              ].join(' ')}>
                {previewTitle || 'Votre nom'}
              </p>
            </div>
            <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white/70 uppercase tracking-wider">
              Aperçu
            </div>
          </div>

          <Card className="rounded-t-none border-t-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-5 w-5" />
              Bannière
            </CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBannerLoading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <ImagePlus className="h-4 w-4" />
              {uploadState.isCompressing
                ? 'Optimisation...'
                : isBannerLoading
                  ? 'Upload...'
                  : currentBanner
                    ? 'Changer'
                    : 'Ajouter'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerFileChange}
              className="hidden"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position du focus de la bannière */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Position du focus</label>
              <div className="flex gap-2">
                {(['top', 'center', 'bottom'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setSelectedBannerPosition(pos)}
                    className={[
                      'flex-1 rounded-md border px-3 py-1.5 text-xs transition-colors capitalize',
                      selectedBannerPosition === pos
                        ? 'border-black bg-black text-white'
                        : 'border-input bg-background hover:bg-muted',
                    ].join(' ')}
                  >
                    {pos === 'top' ? 'Haut' : pos === 'center' ? 'Centre' : 'Bas'}
                  </button>
                ))}
              </div>
            </div>
            {bannerError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{bannerError}</p>
              </div>
            )}
            {uploadState.compressedSize !== undefined && uploadState.originalSize !== undefined && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 flex items-center gap-2">
                <Info className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-xs text-green-700">
                  Optimisée :{' '}
                  <span className="font-medium">{formatFileSize(uploadState.originalSize)}</span> →{' '}
                  <span className="font-medium">{formatFileSize(uploadState.compressedSize)}</span>
                </p>
              </div>
            )}
            {currentBanner ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={currentBanner}
                  alt="Bannière hero"
                  fill
                  className={`object-cover ${BANNER_POSITION_CLASS[selectedBannerPosition]}`}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm font-medium text-muted-foreground">Ajouter une bannière</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Format paysage recommandé · JPG, PNG ou WebP
                </p>
              </button>
            )}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex gap-2">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                La bannière s&apos;affiche en plein écran sur votre page publique avec votre nom en
                superposition. Recommandé : 1920 × 1080 px minimum.
              </p>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Réseaux sociaux (grille 2 colonnes) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Réseaux sociaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Recommandés pour créateurs mode
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedNetworks.map((network) => (
                <div key={network.key} className="space-y-1.5">
                  <Label htmlFor={`social-${network.key}`} className="text-sm">
                    {network.label}
                  </Label>
                  <Input
                    id={`social-${network.key}`}
                    type="url"
                    value={socialLinks[network.key] ?? ''}
                    onChange={(e) => handleSocialChange(network.key, e.target.value)}
                    placeholder={network.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMoreNetworks((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showMoreNetworks ? 'Masquer' : 'Voir plus de réseaux'}
          </button>

          {showMoreNetworks && (
            <div className="pt-1 border-t space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
                Autres réseaux
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {moreNetworks.map((network) => (
                  <div key={network.key} className="space-y-1.5">
                    <Label htmlFor={`social-${network.key}`} className="text-sm">
                      {network.label}
                    </Label>
                    <Input
                      id={`social-${network.key}`}
                      type="url"
                      value={socialLinks[network.key] ?? ''}
                      onChange={(e) => handleSocialChange(network.key, e.target.value)}
                      placeholder={network.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Feedback + Enregistrer ── */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">Modifications enregistrées.</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );
}
