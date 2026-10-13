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

<img         align=""       width="15%"    height="100%" src="./assets/purugly.gif"/>
        <img align="left"   width="10%"    height="75px" src="./assets/cowpic.png"/>
        <img align="left"   width="35%"    height="75px" src= "./assets/contribution.svg"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/grimLeaper.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/rattata.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/poke.gif"/>
       <img align="left"    width="15%"    height="100%" src="./assets/owl.gif"/> 
        <img align="left"   width="10%"    height="100%" src="./assets/milkers.gif"/> 
        <img align="right"  width="12.5%"  height="75px" src="./assets/purugly.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/fidgetToy.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/heart.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/mandelbrot.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/butterfree.gif"/>
       <img align="right"  width="12.5%"  height="75px" src="./assets/flowerGarden.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/growlithe.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/owl.gif"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/zap.gif"/>
        <img align="left"   width="12.5%"  height="75px" src="./assets/bordercollie.png"/>
        <img align="left"   width="12.5%"  height="75px" src="./assets/goat.png"/>
        <img align="left"   width="12.5%"  height="75px" src="./assets/trees.png"/>
        <img align="left"   width="12.5%"  height="75px" src="./assets/moon.png"/>
        <img align="right"  width="12.5%"  height="75px" src="./assets/horseSea.gif"/>
        <img align="right"  width="8.5%"   height="75px" src="./assets/gene.gif"/>
        <img align="right"  width="16.5%"  height="75px" src="./assets/milkers.gif"/>
        <img align="left"   width="5%"     height="75px"    src="./assets/spacer.png"/>
        <img align="left"   width="20px"   height="20px"
            src="https://raw.githubusercontent.com/github/explore/5c058a388828bb5fde0bcafd4bc867b5bb3f26f3/topics/graphql/graphql.png"></img> 
        <img align="left"   width="20px"   height="20px"
             src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/nodejs/nodejs.png"></img>   
        <img align="left"   width="20px"   height="20px"
             src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/cpp/cpp.png"></img> 
        <img align="left"   width="20px"   height="20px"
             src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/python/python.png"> </img> 
        <img align="left"   width="20px"   height="20px"
             src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mysql/mysql.png"></img>     
        <img align="left"   width="20px"   height="20px"                                                                        
           src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/firebase/firebase.png"></img>
        <img align="left"   width="20px"   height="20px"
           src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/terminal/terminal.png"></img>

<br clear="all" />


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
