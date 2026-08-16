import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import { BlogSection } from '@/components/sections/BlogSection';
import { FaqSection } from '@/components/sections/FaqSection';
import { SponsorSection } from '@/components/sections/SponsorSection';
import { CtaSection } from '@/components/sections/CtaSection';
import { fetchPublicArticlesPage } from '@/lib/api/blog';
import { fetchPublicProjectsPage } from '@/lib/api/project';

const HOME_PREVIEW_LIMIT = 3;

export default async function HomePage() {
  const [projectsPage, articlesPage] = await Promise.all([
    fetchPublicProjectsPage({ limit: HOME_PREVIEW_LIMIT }),
    fetchPublicArticlesPage({ limit: HOME_PREVIEW_LIMIT }),
  ]);

  return (
    <>
      <Navigation />
      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection items={projectsPage.items} />
        <BlogSection items={articlesPage.items} />
        <FaqSection />
        <SponsorSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
