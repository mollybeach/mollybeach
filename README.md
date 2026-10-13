# Molly Beach — Portfolio

**Live at [mollybeach.app](https://mollybeach.app)**

### *A digital fabric of my life.*

![The Palais: the home page of the portfolio](docs/readme-palais.jpg)

This portfolio has two sides. The sidebar is a conventional résumé — experience, projects, skills, education, awards and certifications. The home page is **the Palais**: an interactive, Versailles-style palace terrace, built entirely from hundreds of hand-made stickers of my animals, plants and furniture, and rendered across all four seasons. From there it opens onto **the Atlas**, an explorable world of rooms, each modeled on places I've travelled.

It's React, TypeScript and CSS, with no game engine and no canvas library. It all runs in the browser.

---

<details>
<summary><b>📖 More — how the Palais works, the rooms &amp; the tech stack</b></summary>
<br>

## ✨ The Palais

### A room that lives through the year
- **Four seasons on an 80-second year.** Spring, summer, autumn and winter photographs crossfade on a CSS animation timeline. **Skip** jumps ahead by driving the animations directly through the Web Animations API (`currentTime`, `playbackRate`), and **Pause** freezes the whole year, every room at once.
- **Weather that follows the photographs.** Snow in winter, falling leaves in autumn and cottonwood fluff in summer come from a canvas particle system. It reads how far each season's photo has faded in, so the weather thickens as a season arrives and thins as it leaves.
- **Visitors.** Hummingbirds and dragonflies fly through now and then on a small requestAnimationFrame flight engine.
- **Moving parts.** Honeysuckle's tricycle wheels spin, and her sewing machine's needle goes up and down while the fabric feeds through. Each sticker is cut into layers and animated separately.
- **Phone layout.** Phones get their own portrait photographs and layout rather than a squashed desktop.

### ~100 stickers you can rearrange
- **Drag anything anywhere.** Pick-up hit-testing checks the image's own transparency, so you grab the cat and not the empty corner of its picture. The item you're holding comes to the front, and a corner handle resizes it.
- **Positions that survive resizing.** Moves are stored as fractions of the stage (container query units, `cqw`/`cqh`), so an arrangement holds at any window size. The scene is mapped onto whichever background photo is showing: taller, wider or phone.
- **A dress-up-game catalogue.** Every sticker sits on a shelf (Furniture, House plants, Cats, Dogs, Goats, Artwork, Hanging lights, Teacups, Trinkets…). Heart them in or out of the room, one at a time or a whole shelf at once.
- **A layout for each season.** Each season has its own default arrangement: the autumn table only in autumn, the dogs in the pool in spring and summer. The room glides into the new layout when the season turns.

### Area M: the world map
A cute, video-game-style level select. Honeysuckle hops along a dotted path between stops on an island inside a shimmering rainbow wall. Each stop is a region blended from real trips, and many of them are rooms you can walk into:

| Room | |
|---|---|
| 🏛 The Palais | home, the terrace |
| 🍰 The Kitchen | the whole kitchen behind the terrace's marble bar |
| 🛁 The Bathroom | the blush bathroom through the terrace's right arch |
| 🌿 The Glasshouse | an iron-and-glass garden conservatory |
| 🏠 The Lakehouse | a glass lake house with a red bridge and a boathouse, in four seasons |
| 👗 The Wardrobe Wing | a pink closet with lemon wallpaper and a waterfall, in four seasons |
| ♨️ The Steaming Lagoon | a blue lagoon under the northern lights, in four seasons |
| 🌲 The Rainwood | a fern-covered conservatory in a rainforest |
| 🎵 The Amphitheatre | a festival stage on a canyon rim at sunset |
| 🕌 The City of Domes | a marble bath above domes, trams and gondolas |
| 💜 The Jacaranda Quarter | a balcony over a purple jacaranda street at dusk |
| 🐢 The Glass Reef | a seashell pavilion half under the sea |

Rooms keep their place in the address (`mollybeach.app/#lagoon`), so a refresh or a shared link opens the same room. All rooms turn through the seasons together.

### Saved Looks
Signed in, I can save the room as a named look, file it under a season, make it that season's default, and keep older looks to go back to. Everyone can read looks, but only editors can change them, and row-level security enforces that in the database, not in the UI.

---

## 📄 The résumé side

- **Experience:** an expandable timeline of roles, with project details
- **Projects:** project cards with live preview screenshots (Microlink)
- **Skills, Education, Awards, Certifications**
- **Résumé:** a printable résumé page
- **Link previews:** social media previews and meta tags (react-helmet-async)

## 🛠 Tech stack

- **React 18** + **TypeScript** (Create React App), **react-router**
- **Tailwind CSS** for the résumé pages; hand-written, scoped CSS for the Palais (container queries, CSS animations, custom properties)
- **Web Animations API**, **Canvas 2D**, **requestAnimationFrame**, **ResizeObserver**
- **Supabase** (Postgres, row-level security, auth, SQL functions), loaded lazily so the room never waits on it
- **Image pipeline:** background removal (rembg), OpenCV feature matching (SIFT and homography) to align the season photographs, WebP export
- **Hosting:** Vercel

</details>

<p align="center">
  <a href="https://mollybeach.app/?from=githubreadme" target="_blank" rel="noopener"><img width="360" height="96" alt="Visit mollybeach.app — portfolio &amp; the Palais" src="https://qducnvdzikeyitzjcpmp.supabase.co/functions/v1/github-visits?art=link"/></a>
  &nbsp;
  <a href="https://mollybeach.app/?from=githubreadme" target="_blank" rel="noopener"><img width="362" height="96" alt="Visitors" src="https://qducnvdzikeyitzjcpmp.supabase.co/functions/v1/github-visits?badge=profile&amp;label=visitors"/></a>
</p>

<p align="center">
  <a href="https://mollybeach.app/?from=githubreadme" target="_blank" rel="noopener">
    <img width="860" height="96" alt="mollybeach.app is the Palais: a dollhouse portfolio you can rearrange, room by room." src="https://qducnvdzikeyitzjcpmp.supabase.co/functions/v1/github-visits?art=note"/>
  </a>
</p>

<img align="left" height="310" src="./assets/gene.gif" alt="gene"/>

<p>
  <img height="115" src="./assets/butterfree.gif" alt="butterfree"/>
  <img height="115" src="./assets/chikorita.gif" alt="chikorita"/>
  <img height="115" src="./assets/eevee.gif" alt="eevee"/>
  <img height="115" src="./assets/fidgetToy.gif" alt="fidgetToy"/>
  <img height="150" src="./assets/flower.gif" alt="flower"/>
</p>
<p>
  <img height="115" src="./assets/flowerGarden.gif" alt="flowerGarden"/>
  <img height="150" src="./assets/grimLeaper.gif" alt="grimLeaper"/>
  <img height="115" src="./assets/growlithe.gif" alt="growlithe"/>
  <img height="115" src="./assets/heart.gif" alt="heart"/>
  <img height="115" src="./assets/horseSea.gif" alt="horseSea"/>
</p>

<br clear="all"/>

<img align="left" height="290" src="./assets/binaryTree.gif" alt="binaryTree"/>

<p>
  <img height="115" src="./assets/mandelbrot.gif" alt="mandelbrot"/>
  <img height="115" src="./assets/milkers.gif" alt="milkers"/>
  <img height="115" src="./assets/owl.gif" alt="owl"/>
  <img height="115" src="./assets/poke.gif" alt="poke"/>
  <img height="115" src="./assets/purugly.gif" alt="purugly"/>
</p>
<p>
  <img height="115" src="./assets/rattata.gif" alt="rattata"/>
  <img height="115" src="./assets/rgbToVec3Colors.gif" alt="rgbToVec3Colors"/>
  <img height="150" src="./assets/virus.gif" alt="virus"/>
  <img height="115" src="./assets/zap.gif" alt="zap"/>
</p>

<br clear="all"/>

<table><tr><td valign="top" width="50%">
        <h2 align="center"> 💼 Languages and Tools</h2>
<br />
<img src="https://img.shields.io/badge/-javascript-F7DF1E?&style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/-ReactJS-grey?&style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
<img src="https://img.shields.io/badge/-css3-1572B6?&style=for-the-badge&logo=css3&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/-VSCode-007ACC?&style=for-the-badge&logo=visual-studio-code&logoColor=white" />
<img src="https://img.shields.io/badge/-Git-F05032?&style=for-the-badge&logo=git&logoColor=white" /> 
<img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" />
<img src="https://img.shields.io/badge/Canva-%2300C4CC.svg?style=for-the-badge&logo=Canva&logoColor=white" />
<img src="https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white" />
<img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" />
<img src="https://img.shields.io/badge/-Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white" />
<img src="https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white" />

</td><td align="top" width="50%">



</tr></tr></table>

<br />

---

## 📞 Contact

- [LinkedIn](https://www.linkedin.com/in/mollybeach)
- [GitHub](https://github.com/mollybeach)
- [mollyjbeach@gmail.com](mailto:mollyjbeach@gmail.com)
