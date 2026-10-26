# Dolly Maker frame: prompt for ChatGPT

Measured from the Dolly Maker as committed (16c5e5f), at a 1440 × 900 window.
The modal panel is **1240 × 820 px**. Every position below is `x, y` from the
panel's top-left corner, then `width × height`, in px. Negative `y` means
above the panel's top edge.

---

Make a decorative frame for the "Dolly Maker" modal of my whimsical fashion
website, in the same style as the Dolly Maker title art I attached:
glossy pastel pink and mint, ornate gold filigree, glowing hearts, soft pink
clouds, little flowers (pink, white, blue), a pair of glass towers with blue
domes and golden lanterns. Painterly, glossy, cute, luxurious.

**The image**
- **Exactly 1240 × 900 px** (the panel is 1240 × 820, plus 80 px of room above
  it for the crown).
- **A genuinely transparent background (alpha 0)**, with no checkerboard drawn
  in, no white or grey background, no white sticker outline and no shadow
  baked in outside the frame.
- **The whole middle must be fully transparent:** the website draws its own
  cream panel and all its boxes inside. The frame is only the border round the
  edge, with decoration on top and at the corners.

**Where things go** (in the 1240 × 900 image; the panel's top edge is at y = 80)
- **Crown, centre top: x 390–850, y 0–270.** A gold cartouche the title sits on,
  centred at about x 620, y 150. Keep it a soft mint-blue plaque inside gold
  filigree, with a big pink heart on top, **with no lettering of any kind**
  (the website puts the Dolly Maker title on it).
- **Towers:** two glass towers with blue domes and lanterns, in the top-left and
  top-right corners, roughly x 60–300 and x 940–1180, y 0–240, with clouds and
  flowers at their feet.
- **Gold rail round the panel's edge:** along y 80 at the top (broken by the
  crown and towers), down x 0–30 on the left and x 1210–1240 on the right, and
  along y 860–890 at the bottom. **Keep it no thicker than 30 px**, so it doesn't
  cover the content.
- **Bottom corners:** clouds, flowers and a glowing heart medallion, within
  x 0–170 and x 1070–1240, y 760–900. **Leave the bottom band clear: x 170–1070,
  y 790–860 must stay transparent** (the website's buttons sit there).
- Small hearts on the rails at the middle of the bottom (about x 620, y 880) and
  halfway down each side (about y 480), each no wider than 40 px.

**Must stay completely clear** (every box and button in the modal, in the image's
coordinates, so add 80 to each panel y)
- the subtitle pill: x 365–875, y 209–234
- the tab ribbon: x 328–911, y 247–301, and its three buttons:
  x 334–529, x 537–703 and x 710–906, each y 253–296
- the close button: x 1204–1249, y 71–116 (over the top-right corner, sitting
  on the rail)
- the content area: x 5–1235, y 327–778
- the footer band: x 5–1235, y 794–854, with its buttons:
  - Back: x 27–140, y 807–850
  - Generate: x 871–1059, y 807–850
  - Next: x 1069–1213, y 807–850
  - and on the last tab, a wider "Put on the Characters shelf" button,
    x 947–1213, y 807–850

**Inside the content area, for reference** (these show through the clear
middle, so nothing may cross them)
- **Tab 1, Design your doll**
  - a sign-in note, x 52–1187, y 332–403 (only while signed out)
  - the big "You or a friend" photo box, x 52–265, y 417–763
  - five smaller photo boxes, each 164 × 88:
    - x 275–439 and x 448–612 at y 417
    - x 275–439 and x 448–612 at y 546
    - x 275–439 at y 676
  - a role picker under each box, 28 px tall
  - a hint card, x 448–612, y 685–785
  - three fields, each x 629–1188:
    - a 51 px name field at y 434
    - a 197 px description at y 516
    - a 51 px "keep exactly" field at y 745
- **Tab 2, Style & edit**
  - the doll's stage, x 52–527, y 332–770
  - the plan card, x 545–1188, y 332–551
  - "What should change?", x 545–889, y 581–677
  - the edit photo tray, x 901–1188, y 564–677
  - eight lock chips, each 156 × 28, in two rows at y 709 and y 742, starting at
    x 545, 707, 869 and 1031
- **Tab 3, Put on the shelf**
  - the stage, x 52–527, y 332–770
  - the shelf card, x 545–1188, y 332–770, with two 51 px fields at y 461 and
    y 581

Make one image, not a sheet of parts. No text anywhere in it.
