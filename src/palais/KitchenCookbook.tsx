import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { coverBox } from "./GlobeEgg";
import { usePlace } from "./place";
import { floralSrc, paletteOf, useFloral } from "./florals";
import { remember, remembered } from "./letters";
import { editRecipe, postRecipe, readRecipes, type Recipe } from "./recipes";
import { noteDoing } from "./visits";

/**
 * The cookbook on the kitchen counter, and the recipes in it.
 *
 * The book lies on the counter to the right of the stove, lined up with the
 * photograph however the room has cropped it (the same trick the library globe
 * uses: coverBox). Press it and it opens on the counter's own floral paper:
 * one recipe to a spread, its name and whose it is at the top of the left
 * page with what goes in it underneath, and what to do on the right. The knobs
 * on the clasps turn the page.
 *
 * Anyone may read it. Writing a recipe in asks for the word the letters open
 * to and a name to sign it with, and whoever signed one can tidy it up later
 * (recipes.ts). Until there are any, three of the house's own are on the
 * pages.
 */

/** the three in the book to begin with, so it isn't an empty book */
const EXAMPLES: Recipe[] = [
  {
    id: -1,
    at: "",
    edited: null,
    author: "the Palais",
    name: "Blueberry Lemon Cake",
    note: "for the afternoons the kitchen smells of lemons",
    ingredients: [
      "225g butter, soft",
      "220g sugar",
      "4 eggs",
      "280g flour",
      "2 tsp baking powder",
      "the zest of 2 lemons",
      "150ml milk",
      "300g blueberries",
    ].join("\n"),
    steps: [
      "Heat the oven to 175°C and line a loaf tin.",
      "Beat the butter and sugar pale, then the eggs one at a time.",
      "Fold in the flour, baking powder and zest, then the milk.",
      "Toss the blueberries in a spoon of flour and fold them through.",
      "Bake 55 minutes, until a skewer comes out clean.",
      "Cool in the tin, then turn out and squeeze over the lemons.",
    ].join("\n"),
  },
  {
    id: -2,
    at: "",
    edited: null,
    author: "the Palais",
    name: "Sunday Morning Pancakes",
    note: "the ones worth staying in for",
    ingredients: [
      "200g flour",
      "2 tbsp sugar",
      "2 tsp baking powder",
      "a pinch of salt",
      "2 eggs",
      "300ml buttermilk",
      "50g melted butter",
    ].join("\n"),
    steps: [
      "Whisk the dry things in one bowl, the wet in another.",
      "Fold them together and leave the batter to sit ten minutes.",
      "Butter a pan over a medium heat.",
      "A ladle at a time; turn when the bubbles stay open.",
      "Keep them warm in the oven until everyone is down.",
    ].join("\n"),
  },
  {
    id: -3,
    at: "",
    edited: null,
    author: "the Palais",
    name: "Brown Butter Shortbread",
    note: "keeps a week in a tin, in theory",
    ingredients: [
      "170g butter",
      "80g sugar, and more for the tops",
      "1 tsp vanilla",
      "220g flour",
      "½ tsp salt",
    ].join("\n"),
    steps: [
      "Melt the butter until it smells of nuts and goes gold; cool it.",
      "Beat in the sugar and vanilla, then the flour and salt.",
      "Press into a tin, prick it all over, chill for an hour.",
      "Bake at 160°C for 35 minutes, until the edges colour.",
      "Sugar the top and cut it while it's still warm.",
    ].join("\n"),
  },
];

