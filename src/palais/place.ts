import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Which room of the Palais you're standing in.
 *
 * The palace terrace is home. The closet (the Wardrobe Wing on the world map)
 * and the Lakehouse are rooms you can walk into. Every room stays on the page
 * the whole time, and only the one you're in shows, so the seasons keep turning together
 * and a room you come back to is exactly as you left it.
 *
 * The room is kept in the address (#closet, #lakehouse), so a refresh or a shared link
 * opens the same room.
 */

export const PLACES = ["palace", "closet", "lakehouse"] as const;
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
  }, []);

  return { place, go };
}

export const PlaceNow = createContext<{ place: Place; go: (next: Place) => void }>({
  place: "palace",
  go: () => {},
});

export const usePlace = () => useContext(PlaceNow);
