import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Block } from "@/lib/blocks";
import { Avatar } from "@/components/ui/Avatar";
import { normaliseStreamUrl, streamProviderLabel } from "@/lib/streaming";
import { formatDateRange } from "@/lib/utils";
import {
  ArrowRight,
  ExternalLink,
  Calendar,
  ChevronDown,
  Radio,
} from "lucide-react";

/**
 * Server-component renderer for a list of page blocks. Each block type
 * is rendered by a small sub-component below. Data-driven blocks
 * (agenda, speakers, exhibitors) pull live event data at render time.
 */
export async function PageRenderer({
  blocks,
  eventId,
  eventSlug,
}: {
  blocks: Block[];
  eventId: string;
  eventSlug: string;
}) {
  return (
    <div className="space-y-12">
      {blocks.map((b, idx) => (
        <BlockSwitch key={idx} block={b} eventId={eventId} eventSlug={eventSlug} />
      ))}
    </div>
  );
}

async function BlockSwitch({
  block,
  eventId,
  eventSlug,
}: {
  block: Block;
  eventId: string;
  eventSlug: string;
}) {
  switch (block.type) {
    case "hero":
      return <HeroBlock {...block} />;
    case "richText":
      return <RichTextBlock body={block.body} />;
    case "agenda":
      return (
        <AgendaBlock
          eventId={eventId}
          eventSlug={eventSlug}
          heading={block.heading ?? "Agenda"}
          limit={block.limit}
          onlyFeatured={block.onlyFeatured}
        />
      );
    case "speakers":
      return (
        <SpeakersBlock
          eventId={eventId}
          heading={block.heading ?? "Speakers"}
          limit={block.limit}
          onlyKeynote={block.onlyKeynote}
        />
      );
    case "exhibitors":
      return (
        <ExhibitorsBlock
          eventId={eventId}
          eventSlug={eventSlug}
          heading={block.heading ?? "Exhibitors"}
          limit={block.limit}
        />
      );
    case "cta":
      return <CtaBlock {...block} />;
    case "video":
      return <VideoBlock url={block.url} caption={block.caption ?? ""} />;
    case "image":
      return (
        <ImageBlock
          url={block.url}
          alt={block.alt ?? ""}
          caption={block.caption ?? ""}
          href={block.href ?? ""}
        />
      );
    case "faq":
      return <FaqBlock heading={block.heading ?? "FAQ"} items={block.items} />;
  }
}

function HeroBlock(props: {
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  backgroundImage?: string;
}) {
  const bg = props.backgroundImage;
  return (
    <section
      className="relative overflow-hidden rounded-3xl"
      style={
        bg
          ? {
              backgroundImage: `linear-gradient(rgba(11,20,38,0.55), rgba(11,20,38,0.7)), url("${bg}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div
        className={`px-8 sm:px-12 py-16 sm:py-24 text-center ${bg ? "text-white" : "text-ink-900 bg-gradient-to-br from-brand-50 via-white to-amber-50"}`}
      >
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          {props.heading}
        </h1>
        {props.subheading ? (
          <p
            className={`mt-5 text-lg sm:text-xl max-w-2xl mx-auto ${bg ? "text-white/80" : "text-ink-600"}`}
          >
            {props.subheading}
          </p>
        ) : null}
        {props.ctaLabel && props.ctaHref ? (
          <Link
            href={props.ctaHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink-900 text-white px-6 py-3 text-sm font-semibold hover:bg-ink-800 transition"
          >
            {props.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function RichTextBlock({ body }: { body: string }) {
  // Very light markdown — paragraphs split on blank lines, single line
  // breaks preserved; no inline HTML allowed.
  const paragraphs = body.split(/\n\n+/);
  return (
    <section className="prose prose-ink max-w-none">
      <div className="space-y-4 text-ink-700 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

async function AgendaBlock({
  eventId,
  eventSlug,
  heading,
  limit,
  onlyFeatured,
}: {
  eventId: string;
  eventSlug: string;
  heading: string;
  limit: number;
  onlyFeatured: boolean;
}) {
  const sessions = await prisma.session.findMany({
    where: {
      eventId,
      ...(onlyFeatured ? { isFeatured: true } : {}),
    },
    orderBy: { startTime: "asc" },
    take: limit,
  });
  return (
    <section>
      <h2 className="text-2xl font-bold text-ink-900 mb-5">{heading}</h2>
      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/e/${eventSlug}/sessions/${s.id}`}
              className="card p-5 flex items-start gap-4 hover:shadow-pop transition-shadow"
            >
              <div className="shrink-0 w-16 text-center">
                <div className="text-xs text-ink-400 uppercase">
                  {new Date(s.startTime).toLocaleDateString("en-GB", { month: "short" })}
                </div>
                <div className="text-2xl font-bold text-brand-700 leading-none">
                  {new Date(s.startTime).getDate()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-ink-900 truncate">{s.title}</h3>
                <p className="text-sm text-ink-500 line-clamp-2 mt-0.5">{s.description}</p>
                <div className="mt-2 text-xs text-ink-500 inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateRange(s.startTime, s.endTime)}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {sessions.length === 0 ? (
          <li className="text-sm text-ink-500">No sessions to show yet.</li>
        ) : null}
      </ul>
    </section>
  );
}

