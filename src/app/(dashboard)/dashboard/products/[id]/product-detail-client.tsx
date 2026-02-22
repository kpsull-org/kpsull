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
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
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
  readonly productId: string;
  readonly initialFormValues: InitialFormValues;
  readonly collections: CollectionOption[];
  readonly styles: StyleOption[];
  readonly initialVariants: DashboardVariant[];
  readonly initialSizes: SizeEntry[];
  readonly initialSkus: SkuOutput[];
}

export function ProductDetailClient({
  productId,
  initialFormValues,
  collections,
  styles,
  initialVariants,
  initialSizes,
  initialSkus,
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
        category={liveCategory || undefined}
        gender={liveGender || undefined}
      />
    </div>
  );
}
