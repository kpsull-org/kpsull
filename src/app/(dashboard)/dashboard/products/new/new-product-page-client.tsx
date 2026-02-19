'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/products/product-form';
import { SizeManager } from '../[id]/size-manager';
import { VariantManager } from '../[id]/variant-manager';
import { ImageManager } from '../[id]/image-manager';
import { publishProduct } from '../actions';
import { CheckCircle, ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionOption {
  id: string;
  name: string;
}

interface StyleOption {
  id: string;
  name: string;
  isCustom: boolean;
}

interface NewProductPageClientProps {
  collections: CollectionOption[];
  styles: StyleOption[];
}

export function NewProductPageClient({ collections, styles }: NewProductPageClientProps) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const [isPendingPublish, startPublishTransition] = useTransition();

  function handlePublish() {
    if (!productId) return;
    startPublishTransition(async () => {
      const result = await publishProduct(productId);
      if (result.success) {
        router.push(`/dashboard/products/${productId}`);
      }
    });
  }

  if (!productId) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductForm
            mode="create"
            collections={collections}
            styles={styles}
            onCreated={(id) => setProductId(id)}
          />
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Apres la creation, vous pourrez :</p>
            <ul className="space-y-2">
              {[
                'Ajouter des photos produit',
                'Definir les tailles et dimensions',
                'Creer des variantes de couleur',
                'Gerer les stocks par taille et variante',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-5 w-5 rounded-full border border-primary/40 flex items-center justify-center text-[10px] text-primary font-bold shrink-0">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-1">
              Le produit sera cree en brouillon. Vous pouvez le publier quand il est pret.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banniere brouillon cree */}
      <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Produit cree en brouillon
            </p>
            <p className="text-xs text-green-700/70 dark:text-green-400/70">
              Completez les informations ci-dessous puis publiez quand vous etes pret
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePublish}
            disabled={isPendingPublish}
            size="sm"
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {isPendingPublish ? 'Publication...' : 'Publier'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/products/${productId}`)}
            className="gap-1"
          >
            Voir la fiche
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ImageManager productId={productId} images={[]} />
          <SizeManager productId={productId} initialSizes={[]} />
          <VariantManager productId={productId} variants={[]} />
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">Conseils</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Ajoutez au moins une photo avant de publier
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Les tailles permettent de gerer le stock par taille
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Les variantes representent differentes couleurs ou editions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
