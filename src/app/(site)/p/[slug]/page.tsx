import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/anon";
import SiteRender from "@/components/SiteRender";
import type { SiteRow } from "@/lib/site/types";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const { data } = await createAnonClient().rpc("get_site", { p_slug: slug });
  return (data as SiteRow | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const site = await load((await params).slug);
  if (!site) return { title: "Site não encontrado", robots: { index: false } };
  const b = site.content.business;
  const title = `${b.name}${b.category ? ` · ${b.category}` : ""}`;
  return {
    title,
    description: site.content.hero.subheadline,
    openGraph: { title, description: site.content.hero.subheadline, type: "website", locale: "pt_BR", siteName: b.name },
    twitter: { card: "summary_large_image", title, description: site.content.hero.subheadline },
    robots: site.status === "publicado" ? { index: true } : { index: false, follow: false },
  };
}

export default async function SitePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ nv?: string }> }) {
  const { slug } = await params;
  const site = await load(slug);
  if (!site) notFound();
  // ?nv=1 = visita do próprio dono (não conta como visualização do cliente)
  const track = !(await searchParams).nv;
  const b = site.content.business;
  const ld = {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: b.name, description: site.content.hero.subheadline,
    ...(b.phone ? { telephone: b.phone } : {}), ...(b.address ? { address: b.address } : {}), ...(b.mapsUrl ? { hasMap: b.mapsUrl } : {}),
    ...(b.rating && b.ratingCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: b.rating, reviewCount: b.ratingCount } } : {}),
    ...(site.content.hours.length ? { openingHours: site.content.hours } : {}),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <SiteRender c={site.content} preview={site.status === "previa"} expiresAt={site.expires_at} slug={slug} template={site.template} track={track} /></>;
}
