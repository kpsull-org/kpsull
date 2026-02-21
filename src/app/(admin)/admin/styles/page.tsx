import { Metadata } from 'next';
import { StyleModerationClient } from './page-client';

export const metadata: Metadata = {
  title: 'Styles | Admin Kpsull',
  description: 'Modérez les styles personnalisés soumis par les créateurs',
};

export default function StylesPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Modération des styles</h1>
        <p className="text-muted-foreground mt-1">
          Validez ou rejetez les styles personnalisés soumis par les créateurs
        </p>
      </div>

      <StyleModerationClient />
    </div>
  );
}
