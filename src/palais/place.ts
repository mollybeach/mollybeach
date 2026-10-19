import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Which room of the Palais you're standing in.
 *
 * The palace terrace is home. The closet (the Closet on the world map)
 * the Lakehouse, the Lagoon, the Rainwood, the Amphitheatre, the Riviera, the Jacaranda Quarter, the Glass Reef, the Lantern Isles, the Shore and the Blue Caves are rooms you can walk into. Every room stays on the page
 * the whole time, and only the one you're in shows, so the seasons keep turning together
 * and a room you come back to is exactly as you left it.
 *
 * The room is kept in the address (#closet, #lakehouse, #lagoon, #rainwood, #gorge, #riviera, #jacaranda, #reef, #lanterns, #shore, #caves), so a refresh or a shared link
 * opens the same room.
 */

export const PLACES = ["palace", "kitchen", "bathroom", "garden", "closet", "lakehouse", "lagoon", "rainwood", "gorge", "domes", "jacaranda", "reef", "lanterns", "shore", "caves", "madeleine", "library", "boudoir", "sunliner", "school"] as const;
export type Place = (typeof PLACES)[number];

/** what comes after the room in the address: #closet/dress opens the dress
    form in the Wardrobe Wing. Rooms that have nothing to open ignore it. */
export const hashExtra = () => window.location.hash.replace("#", "").split("/")[1] ?? "";

/** other names a room answers to in the address: #bratz is Brat Academy, and
    the Riviera still answers to the #domes it used to be called */
const ALSO: Record<string, Place> = { bratz: "school", riviera: "domes" };

/** the address a room shows, where it isn't the room's own name: the Riviera
    is still "domes" inside (its saved layouts are kept under that), but its
    address is #riviera */
const ADDRESS: Partial<Record<Place, string>> = { domes: "riviera" };
export const addressOf = (p: Place) => ADDRESS[p] ?? p;

const fromHash = (): Place => {
  const h = window.location.hash.replace("#", "").split("/")[0];
  if (ALSO[h]) return ALSO[h];
  return (PLACES as readonly string[]).includes(h) ? (h as Place) : "palace";
};

export function usePlaceState() {
  const [place, setPlace] = useState<Place>(fromHash);

  useEffect(() => {
    const onHash = () => setPlace(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((next: Place) => {
    setPlace(next);
    const url = next === "palace" ? window.location.pathname + window.location.search : `#${addressOf(next)}`;
    window.history.replaceState(window.history.state, "", url);
    // replaceState fires no event, so tell the rest of the page (the sidebar folds away in the rooms)
    window.dispatchEvent(new CustomEvent("palais:place", { detail: next }));
  }, []);

  return { place, go };
}

export const PlaceNow = createContext<{ place: Place; go: (next: Place) => void }>({
  place: "palace",
  go: () => {},
});

export const usePlace = () => useContext(PlaceNow);

/** what the world map calls each room */
export const PLACE_NAMES: Record<Place, string> = {
  palace: "The Palais",
  kitchen: "The Kitchen",
  bathroom: "The Bathroom",
  garden: "The Glasshouse",
  closet: "The Closet",
  lakehouse: "The Lakehouse",
  lagoon: "The Lagoon",
  rainwood: "The Rainwood",
  gorge: "The Amphitheatre",
  domes: "The Riviera",
  jacaranda: "The Jacaranda Quarter",
  reef: "The Glass Reef",
  lanterns: "The Lantern Isles",
  shore: "The Shore",
  caves: "The Blue Caves",
  madeleine: "Madeleine Room",
  library: "The Library",
  boudoir: "The Boudoir",
  sunliner: "Sunliner Train",
  school: "Brat Academy",
};
