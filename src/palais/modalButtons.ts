/**
 * The things in the rooms you press to open something: the pool table, the
 * spellbook, the cookbook, the road case, the iMac, the sticker maker, the
 * jewelry cabinet, the dress form, Professor Beach Babe and the Boudoir bunny.
 *
 * Their pictures are kept together in public/palais/modal_content/modal_buttons.
 * Those that are stickers too have their own copy in the catalogue
 * (catalogue_stickers), so either can change without the other.
 */
export const modalButton = (name: string) => `${process.env.PUBLIC_URL}/palais/modal_content/modal_buttons/${name}.webp`;
