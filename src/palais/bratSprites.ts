/**
 * The brat-code loading screen's little pixel sprites (public/index.html),
 * for Brat Academy's binder: the cut coconut, the green coconut drink, the
 * green heart and the star. Each is drawn from a small bitmap as an SVG of
 * squares, so it stays blocky at any size.
 */

function sprite(bits: string[], cells: Record<string, string>): string {
  const u = 3;
  const w = Math.max(...bits.map((row) => row.length));
  let s = `<svg viewBox="0 0 ${w * u} ${bits.length * u}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">`;
  bits.forEach((row, y) => {
    Array.from(row).forEach((c, x) => {
      if (cells[c]) s += `<rect x="${x * u}" y="${y * u}" width="${u}" height="${u}" fill="${cells[c]}"/>`;
    });
  });
  return `${s}</svg>`;
}

const HEART = [" PP  PP ", "PHHPPPPP", "PHHPPPPP", "PPPPPPPP", " PPPPPP ", "  PPPP  ", "   PP   "];

export const SPRITES = {
  coconut: sprite(
    [
      "......BBBBBBBB...",
      ".....BBWWWWWWBB..",
      "....BWWccccWWWBB.",
      "...BWWWccccccWBB.",
      "..BWcccccccccWBBB",
      ".BWWWccccccccWBBB",
      "BBWccccccccccWBBB",
      "BWcWccccccccWBBBB",
      "BWccccccccccWBBBB",
      "BWcWcccccccWBBBBB",
      "BBWccccccWWBBBBBB",
      "BBBWWWWWWBBBBBBB.",
      ".BBBBBBBBBBBBBBB.",
      "..BBBBBBBBBBBBd..",
      "...ccBBBBBBBBc...",
      ".....BBBBBBBB....",
    ],
    { B: "#4e2b12", d: "#331c0a", W: "#f8f1e7", c: "#d9c5ac" },
  ),
  drink: sprite(
    [
      "........OOO..",
      ".W.....OOOOO.",
      ".W....OOOOOOO",
      "..W....OsO...",
      "..W.....s....",
      "...WW...s....",
      "..gGGGWWGGGg.",
      ".gGGGGWWGGGGg",
      "gGGGGGGGGGGGg",
      "gGGGGGGGGGGGg",
      "gGGGGGGGGGGGg",
      "gGGGGGGGGGGGg",
      ".gGGGGGGGGGg.",
      "..gGGGGGGGg..",
      "...gGGGGGg...",
      ".....ggg.....",
    ],
    { G: "#357a24", g: "#214e14", W: "#ffffff", O: "#ff7a2e", s: "#e7e7e7" },
  ),
  heart: sprite(HEART, { P: "#1fff3f", H: "#bcff93" }),
  pinkHeart: sprite(HEART, { P: "#ff57b6", H: "#ffc2e4" }),
  /* Professor Beach Babe herself: a pixel doll in a pink blazer and a neon
     skirt, hand on her hip, holding up an apple for the teacher */
  professor: sprite(
    [
    "...........KKKKKKKKK.............",
    ".........KKHHHHHHHHHKK...........",
    "........KHHhhhHHHHHHHHK..........",
    ".......KHHhhHHHHHHHHHHHK.........",
    "......KHHhHHHHHHHHHHHHHHK........",
    ".....KHHHHHHHHHHHHHHHHHHHK.......",
    ".....KHHHHHKKKKKKKKKHHHHHK.......",
    "....KHHHHKKSSSSSSSSSKKHHHHK......",
    "....KHHHKSSSSSSSSSSSSSKHHHK......",
    "....KHHKSSSSSSSSSSSSSSSKHHK......",
    "....KHHKSSKKKSSSSSKKKSSKHHK......",
    "....KHHSSKPPPKSSSKPPPKSSHHK......",
    "....KHHSSPWEEKSSSKEEWPSSHHK......",
    "....KHHSSSWEESSSSSEEWSSSHHK......",
    "....KHHSSSSKKSSSSSKKSSSSHHK......",
    "....KHHsSSSSSSSsSSSSSSSsHHK......",
    "....KHHHSSSSSSSsSSSSSSSHHHK......",
    "....KHHHSSSSSSKLLKSSSSSHHHK......",
    "....KHHHSSSSSLLLLLSSSSSHHHK......",
    "....KHHHHSSSSSLLLSSSSSHHHHK......",
    "....KHHHHKSSSSSSSSSSSKHHHHK......",
    "....KHHHHHKKSSSSSSSKKHHHHHK......",
    "....KHHHHHHHKKSSSKKHHHHHHHK......",
    "....KHHHHHHHHKSSSKHHHHHHHHK......",
    "....KHHHHHHKJJSSSJJKHHHHHHK......",
    "....KHHHHHKJJJTTTJJJKHHHHHK......",
    "....KHHHHKJJJJTTTJJJJKHHHHK..KK..",
    "....KHHHKJJjJJTTTJJjJJKHHK..KAAK.",
    "....KHHKJJjJJJTXTJJJjJJKK..KAaAAK",
    ".....KKJJjKJJJTTTJJJKjJJK..KAAAAK",
    "......KJJjKJJJTTTJJJKjJJK...KAAK.",
    ".....KJJjK.KJJTTTJJK.KjJJKKSSK...",
    ".....KJJK..KJJTTTJJK..KJJJSSK....",
    "....KJJK...KJJjjjJJK...KJJJK.....",
    "....KSSKK..KJJJJJJJK....KKK......",
    ".....KSSSK.KJJJJJJJK.............",
    "......KSSKKDDDDDDDDDK............",
    ".......KKKDDDdDDDdDDDK...........",
    ".........KDDDDDDDDDDDDK..........",
    ".........KDDdDDDDdDDDDK..........",
    ".........KKKKKKKKKKKKKK..........",
    "............KSSK.KSSK............",
    "............KSSK.KSSK............",
    "............KSSK.KSSK............",
    "............KSSK.KSSK............",
    "............KSSK.KSSK............",
    "............KSSK.KSSK............",
    "............KsSK.KsSK............",
    "...........KBBBBKKBBBBK..........",
    "...........KBBBBKKBBBBK..........",
    "...........KBBbBKKBbBBK..........",
    "...........KBBBBKKBBBBK..........",
    "...........KBBBBKKBBBBK..........",
    "...........KBBBBKKBBBBK..........",
    "..........KBBBBBKKBBBBBK.........",
    "..........KBBBBBKKBBBBBK.........",
    "..........KbbbbbKKbbbbbK.........",
    "..........KKKKKKKKKKKKKK.........",
    ],
    {
      K: "#2a1a1f", H: "#4a2a1a", h: "#7a4a2c", S: "#f6cfb3", s: "#e3ad8c", E: "#3b1f5c", W: "#ffffff", L: "#e0397f",
      P: "#ff8fc8", J: "#ff57b6", j: "#c2187a", T: "#ffffff", X: "#ff57b6", D: "#5dff2a", d: "#2fbf1c", B: "#9b6bd6",
      b: "#6b3fa8", A: "#e8283c", a: "#ff9a9a",
    },
  ),
  /* an apple for the teacher, on her desk */
  apple: sprite(
    [
    "......KK.GG..",
    ".....KNKGGGG.",
    "......KNKGG..",
    "..KKKKKNKKK..",
    ".KAAAAKAAAAK.",
    "KAaaAAAAAAAAK",
    "KAaAAAAAAAAAK",
    "KAaAAAAAAAAAK",
    "KAAAAAAAAAAAK",
    "KAAAAAAAAAArK",
    ".KAAAAAAAArK.",
    ".KAAAAAAArrK.",
    "..KAAKKKArK..",
    "...KK...KK...",
    ],
    { K: "#3a0d12", A: "#e8283c", a: "#ff9a9a", r: "#a3121f", N: "#6b3a1a", G: "#3fb52a" },
  ),
  star: sprite(["   G   ", "   W   ", "  WWW  ", "GWWWWWG", "  WWW  ", "   W   ", "   G   "], { W: "#fff3a6", G: "#ffcf1a" }),
};

export type SpriteName = keyof typeof SPRITES;
