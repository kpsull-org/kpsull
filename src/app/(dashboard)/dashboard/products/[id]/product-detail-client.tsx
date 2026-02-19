'use client';

import { useState } from 'react';
import { ProductForm } from '@/components/products/product-form';
import { ProductDashboard, type DashboardVariant } from './product-dashboard';
import type { SkuOutput } from '../actions';
import type { SizeEntry } from '@/lib/utils/parse-sizes';

interface CollectionOption {
  id: string;
  name: string;
}

interface StyleOption {
  id: string;
  name: string;
  isCustom: boolean;
}

interface InitialFormValues {
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
}

interface ProductDetailClientProps {
  productId: string;
  initialFormValues: InitialFormValues;
  collections: CollectionOption[];
  styles: StyleOption[];
  initialVariants: DashboardVariant[];
  initialSizes: SizeEntry[];
  initialSkus: SkuOutput[];
  initialProductImages: Array<{ id: string; url: string }>;
}

export function ProductDetailClient({
  productId,
  initialFormValues,
  collections,
  styles,
  initialVariants,
  initialSizes,
  initialSkus,
  initialProductImages,
}: ProductDetailClientProps) {
  const [liveGender, setLiveGender] = useState(initialFormValues.gender ?? '');
  const [liveCategory, setLiveCategory] = useState(initialFormValues.category ?? '');

  return (
    <div className="space-y-6">
      <ProductForm
        mode="edit"
        productId={productId}
        initialValues={initialFormValues}
        collections={collections}
        styles={styles}
        onGenderChange={setLiveGender}
        onCategoryChange={setLiveCategory}
      />
      <ProductDashboard
        productId={productId}
        initialVariants={initialVariants}
        initialSizes={initialSizes}
        initialSkus={initialSkus}
        initialProductImages={initialProductImages}
        category={liveCategory || undefined}
        gender={liveGender || undefined}
      />
    </div>
  );
}
