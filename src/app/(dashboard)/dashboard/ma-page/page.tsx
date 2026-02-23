import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/client';
import { PrismaPageRepository } from '@/modules/pages/infrastructure/repositories/prisma-page.repository';
import { slugify } from '@/lib/utils/slugify';
import { PageSettingsForm } from './page-settings-form';

export const metadata = {
  title: 'Ma page | Dashboard Kpsull',
};

const pageRepository = new PrismaPageRepository();

export default async function MaPageDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Fetch user profile data (name + avatar)
  const userProfile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });

  let pages = await pageRepository.findByCreatorId(session.user.id);
  let page = pages[0] ?? null;

  // Auto-create if doesn't exist
  if (!page) {
    const onboarding = await prisma.creatorOnboarding.findUnique({
      where: { userId: session.user.id },
      select: { brandName: true },
    });

    const rawName = onboarding?.brandName ?? userProfile?.name ?? 'mon-espace';
    let slug = slugify(rawName);
    const slugExists = await pageRepository.slugExists(slug);
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const { CreatePageUseCase } = await import(
      '@/modules/pages/application/use-cases/create-page.use-case'
    );
    const createUseCase = new CreatePageUseCase(pageRepository);
    await createUseCase.execute({
      creatorId: session.user.id,
      slug,
      title: onboarding?.brandName ?? userProfile?.name ?? 'Mon espace créateur',
    });

    pages = await pageRepository.findByCreatorId(session.user.id);
    page = pages[0] ?? null;
  }

  if (!page) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Erreur lors de la création de votre page. Veuillez réessayer.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-1">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-montserrat)] uppercase tracking-tight">
          Ma page
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez votre page publique visible sur{' '}
          <a
            href={`/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            kpsull.com/{page.slug}
          </a>
        </p>
      </div>

      <PageSettingsForm
        slug={page.slug}
        title={page.title}
        tagline={page.tagline}
        description={page.description}
        bannerImage={page.bannerImage}
        bannerPosition={page.bannerPosition}
        titleFont={page.titleFont}
        titleColor={page.titleColor}
        socialLinks={page.socialLinks}
        profileImage={userProfile?.image ?? undefined}
      />
    </div>
  );
}