async function SpeakersBlock({
  eventId,
  heading,
  limit,
  onlyKeynote,
}: {
  eventId: string;
  heading: string;
  limit: number;
  onlyKeynote: boolean;
}) {
  const speakers = await prisma.speaker.findMany({
    where: { eventId, ...(onlyKeynote ? { isKeynote: true } : {}) },
    orderBy: [{ isKeynote: "desc" }, { name: "asc" }],
    take: limit,
  });
  return (
    <section>
      <h2 className="text-2xl font-bold text-ink-900 mb-5">{heading}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {speakers.map((sp) => (
          <div key={sp.id} className="card p-5 flex gap-4">
            <Avatar name={sp.name} src={sp.photoUrl} size={56} />
            <div className="min-w-0">
              <div className="font-semibold text-ink-900">{sp.name}</div>
              {sp.jobTitle ? (
                <div className="text-xs text-ink-500">
                  {sp.jobTitle}
                  {sp.organization ? ` · ${sp.organization}` : ""}
                </div>
              ) : null}
              {sp.bio ? (
                <p className="mt-2 text-xs text-ink-600 line-clamp-3">{sp.bio}</p>
              ) : null}
            </div>
          </div>
        ))}
        {speakers.length === 0 ? (
          <div className="text-sm text-ink-500">No speakers to show yet.</div>
        ) : null}
      </div>
    </section>
  );
}

async function ExhibitorsBlock({
  eventId,
  eventSlug,
  heading,
  limit,
}: {
  eventId: string;
  eventSlug: string;
  heading: string;
  limit: number;
}) {
  const exhibitors = await prisma.exhibitor.findMany({
    where: { eventId },
    orderBy: { name: "asc" },
    take: limit,
  });
  return (
    <section>
      <h2 className="text-2xl font-bold text-ink-900 mb-5">{heading}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {exhibitors.map((e) => (
          <Link
            key={e.id}
            href={`/e/${eventSlug}/exhibitors`}
            className="card p-5 flex flex-col items-center text-center hover:shadow-pop transition-shadow"
          >
            {e.logoUrl ? (
              <Image
                src={e.logoUrl}
                alt={e.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-md object-contain ring-1 ring-ink-100 bg-white"
              />
            ) : (
              <div className="h-16 w-16 rounded-md bg-ink-100" />
            )}
            <div className="mt-3 text-sm font-medium text-ink-900">{e.name}</div>
            {e.category ? (
              <div className="text-[10px] uppercase tracking-wider text-ink-500 mt-0.5">
                {e.category}
              </div>
            ) : null}
          </Link>
        ))}
        {exhibitors.length === 0 ? (
          <div className="text-sm text-ink-500">No exhibitors to show yet.</div>
        ) : null}
      </div>
    </section>
  );
}

function CtaBlock(props: {
  heading: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  variant: "dark" | "light";
}) {
  const dark = props.variant === "dark";
  return (
    <section
      className={`rounded-3xl p-10 sm:p-14 text-center ${
        dark ? "bg-ink-900 text-white" : "bg-brand-50 text-ink-900"
      }`}
    >
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        {props.heading}
      </h2>
      {props.body ? (
        <p className={`mt-3 max-w-2xl mx-auto ${dark ? "text-white/70" : "text-ink-600"}`}>
          {props.body}
        </p>
      ) : null}
      <Link
        href={props.ctaHref}
        className={`mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
          dark
            ? "bg-accent text-ink-900 hover:bg-accent-dark hover:text-white"
            : "bg-ink-900 text-white hover:bg-ink-800"
        }`}
      >
        {props.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function VideoBlock({ url, caption }: { url: string; caption: string }) {
  const stream = normaliseStreamUrl(url);
  if (!stream) return null;
  return (
    <section>
      {stream.embedUrl ? (
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black ring-1 ring-ink-100">
          <iframe
            src={stream.embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={stream.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-video w-full rounded-2xl bg-gradient-to-br from-ink-900 to-brand-900 text-white flex flex-col items-center justify-center p-6 hover:from-ink-800 transition"
        >
          <Radio className="h-10 w-10 text-accent mb-3" />
          <div className="text-sm uppercase tracking-[0.2em] text-accent">
            {streamProviderLabel(stream.provider)}
          </div>
          <div className="mt-2 text-sm text-white/80 inline-flex items-center gap-2">
            Open external <ExternalLink className="h-3.5 w-3.5" />
          </div>
        </a>
      )}
      {caption ? (
        <p className="mt-3 text-xs text-ink-500 text-center">{caption}</p>
      ) : null}
    </section>
  );
}

function ImageBlock({
  url,
  alt,
  caption,
  href,
}: {
  url: string;
  alt: string;
  caption: string;
  href: string;
}) {
  if (!url) return null;
  const img = (
    <Image
      src={url}
      alt={alt}
      width={1600}
      height={900}
      sizes="(min-width: 1024px) 800px, 100vw"
      className="w-full h-auto rounded-2xl ring-1 ring-ink-100"
    />
  );
  return (
    <section className="text-center">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
      {caption ? (
        <p className="mt-3 text-xs text-ink-500">{caption}</p>
      ) : null}
    </section>
  );
}

function FaqBlock({
  heading,
  items,
}: {
  heading: string;
  items: { q: string; a: string }[];
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-ink-900 mb-5">{heading}</h2>
      <div className="space-y-2">
        {items.map((it, i) => (
          <details
            key={i}
            className="card p-5 group"
          >
            <summary className="cursor-pointer flex items-center justify-between gap-3 font-medium text-ink-900 list-none">
              {it.q}
              <ChevronDown className="h-4 w-4 text-ink-500 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-ink-600 leading-relaxed whitespace-pre-line">
              {it.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