/** where the book lies, as a fraction of the kitchen photograph */
const ON_THE_COUNTER = {
  wide: { x: 0.598, base: 0.489, w: 0.075 },
  tall: { x: 0.655, base: 0.467, w: 0.115 },
};
/** the closed book's own shape (760 × 500) */
const BOOK = 500 / 760;

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export function KitchenCookbook() {
  const { place } = usePlace();
  const here = place === "kitchen";
  const spot = useRef<HTMLButtonElement>(null);
  const paper = useFloral("footer");
  const chips = useFloral("sidebar");
  const ribbon = useFloral("footer");

  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [book, setBook] = useState<Recipe[]>(EXAMPLES);
  const [writing, setWriting] = useState(false);
  const [key, setKey] = useState(() => remembered("key"));
  const [name, setName] = useState(() => remembered("name"));
  const [draft, setDraft] = useState({ name: "", note: "", ingredients: "", steps: "", editing: 0 });
  const [trouble, setTrouble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* keep the book where the photograph put it */
  useLayoutEffect(() => {
    const el = spot.current;
    const stage = el?.closest<HTMLElement>(".palais-stage");
    if (!el || !stage || !here) return;
    const fit = () => {
      const img = Array.from(stage.querySelectorAll<HTMLImageElement>(".palais-room--kitchen img"))
        .filter((i) => i.naturalWidth)
        .sort((a, b) => (parseFloat(getComputedStyle(b).opacity) || 0) - (parseFloat(getComputedStyle(a).opacity) || 0))[0];
      if (!img) return;
      const on = img.naturalHeight > img.naturalWidth ? ON_THE_COUNTER.tall : ON_THE_COUNTER.wide;
      const box = coverBox(img, stage);
      const w = box.w * on.w;
      const h = w * BOOK;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.left = `${box.left + box.w * on.x - w / 2}px`;
      el.style.top = `${box.top + box.h * on.base - h}px`;
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(stage);
    const id = setInterval(fit, 1200);      // the photographs fade in as the seasons turn
    return () => {
      watch.disconnect();
      clearInterval(id);
    };
  }, [here]);

  /* what's actually in the book, once the kitchen has been opened */
  const fetchBook = useCallback(async () => {
    try {
      const got = await readRecipes();
      if (got.length) setBook(got);
    } catch {
      /* no database yet: the three below stay on the pages */
    }
  }, []);
  useEffect(() => {
    if (open) fetchBook();
  }, [open, fetchBook]);

  const shut = useCallback(() => {
    setOpen(false);
    setWriting(false);
    setTrouble(null);
  }, []);
  const many = book.length;
  const step = useCallback((by: number) => setAt((n) => (many ? (n + by + many) % many : 0)), [many]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") shut();
      if (writing) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, writing, shut, step]);

  if (!here) return null;

  const recipe: Recipe | null = book[at] ?? book[0] ?? null;
  const mine = recipe && name && recipe.id > 0 && recipe.author.toLowerCase() === name.trim().toLowerCase();

  const send = async () => {
    if (!key.trim()) return setTrouble("The cookbook opens to the same word as the letters.");
    if (!name.trim()) return setTrouble("A recipe wants a name at the top of it.");
    if (!draft.name.trim()) return setTrouble("What is it called?");
    setBusy(true);
    setTrouble(null);
    try {
      const it = { author: name.trim(), name: draft.name, note: draft.note, ingredients: draft.ingredients, steps: draft.steps };
      if (draft.editing) await editRecipe(key.trim(), draft.editing, it);
      else await postRecipe(key.trim(), it);
      remember("key", key.trim());
      remember("name", name.trim());
      setWriting(false);
      setDraft({ name: "", note: "", ingredients: "", steps: "", editing: 0 });
      await fetchBook();
    } catch (e) {
      setTrouble(e instanceof Error ? e.message.replace(/^.*?:\s*/, "") : "That recipe wouldn't go in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={spot}
        type="button"
        className="palais-cookbook"
        aria-label="The cookbook on the counter"
        title="The recipes"
        onClick={() => {
          setOpen(true);
          noteDoing("recipes");       // Molly hears that someone opened it (visits.ts)
        }}
      >
        <img src={`${process.env.PUBLIC_URL}/palais/props/cookbook_recipes_red_gilt_closed_sticker.webp`} alt="" decoding="async" />
      </button>

      {open && (
        <div
          className="wm-backdrop"
          style={{
            ["--wm-chip" as string]: `url("${floralSrc(chips.now)}")`,
            ["--wm-jewel-side" as string]: paletteOf(chips.now).jewel,
            ["--wm-jewel-foot" as string]: paletteOf(ribbon.now).jewel,
          }}
          onPointerDown={(e) => e.target === e.currentTarget && shut()}
        >
          <div
            className="wm-panel ck-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ck-title"
            /* the paper the footer is wearing, under a thin veil so the writing reads */
            style={{ backgroundImage: `linear-gradient(rgba(253, 248, 238, 0.72), rgba(250, 243, 229, 0.78)), url("${floralSrc(paper.now)}")` }}
          >
            <div className="wm-title">
              <h2 id="ck-title">
                <span aria-hidden>✿</span> Recipes <span aria-hidden>✿</span>
              </h2>
            </div>
            <button type="button" className="wm-close" onClick={shut} aria-label="Close the cookbook">
              ×
            </button>

            <div className="ck-book">
              <img className="ck-spread" src={`${process.env.PUBLIC_URL}/palais/cookbook-open.webp`} alt="" decoding="async" />

              <button
                type="button"
                className="ck-knob ck-knob--back"
                onClick={() => step(-1)}
                disabled={many < 2 || writing}
                aria-label="The page before"
              >
                ‹
              </button>
              <button
                type="button"
                className="ck-knob ck-knob--on"
                onClick={() => step(1)}
                disabled={many < 2 || writing}
                aria-label="The next page"
              >
                ›
              </button>

              {writing ? (
                <form
                  className="ck-write"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <div className="ck-page ck-page--left">
                    <input className="ck-in ck-in--name" value={draft.name} placeholder="What it's called"
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={80} required />
                    <input className="ck-in" value={name} placeholder="Signed"
                      onChange={(e) => setName(e.target.value)} maxLength={40} required />
                    <input className="ck-in ck-in--small" value={draft.note} placeholder="a line underneath"
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })} maxLength={120} />
                    <textarea className="ck-in ck-area" value={draft.ingredients} placeholder={"What goes in it\none to a line"}
                      onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })} rows={7} />
                  </div>
                  <div className="ck-page ck-page--right">
                    <textarea className="ck-in ck-area ck-area--tall" value={draft.steps} placeholder={"What to do\none step to a line"}
                      onChange={(e) => setDraft({ ...draft, steps: e.target.value })} rows={10} />
                    <input className="ck-in ck-in--small" type="password" value={key} placeholder="the word"
                      onChange={(e) => setKey(e.target.value)} autoComplete="off" aria-label="The word that opens the cookbook" />
                    {trouble && <p className="ck-trouble">{trouble}</p>}
                    <div className="ck-doing">
                      <button type="button" className="wm-btn" onClick={() => setWriting(false)}>◀ Back</button>
                      <button type="submit" className="wm-btn wm-btn--visit" disabled={busy}>
                        {busy ? "Writing…" : draft.editing ? "Save it ✿" : "Write it in ✿"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : recipe ? (
                <>
                  <div className="ck-page ck-page--left">
                    <h3>{recipe.name}</h3>
                    <p className="ck-hand">{recipe.author}</p>
                    {recipe.note && <p className="ck-note">{recipe.note}</p>}
                    <ul>
                      {lines(recipe.ingredients).map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="ck-page ck-page--right">
                    <ol>
                      {lines(recipe.steps).map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : null}
            </div>

            {/* under the book, where it can't be missed: the quill, and which
                page of it you are on */}
            {!writing && recipe && (
              <div className="ck-below">
                <span className="ck-tally">{at + 1} of {many}</span>
                <button
                  type="button"
                  className="wm-btn wm-btn--visit ck-write-btn"
                  onClick={() => {
                    setDraft({ name: "", note: "", ingredients: "", steps: "", editing: 0 });
                    setTrouble(null);
                    setWriting(true);
                  }}
                >
                  Write a recipe ✎
                </button>
                {mine && (
                  <button
                    type="button"
                    className="wm-btn"
                    onClick={() => {
                      setDraft({
                        name: recipe.name,
                        note: recipe.note ?? "",
                        ingredients: recipe.ingredients,
                        steps: recipe.steps,
                        editing: recipe.id,
                      });
                      setTrouble(null);
                      setWriting(true);
                    }}
                  >
                    Tidy this one ✿
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
