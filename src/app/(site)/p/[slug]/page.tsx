import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteRender from "@/components/SiteRender";
import type { SiteRow } from "@/lib/site/types";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const { data } = await createClient().rpc("get_site", { p_slug: slug });
  return (data as SiteRow | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const site = await load((await params).slug);
  if (!site) return { title: "Site não encontrado", robots: { index: false } };
  const b = site.content.business;
  return {
    title: `${b.name}${b.category ? ` · ${b.category}` : ""}`,
    description: site.content.hero.subheadline,
    robots: site.status === "publicado" ? { index: true } : { index: false, follow: false },
  };
}

export default async function SitePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ nv?: string }> }) {
  const { slug } = await params;
  const site = await load(slug);
  if (!site) notFound();
  // ?nv=1 = visita do próprio dono (não conta como visualização do cliente)
  if (!(await searchParams).nv) await createClient().rpc("track_view", { p_slug: slug });
  return <SiteRender c={site.content} preview={site.status === "previa"} expiresAt={site.expires_at} />;
}
