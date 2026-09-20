import { db, dbConfigured } from "./layoutsDb";

/**
 * The recipes in the kitchen's cookbook.
 *
 * Anyone may read them — a cookbook on a counter is for reading. Writing one
 * in asks for the word the letters open to and a name to sign it with, the
 * same way the letters work (supabase/migrations/…_palais_recipes.sql).
 */

export interface Recipe {
  id: number;
  at: string;
  edited: string | null;
  author: string;
  name: string;
  note: string | null;
  ingredients: string;
  steps: string;
}

export const recipesConfigured = dbConfigured;

export async function readRecipes(): Promise<Recipe[]> {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_recipes");
  if (error) throw new Error(error.message);
  return (data ?? []) as Recipe[];
}

export async function postRecipe(
  key: string,
  r: { author: string; name: string; note?: string; ingredients: string; steps: string },
) {
  const sb = await db();
  const { data, error } = await sb.rpc("palais_recipe_post", {
    p_key: key,
    p_author: r.author,
    p_name: r.name,
    p_ingredients: r.ingredients,
    p_steps: r.steps,
    p_note: r.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as number;
}

export async function editRecipe(
  key: string,
  id: number,
  r: { author: string; name: string; note?: string; ingredients: string; steps: string },
) {
  const sb = await db();
  const { error } = await sb.rpc("palais_recipe_edit", {
    p_key: key,
    p_id: id,
    p_author: r.author,
    p_name: r.name,
    p_ingredients: r.ingredients,
    p_steps: r.steps,
    p_note: r.note ?? null,
  });
  if (error) throw new Error(error.message);
}
