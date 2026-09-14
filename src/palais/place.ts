import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Which room of the Palais you're standing in.
 *
 * The palace terrace is home. The closet (the Wardrobe Wing on the world map)
 * the Lakehouse, the Steaming Lagoon, the Rainwood, the Amphitheatre, the City of Domes, the Jacaranda Quarter, the Glass Reef, the Lantern Isles, the Shore of All Shores and the Hollow of Small Stars are rooms you can walk into. Every room stays on the page
 * the whole time, and only the one you're in shows, so the seasons keep turning together
 * and a room you come back to is exactly as you left it.
 *
 * The room is kept in the address (#closet, #lakehouse, #lagoon, #rainwood, #gorge, #domes, #jacaranda, #reef, #lanterns, #shore, #caves), so a refresh or a shared link
 * opens the same room.
 */

export const PLACES = ["palace", "kitchen", "bathroom", "garden", "closet", "lakehouse", "lagoon", "rainwood", "gorge", "domes", "jacaranda", "reef", "lanterns", "shore", "caves"] as const;
export type Place = (typeof PLACES)[number];

const fromHash = (): Place => {
  const h = window.location.hash.replace("#", "");
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
    const url = next === "palace" ? window.location.pathname + window.location.search : `#${next}`;
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
  closet: "The Wardrobe Wing",
  lakehouse: "The Lakehouse",
  lagoon: "The Steaming Lagoon",
  rainwood: "The Rainwood",
  gorge: "The Amphitheatre",
  domes: "The City of Domes",
  jacaranda: "The Jacaranda Quarter",
  reef: "The Glass Reef",
  lanterns: "The Lantern Isles",
  shore: "The Shore of All Shores",
  caves: "The Hollow of Small Stars",
};
