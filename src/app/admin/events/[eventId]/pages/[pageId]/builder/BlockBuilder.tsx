"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  BLOCK_TYPES,
  BLOCK_LABELS,
  blankBlock,
  type Block,
  type BlockType,
} from "@/lib/blocks";

export function BlockBuilder({
  pageId,
  initialBlocks,
}: {
  pageId: string;
  initialBlocks: Block[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [dirty, setDirty] = useState(false);

  function update(idx: number, next: Block) {
    setBlocks((arr) => arr.map((b, i) => (i === idx ? next : b)));
    setDirty(true);
  }
  function remove(idx: number) {
    if (!confirm("Remove this block?")) return;
    setBlocks((arr) => arr.filter((_, i) => i !== idx));
    setDirty(true);
  }
  function move(idx: number, dir: -1 | 1) {
    setBlocks((arr) => {
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    setDirty(true);
  }
  function add(type: BlockType) {
    setBlocks((arr) => [...arr, blankBlock(type)]);
    setPicking(false);
    setDirty(true);
  }

  async function save() {
    setError(null);
    setInfo(null);
    setSaving(true);
    const res = await fetch(`/api/admin/pages/${pageId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blocks: blocks.length > 0 ? blocks : null }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save");
      return;
    }
    setInfo("Saved.");
    setDirty(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-white/80 backdrop-blur border-b border-ink-100 flex items-center justify-between gap-3">
        <div className="text-xs text-ink-500">
          {blocks.length} block{blocks.length === 1 ? "" : "s"}
          {dirty ? <span className="text-amber-700 ml-2">· unsaved changes</span> : null}
        </div>
        <div className="flex items-center gap-2">
          {info ? (
            <span className="text-xs text-emerald-700 inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> {info}
            </span>
          ) : null}
          {error ? (
            <span className="text-xs text-red-600 inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </span>
          ) : null}
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save page
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {blocks.map((b, idx) => (
          <BlockCard
            key={idx}
            block={b}
            index={idx}
            total={blocks.length}
            onUpdate={(next) => update(idx, next)}
            onRemove={() => remove(idx)}
            onMove={(dir) => move(idx, dir)}
          />
        ))}
        {blocks.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">
            Empty page. Add your first block below.
          </div>
        ) : null}
      </div>

      {picking ? (
        <div className="card p-5">
          <div className="text-sm font-semibold text-ink-900 mb-3">Pick a block</div>
          <div className="grid sm:grid-cols-3 gap-2">
            {BLOCK_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => add(t)}
                className="text-left rounded-lg ring-1 ring-ink-200 hover:ring-brand-700 px-4 py-3 transition"
              >
                <div className="font-medium text-ink-900">{BLOCK_LABELS[t]}</div>
                <div className="text-xs text-ink-500 font-mono mt-0.5">{t}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={() => setPicking(false)} className="btn-ghost text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setPicking(true)}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add block
        </button>
      )}
    </div>
  );
}

function BlockCard({
  block,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  block: Block;
  index: number;
  total: number;
  onUpdate: (next: Block) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-700">
          {BLOCK_LABELS[block.type]}
          <span className="ml-2 text-ink-400 font-mono">#{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-ink-100 disabled:opacity-30"
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-ink-100 disabled:opacity-30"
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
            title="Remove block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <BlockFields block={block} onUpdate={onUpdate} />
    </div>
  );
}

function BlockFields({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (next: Block) => void;
}) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <Input label="Headline" value={block.heading} onChange={(v) => onUpdate({ ...block, heading: v })} />
          <Input label="Sub-headline" value={block.subheading ?? ""} onChange={(v) => onUpdate({ ...block, subheading: v })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="CTA label (optional)" value={block.ctaLabel ?? ""} onChange={(v) => onUpdate({ ...block, ctaLabel: v })} />
            <Input label="CTA link (optional)" value={block.ctaHref ?? ""} onChange={(v) => onUpdate({ ...block, ctaHref: v })} placeholder="/e/your-slug/tickets" />
          </div>
          <Input label="Background image URL (optional)" value={block.backgroundImage ?? ""} onChange={(v) => onUpdate({ ...block, backgroundImage: v })} />
        </div>
      );
    case "richText":
      return (
        <Textarea
          label="Body"
          value={block.body}
          onChange={(v) => onUpdate({ ...block, body: v })}
          rows={8}
          help="Plain text; blank lines start a new paragraph."
        />
      );
    case "agenda":
      return (
        <div className="space-y-3">
          <Input label="Heading" value={block.heading ?? "Agenda"} onChange={(v) => onUpdate({ ...block, heading: v })} />
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <NumberInput label="How many sessions to show" value={block.limit} min={1} max={50} onChange={(n) => onUpdate({ ...block, limit: n })} />
            <Checkbox label="Featured sessions only" checked={block.onlyFeatured} onChange={(v) => onUpdate({ ...block, onlyFeatured: v })} />
          </div>
        </div>
      );
    case "speakers":
      return (
        <div className="space-y-3">
          <Input label="Heading" value={block.heading ?? "Speakers"} onChange={(v) => onUpdate({ ...block, heading: v })} />
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <NumberInput label="How many speakers" value={block.limit} min={1} max={50} onChange={(n) => onUpdate({ ...block, limit: n })} />
            <Checkbox label="Keynote speakers only" checked={block.onlyKeynote} onChange={(v) => onUpdate({ ...block, onlyKeynote: v })} />
          </div>
        </div>
      );
    case "exhibitors":
      return (
        <div className="space-y-3">
          <Input label="Heading" value={block.heading ?? "Exhibitors"} onChange={(v) => onUpdate({ ...block, heading: v })} />
          <NumberInput label="How many exhibitors" value={block.limit} min={1} max={100} onChange={(n) => onUpdate({ ...block, limit: n })} />
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <Input label="Heading" value={block.heading} onChange={(v) => onUpdate({ ...block, heading: v })} />
          <Textarea label="Body" value={block.body ?? ""} onChange={(v) => onUpdate({ ...block, body: v })} rows={3} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Button label" value={block.ctaLabel} onChange={(v) => onUpdate({ ...block, ctaLabel: v })} />
            <Input label="Button link" value={block.ctaHref} onChange={(v) => onUpdate({ ...block, ctaHref: v })} />
          </div>
          <div>
            <label className="label">Style</label>
            <select
              className="input"
              value={block.variant}
              onChange={(e) =>
                onUpdate({ ...block, variant: e.target.value as "dark" | "light" })
              }
            >
              <option value="dark">Dark (ink background)</option>
              <option value="light">Light (brand tint)</option>
            </select>
          </div>
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <Input
            label="Video URL"
            value={block.url}
            onChange={(v) => onUpdate({ ...block, url: v })}
            placeholder="https://youtu.be/... or zoom/teams/meet link"
          />
          <Input label="Caption (optional)" value={block.caption ?? ""} onChange={(v) => onUpdate({ ...block, caption: v })} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <Input label="Image URL" value={block.url} onChange={(v) => onUpdate({ ...block, url: v })} />
          <Input label="Alt text" value={block.alt ?? ""} onChange={(v) => onUpdate({ ...block, alt: v })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Caption (optional)" value={block.caption ?? ""} onChange={(v) => onUpdate({ ...block, caption: v })} />
            <Input label="Link to (optional)" value={block.href ?? ""} onChange={(v) => onUpdate({ ...block, href: v })} />
          </div>
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          <Input label="Heading" value={block.heading ?? "FAQ"} onChange={(v) => onUpdate({ ...block, heading: v })} />
          {block.items.map((it, i) => (
            <div key={i} className="rounded-lg ring-1 ring-ink-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">Item #{i + 1}</span>
                {block.items.length > 1 ? (
                  <button
                    onClick={() =>
                      onUpdate({
                        ...block,
                        items: block.items.filter((_, j) => j !== i),
                      })
                    }
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <Input
                label="Question"
                value={it.q}
                onChange={(v) =>
                  onUpdate({
                    ...block,
                    items: block.items.map((x, j) => (j === i ? { ...x, q: v } : x)),
                  })
                }
              />
              <Textarea
                label="Answer"
                rows={3}
                value={it.a}
                onChange={(v) =>
                  onUpdate({
                    ...block,
                    items: block.items.map((x, j) => (j === i ? { ...x, a: v } : x)),
                  })
                }
              />
            </div>
          ))}
          <button
            onClick={() =>
              onUpdate({ ...block, items: [...block.items, { q: "", a: "" }] })
            }
            className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add Q&amp;A
          </button>
        </div>
      );
  }
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  help?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {help ? <p className="mt-1 text-xs text-ink-500">{help}</p> : null}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        className="input"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm pt-7">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
