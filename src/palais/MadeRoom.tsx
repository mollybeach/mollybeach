import { useEffect, useState } from "react";
import { hashExtra, usePlace } from "./place";
import { usePortrait } from "./PortraitTerrace";
import { SEASON_ORDER, loadRooms, roomById, useMadeRooms } from "./madeRooms";

/**
 * A room made at Brat Academy's island maker (madeRooms.ts), at #made/<id>:
 * its four seasons, wide on a computer and tall on a phone, turning on the
 * terrace's season timeline like every other room (SeasonRoom.tsx), with
 * who made it in the corner.
 *
 * Only the ready ones can be walked into. An address for a room that isn't
 * there (yet) says so.
 */
export function MadeRoom() {
  const { place } = usePlace();
  const here = place === "made";
  const [id, setId] = useState(hashExtra);
  useEffect(() => {
    const on = () => setId(hashExtra());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useMadeRooms();
  const room = roomById(id);
  // a room made a moment ago may not be among the ones fetched when the page opened
  const [looked, setLooked] = useState(false);
  useEffect(() => {
    if (!here || !id || room) return;
    setLooked(false);
    Promise.resolve(loadRooms(true)).finally(() => setLooked(true));
  }, [here, id, room]);

  const tall = usePortrait();
  const ready = room?.status === "ready";
  return (
    <div aria-hidden className="palais-room palais-room--away palais-room--made">
      <div className="palais-seasons">
        {ready &&
          SEASON_ORDER.map((season) => (
            <img
              key={`${room.id}-${season}`}
              src={room.pictures[`${season}-${tall ? "mobile" : "desktop"}`]}
              alt=""
              decoding="async"
              className={`palais-season palais-season--${season}`}
              style={{ objectPosition: tall ? "50% 100%" : "50% 60%" }}
            />
          ))}
      </div>
      {here && ready && (
        <p className="palais-made-by">
          <b>{room.name}</b>
          {room.made_by_name && <span>made by {room.made_by_name.split(" ")[0]} at Brat Academy</span>}
        </p>
      )}
      {here && !ready && (looked || room) && (
        <p className="palais-made-missing">{room ? `${room.name} is still being built.` : "There's no room here (yet)."}</p>
      )}
    </div>
  );
}
