import { useState } from "react";

/**
 * The 🎱 splitter on the library iMac.
 *
 * Paste a long piece of writing and it comes back cut into parts you can copy
 * one at a time: so many characters each, so many words, or so many lines,
 * however big you like. Its neighbour in the dock, 🧵 One line, takes writing
 * on many lines and gives it back on one. It all stays in the browser.
 */

type By = "chars" | "words" | "lines";

const UNITS: Record<By, string> = { chars: "characters", words: "words", lines: "lines" };
const START: Record<By, number> = { chars: 7999, words: 1000, lines: 50 };

/** cut the text into parts of `size` characters, words or lines; words and
    lines keep the spacing and line breaks they came with */
function split(text: string, by: By, size: number): string[] {
  if (!text || size < 1) return [];
  if (by === "chars") {
    const parts: string[] = [];
    for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
    return parts;
  }
  // each piece is one word or line along with whatever follows it
  const pieces = by === "words" ? text.match(/\S+\s*/g) ?? [] : text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const lead = by === "words" ? text.match(/^\s*/)?.[0] ?? "" : "";
  const parts: string[] = [];
  for (let i = 0; i < pieces.length; i += size) parts.push((i === 0 ? lead : "") + pieces.slice(i, i + size).join(""));
  return parts;
}

/** every line break and run of spaces becomes one space */
const flatten = (text: string) => text.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim();

const n = (x: number) => x.toLocaleString();
const plural = (x: number, word: string) => `${n(x)} ${x === 1 ? word.replace(/s$/, "") : word}`;
const count = (text: string, by: By) =>
  by === "chars" ? text.length : by === "words" ? (text.match(/\S+/g) ?? []).length : (text.match(/[^\n]*\n|[^\n]+$/g) ?? []).length;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={done ? "split-copy is-done" : "split-copy"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* the clipboard said no; nothing to do */
        }
      }}
    >
      {done ? "Copied!" : label}
    </button>
  );
}

export function StringSplitter() {
  const [source, setSource] = useState("");
  const [by, setBy] = useState<By>("chars");
  const [size, setSize] = useState(START.chars);
  const parts = split(source, by, size);

  return (
    <div className="split">
      <div className="split-controls">
        <label>
          Split by
          <select
            value={by}
            onChange={(e) => {
              const next = e.target.value as By;
              setBy(next);
              setSize(START[next]);
            }}
          >
            <option value="chars">characters</option>
            <option value="words">words</option>
            <option value="lines">lines</option>
          </select>
        </label>
        <label>
          How many in each part
          <input type="number" min={1} value={size} onChange={(e) => setSize(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
        </label>
      </div>

      <label className="split-label">
        Your text
        <span>
          {plural(source.length, "chars")}
          {by !== "chars" && source ? ` · ${plural(count(source, by), UNITS[by])}` : ""}
          {parts.length > 0 ? ` · ${plural(parts.length, "parts")}` : ""}
        </span>
      </label>
      <textarea className="split-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Paste a big block of text here…" spellCheck={false} />

      {parts.length > 0 && (
        <section className="split-parts" aria-label="The parts">
          {parts.map((part, i) => {
            const full = i < parts.length - 1 || count(part, by) === size;
            return (
              <div key={i} className="split-part">
                <div className="split-part-head">
                  <b>
                    Part {i + 1} of {parts.length}
                  </b>
                  <span>
                    {plural(part.length, "chars")}
                    {by !== "chars" ? ` · ${plural(count(part, by), UNITS[by])}` : ""} · {full ? "full" : "the rest"}
                  </span>
                  <CopyButton text={part} label={`Copy part ${i + 1}`} />
                </div>
                <textarea readOnly value={part} spellCheck={false} rows={4} aria-label={`Part ${i + 1} of ${parts.length}`} />
              </div>
            );
          })}
        </section>
      )}

    </div>
  );
}

/** 🧵 One line: paste writing on many lines and it comes out on one */
export function OneLine() {
  const [loose, setLoose] = useState("");
  const flat = flatten(loose);
  return (
    <div className="split">
      <label className="split-label">
        Your lines
        <span>{loose ? `${plural(loose.split(/\r?\n/).length, "lines")} · ${plural(loose.length, "chars")}` : "every line break and run of spaces becomes one space"}</span>
      </label>
      <textarea className="split-source" value={loose} onChange={(e) => setLoose(e.target.value)} placeholder="Paste writing on many lines here…" spellCheck={false} />
      {flat && (
        <div className="split-part">
          <div className="split-part-head">
            <b>One line</b>
            <span>{plural(flat.length, "chars")}</span>
            <CopyButton text={flat} label="Copy" />
          </div>
          <textarea readOnly value={flat} spellCheck={false} rows={4} aria-label="The text on one line" />
        </div>
      )}
    </div>
  );
}
