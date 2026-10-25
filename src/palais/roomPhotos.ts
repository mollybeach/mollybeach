/**
 * Where each room's photographs are kept (public/palais/rooms): a folder per
 * room, named for it on the map, with the computer's wide photographs in
 * `desktop/`, the phone's tall ones in `mobile/`, the sky-and-water masks the
 * living photographs use in `sky-water-masks/` (LivingPhoto.tsx), the picture
 * a shared link shows in `social-preview/`, and the picture on its card on the
 * world map in `stop_card/`.
 *
 * A photograph is still named for its room's own photographs (`school-spring`,
 * `school-portrait-spring`…), so the first part of its name says which folder
 * it's in, and "-portrait" says it's a phone's.
 */

/** each room's photographs' own name, and the folder they're kept in */
const ROOM_FOLDER: Record<string, string> = {
  room: "terrace",
  kitchen: "kitchen",
  bathroom: "bathroom",
  garden: "glasshouse",
  closet: "closet",
  lakehouse: "lakehouse",
  lagoon: "lagoon",
  rainwood: "rainwood",
  amphitheatre: "amphitheatre",
  domes: "riviera",
  jacaranda: "jacaranda-quarter",
  reef: "glass-reef",
  lanterns: "lantern-isles",
  shore: "shore",
  caves: "blue-caves",
  madeleine: "madeleine-room",
  library: "library",
  boudoir: "boudoir",
  sunliner: "sunliner-train",
  school: "brat-academy",
  crystal: "crystal-ballroom",
};

/** each place on the map, and its room's folder */
const PLACE_FOLDER: Record<string, string> = {
  palace: "terrace",
  garden: "glasshouse",
  gorge: "amphitheatre",
  domes: "riviera",
  jacaranda: "jacaranda-quarter",
  reef: "glass-reef",
  lanterns: "lantern-isles",
  caves: "blue-caves",
  madeleine: "madeleine-room",
  sunliner: "sunliner-train",
  school: "brat-academy",
  crystal: "crystal-ballroom",
};

/** the picture on a room's card on the world map, kept with the room
    (`stop_card/stop_card_school.webp`, or by season, `stop_card_garden-spring`) */
export function stopCardPicture(place: string, which = "") {
  return `${process.env.PUBLIC_URL}/palais/room_backgrounds_and_social_previews/${PLACE_FOLDER[place] ?? place}/stop_card/stop_card_${place}${which}.webp`;
}

/** a room photograph's address, from its name (`school-portrait-spring`) */
export function roomPhoto(name: string) {
  const folder = ROOM_FOLDER[name.split("-")[0]] ?? name.split("-")[0];
  const device = name.includes("-portrait") ? "mobile" : "desktop";
  return `${process.env.PUBLIC_URL}/palais/room_backgrounds_and_social_previews/${folder}/${device}/${name}.webp`;
}

/** the sky-and-water mask for a room photograph, by the photograph's address */
export const maskFor = (src: string) => src.replace(/\/(desktop|mobile)\/([^/]+)\.webp$/, "/sky-water-masks/$2.webp");
