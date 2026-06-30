import { z } from "zod";

/**
 * Page-builder block catalogue. The CustomPage.blocks column stores a
 * JSON-encoded array of these. Public render: PageRenderer maps each
 * block to a component. Admin edit: BlockEditor handles each type.
 *
 * Adding a new block:
 *   1. Add it to BLOCK_TYPES + the discriminated union below
 *   2. Add a default in BLANK_BLOCK
 *   3. Add the renderer case to PageRenderer
 *   4. Add the editor case to BlockEditor
 */

export const BLOCK_TYPES = [
  "hero",
  "richText",
  "agenda",
  "speakers",
  "exhibitors",
  "cta",
  "video",
  "image",
  "faq",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero banner",
  richText: "Text block",
  agenda: "Live agenda",
  speakers: "Speaker grid",
  exhibitors: "Exhibitor grid",
  cta: "Call-to-action",
  video: "Video / livestream",
  image: "Image",
  faq: "FAQ accordion",
};

const heroSchema = z.object({
  type: z.literal("hero"),
  heading: z.string(),
  subheading: z.string().optional().default(""),
  ctaLabel: z.string().optional().default(""),
  ctaHref: z.string().optional().default(""),
  backgroundImage: z.string().optional().default(""),
});

const richTextSchema = z.object({
  type: z.literal("richText"),
  body: z.string(),
});

const agendaSchema = z.object({
  type: z.literal("agenda"),
  heading: z.string().optional().default("Agenda"),
  limit: z.number().int().min(1).max(50).default(8),
  onlyFeatured: z.boolean().default(false),
});

const speakersSchema = z.object({
  type: z.literal("speakers"),
  heading: z.string().optional().default("Speakers"),
  limit: z.number().int().min(1).max(50).default(12),
  onlyKeynote: z.boolean().default(false),
});

const exhibitorsSchema = z.object({
  type: z.literal("exhibitors"),
  heading: z.string().optional().default("Exhibitors"),
  limit: z.number().int().min(1).max(100).default(24),
});

const ctaSchema = z.object({
  type: z.literal("cta"),
  heading: z.string(),
  body: z.string().optional().default(""),
  ctaLabel: z.string(),
  ctaHref: z.string(),
  variant: z.enum(["dark", "light"]).default("dark"),
});

const videoSchema = z.object({
  type: z.literal("video"),
  url: z.string(),
  caption: z.string().optional().default(""),
});

const imageSchema = z.object({
  type: z.literal("image"),
  url: z.string(),
  alt: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  href: z.string().optional().default(""),
});

const faqSchema = z.object({
  type: z.literal("faq"),
  heading: z.string().optional().default("FAQ"),
  items: z
    .array(
      z.object({
        q: z.string(),
        a: z.string(),
      }),
    )
    .min(1),
});

export const blockSchema = z.discriminatedUnion("type", [
  heroSchema,
  richTextSchema,
  agendaSchema,
  speakersSchema,
  exhibitorsSchema,
  ctaSchema,
  videoSchema,
  imageSchema,
  faqSchema,
]);
export type Block = z.infer<typeof blockSchema>;

export const blocksSchema = z.array(blockSchema);

export function parseBlocks(json: string | null | undefined): Block[] | null {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    const parsed = blocksSchema.safeParse(data);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function blankBlock(type: BlockType): Block {
  switch (type) {
    case "hero":
      return {
        type: "hero",
        heading: "Your headline",
        subheading: "One short sentence.",
        ctaLabel: "",
        ctaHref: "",
        backgroundImage: "",
      };
    case "richText":
      return { type: "richText", body: "Write your content here." };
    case "agenda":
      return { type: "agenda", heading: "Agenda", limit: 8, onlyFeatured: false };
    case "speakers":
      return { type: "speakers", heading: "Speakers", limit: 12, onlyKeynote: false };
    case "exhibitors":
      return { type: "exhibitors", heading: "Exhibitors", limit: 24 };
    case "cta":
      return {
        type: "cta",
        heading: "Ready to join?",
        body: "",
        ctaLabel: "Register",
        ctaHref: "#",
        variant: "dark",
      };
    case "video":
      return { type: "video", url: "", caption: "" };
    case "image":
      return { type: "image", url: "", alt: "", caption: "", href: "" };
    case "faq":
      return {
        type: "faq",
        heading: "FAQ",
        items: [{ q: "Question?", a: "Answer." }],
      };
  }
}
