/**
 * Everything Brat Academy teaches, for the binder the chalkboard opens
 * (SchoolSyllabus.tsx): the path through it unit by unit, the courses it uses,
 * and the study guides in bratcode-brainbook to keep open alongside.
 *
 * The path follows the brainbook's own agenda (its README): JavaScript, React,
 * a database, the cloud, TypeScript, Solidity, then Python. Each unit points
 * at a study guide, a course from the syllabus, and something to build that's
 * yours to show off at the end of it.
 */

const BRAINBOOK = "https://github.com/mollybeach/bratcode-brainbook/blob/master";
const guide = (path: string) => `${BRAINBOOK}/${path}`;

export interface Course {
  emoji: string;
  title: string;
  platform: string;
  href: string;
  level: string;
  time: string;
  learn: string[];
  bonus?: { text: string; href: string };
}

export const COURSES: Course[] = [
  {
    emoji: "💻",
    title: "Learn JavaScript",
    platform: "Codecademy",
    href: "https://www.codecademy.com/learn/introduction-to-javascript",
    level: "Beginner",
    time: "20 hours",
    learn: ["JavaScript fundamentals and syntax", "Control flow, functions and scope", "Arrays, loops and objects", "DOM manipulation and events", "Complete interactive projects"],
    bonus: { text: "How Git Works: Explained in 4 Minutes, then start committing your studies", href: "https://www.youtube.com/watch?v=e9lnsKot_SQ" },
  },
  {
    emoji: "🌐",
    title: "Basic Website Development: HTML, CSS, JavaScript",
    platform: "YouTube",
    href: "https://www.youtube.com/watch?v=FazgJVnrVuI",
    level: "Beginner",
    time: "1 hour 26 minutes",
    learn: ["HTML5 structure and semantic elements", "CSS3 styling, layouts and responsive design", "JavaScript for interactivity", "Build complete websites from scratch", "Deploy projects to the web"],
  },
  {
    emoji: "⚛️",
    title: "Learn React",
    platform: "Codecademy",
    href: "https://www.codecademy.com/learn/react-101",
    level: "Intermediate",
    time: "20 hours",
    learn: ["React fundamentals and JSX", "Components, props and state", "Hooks and functional components", "React Router for navigation", "Build modern web applications"],
  },
  {
    emoji: "🔷",
    title: "Learn TypeScript",
    platform: "Codecademy",
    href: "https://www.codecademy.com/enrolled/courses/learn-typescript",
    level: "Intermediate",
    time: "20 hours",
    learn: ["TypeScript syntax, types and tsconfig.json", "Functions, union types, narrowing and advanced object types", "7 projects, including Restaurant Recommender and TypeMart", "A Certificate of Completion"],
  },
  {
    emoji: "🧱",
    title: "Ethereum Blockchain Developer Bootcamp With Solidity",
    platform: "Udemy",
    href: "https://www.udemy.com/course/blockchain-developer/learn/lecture/33861892",
    level: "Beginner to Intermediate",
    time: "about 20 hours",
    learn: ["Ethereum development in Solidity", "Smart contracts with Remix, Truffle, MetaMask and Web3.js", "Blockchain fundamentals and dApps", "Labs and real contract deployments"],
  },
  {
    emoji: "🧠",
    title: "Data Scientist: Natural Language Processing Specialist",
    platform: "Codecademy",
    href: "https://www.codecademy.com/learn/paths/data-science-nlp",
    level: "Beginner",
    time: "100 hours",
    learn: ["Python 3, SQL, pandas, scikit-learn, SpaCy, NLTK, TensorFlow, Matplotlib", "Build chatbots and pull meaning out of text", "59 hands-on projects", "A Certificate of Completion"],
  },
  {
    emoji: "🤖",
    title: "Data Scientist: Machine Learning Specialist",
    platform: "Codecademy",
    href: "https://www.codecademy.com/learn/paths/data-science",
    level: "Beginner",
    time: "95 hours",
    learn: ["Python 3, SQL, pandas, scikit-learn, TensorFlow, Matplotlib", "Predictions, patterns and neural networks", "59 portfolio-worthy projects", "A Professional Certification"],
  },
  {
    emoji: "🐍",
    title: "Learn Data Structures and Algorithms with Python",
    platform: "Codecademy",
    href: "https://www.codecademy.com/learn/learn-data-structures-and-algorithms-with-python",
    level: "Intermediate",
    time: "26 hours",
    learn: ["Lists, stacks, queues, trees and graphs", "Sorting, searching and recursion", "Real-world Python", "6 projects and quizzes"],
  },
  {
    emoji: "☁️",
    title: "Intro to Cloud Computing",
    platform: "Codecademy",
    href: "https://www.codecademy.com/learn/foundations-of-cloud-computing",
    level: "Beginner",
    time: "under an hour",
    learn: ["Cloud computing fundamentals", "SaaS, IaaS and PaaS", "AWS, Azure and GCP compared", "A Certificate of Completion"],
  },
  {
    emoji: "🌩️",
    title: "AWS Certified Cloud Practitioner (CLF-C02)",
    platform: "AWS",
    href: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
    level: "Beginner",
    time: "about 9 hours",
    learn: ["AWS Cloud fundamentals, security and migration", "Architecture, pricing and support", "Ready for the official CLF-C02 exam"],
  },
];

export interface Unit {
  id: string;
  emoji: string;
  title: string;
  /** one line on why it comes now */
  why: string;
  guides: { name: string; href: string }[];
  /** indexes into COURSES */
  courses: number[];
  extra?: { name: string; href: string };
  project: { name: string; brief: string };
  /** ticked off as you go; remembered in this browser */
  checklist: string[];
}

export const UNITS: Unit[] = [
  {
    id: "git",
    emoji: "🌱",
    title: "Your terminal & Git",
    why: "Every unit after this one ends in a commit, so this comes first: a set-up computer, a GitHub, and the habit of saving your work.",
    guides: [
      { name: "Git", href: guide("git/GIT.md") },
      { name: "NPM", href: guide("package-managers/NPM.md") },
    ],
    courses: [],
    extra: { name: "How Git Works, in 4 minutes", href: "https://www.youtube.com/watch?v=e9lnsKot_SQ" },
    project: { name: "Your brat-academy repo", brief: "Make a repo called brat-academy with a README about you: your name, what you want to build, and your Bratz. Every project from here lives in it." },
    checklist: ["Set up my computer (the Setup tab)", "Made a GitHub and added my SSH key", "Pushed my first commit", "Can explain add, commit, push and pull"],
  },
  {
    id: "web",
    emoji: "🎀",
    title: "HTML & CSS",
    why: "The bones and the outfit of every page on the internet. You'll see something on screen within the hour.",
    guides: [
      { name: "HTML", href: guide("languages/HTML.md") },
      { name: "CSS", href: guide("languages/CSS.md") },
      { name: "Basic web setup", href: guide("web/BASICWEBSETUP.md") },
      { name: "Tailwind", href: guide("languages/TAILWIND.md") },
    ],
    courses: [1],
    project: { name: "A MySpace-era profile page", brief: "Your about-me page, 2006 style: a top 8, a glitter header, your song of the moment and a guestbook form. Flexbox for the top 8, a grid for the photos." },
    checklist: ["Wrote a page with semantic HTML", "Styled it with flexbox and grid", "It looks good on my phone too", "Committed it to brat-academy"],
  },
  {
    id: "js",
    emoji: "💅",
    title: "JavaScript",
    why: "Where the page starts doing things: clicks, choices, answers.",
    guides: [{ name: "JavaScript", href: guide("languages/JAVASCRIPT.md") }],
    courses: [0],
    project: { name: "Which Bratz are you?", brief: "A personality quiz: ten questions, a score kept in an object, a result card that reveals your Bratz, and a button to copy the result to share." },
    checklist: ["Variables, functions, arrays and objects", "Handled clicks with events", "Fetched something with async/await", "Shipped the quiz"],
  },
  {
    id: "react",
    emoji: "⚛️",
    title: "React",
    why: "How real apps are built: small components, put together.",
    guides: [
      { name: "React", href: guide("frameworks/REACT.md") },
      { name: "Next.js", href: guide("frameworks/NEXTJS.md") },
    ],
    courses: [2],
    project: { name: "The lip gloss shop", brief: "A little shop: a product grid, a product page, a cart that remembers what's in it, and a checkout page. Props down, state up, a route for each page." },
    checklist: ["Built components with props", "Kept state with useState", "Added routes for each page", "The cart works"],
  },
  {
    id: "data",
    emoji: "🗄️",
    title: "Databases & SQL",
    why: "So the shop remembers things after you close the tab.",
    guides: [
      { name: "SQL", href: guide("languages/SQL.md") },
      { name: "PostgreSQL", href: guide("databases/POSTGRESQL.md") },
      { name: "Prisma", href: guide("databases/PRISMA.md") },
      { name: "Starter schema", href: guide("databases/database.sql") },
    ],
    courses: [],
    extra: { name: "W3Schools SQL tutorial", href: "https://www.w3schools.com/sql/" },
    project: { name: "Give the shop a database", brief: "Products and orders in PostgreSQL: create the tables, seed your glosses, and have the shop read from the database instead of a list in the code." },
    checklist: ["Created tables with keys", "SELECT, INSERT, UPDATE and DELETE", "Joined two tables", "The shop reads from the database"],
  },
  {
    id: "cloud",
    emoji: "☁️",
    title: "Ship it to the cloud",
    why: "A link you can send to anyone. This is the moment it becomes real.",
    guides: [
      { name: "Vercel", href: guide("infrastructure/VERCEL.md") },
      { name: "AWS", href: guide("infrastructure/AWS.md") },
      { name: "Firebase", href: guide("infrastructure/FIREBASE.md") },
      { name: "Cloudflare DNS", href: guide("infrastructure/CloudflareDNS.md") },
    ],
    courses: [8, 9],
    project: { name: "Your shop, live", brief: "Deploy the shop to Vercel, move the database to AWS RDS, and point your own domain at it. Then text the link to the group chat." },
    checklist: ["Deployed to Vercel", "Database on AWS RDS", "Secrets in environment variables, not the code", "On my own domain"],
  },
  {
    id: "ts",
    emoji: "🔷",
    title: "TypeScript",
    why: "JavaScript that catches your mistakes before anyone else sees them.",
    guides: [{ name: "TypeScript", href: guide("languages/TYPESCRIPT.md") }],
    courses: [3],
    project: { name: "The shop, typed", brief: "Convert the shop to TypeScript: a type for a product, an order and the cart, and no any anywhere. Count how many bugs it finds." },
    checklist: ["Typed props and state", "Wrote my own interfaces", "Used unions and narrowing", "Zero any"],
  },
  {
    id: "web3",
    emoji: "💎",
    title: "Solidity & Web3",
    why: "Code that lives on a blockchain, and money that moves without a bank.",
    guides: [
      { name: "Solidity", href: guide("languages/SOLIDITY.md") },
      { name: "Tokens & NFTs", href: guide("blockchain/TOKENS_NFTS.md") },
      { name: "Hardhat", href: guide("frameworks/HARDHAT.md") },
      { name: "wagmi + viem", href: guide("blockchain/WAGMI_VIEM.md") },
    ],
    courses: [4],
    project: { name: "Your NFT drop", brief: "A collection of your own art as NFTs: a contract with a mint price, a React page that connects MetaMask, and a buy button. Deploy it to a testnet and host the site on Firebase." },
    checklist: ["Wrote and tested a contract", "Deployed to a testnet", "Connected a wallet", "Someone else minted one"],
  },
  {
    id: "python",
    emoji: "🐍",
    title: "Python & AI",
    why: "The language of data and AI, and the one interviewers love.",
    guides: [
      { name: "Python", href: guide("languages/PYTHON.md") },
      { name: "Jupyter notebooks", href: guide("infrastructure/JUPYTERNOTEBOOK.md") },
      { name: "FastAPI", href: guide("frameworks/FASTAPI.md") },
      { name: "Django", href: guide("frameworks/DJANGO.md") },
      { name: "Docker", href: guide("infrastructure/Docker.md") },
    ],
    courses: [5, 6, 7],
    project: { name: "A chatbot with your voice", brief: "Collect your own captions and texts, and build a chatbot that answers like you do, in a Jupyter notebook first, then behind a small Django or FastAPI app." },
    checklist: ["Lists, dicts and comprehensions", "A notebook with pandas", "Trained or prompted a model", "The bot answers like me"],
  },
  {
    id: "capstone",
    emoji: "👑",
    title: "Capstone: demo day",
    why: "Put it all together and show it off.",
    guides: [
      { name: "Makefile", href: guide("configuration/Makefile") },
      { name: "NGINX", href: guide("infrastructure/NGINX.md") },
    ],
    courses: [],
    project: { name: "Your portfolio", brief: "A portfolio site with every project from the path on it, a real domain, and a five-minute demo you present to me (and anyone you invite) like it's a launch." },
    checklist: ["Portfolio site live", "Every project linked, with a screenshot", "Gave my demo", "Applied somewhere / pitched something"],
  },
];

/** what you are, by how much of the path is ticked off */
export const RANKS: { at: number; name: string; note: string }[] = [
  { at: 0, name: "New Girl", note: "Everyone starts somewhere. Pick up the first unit." },
  { at: 0.15, name: "Brat in Training", note: "You've got your terminal. Dangerous." },
  { at: 0.35, name: "Honor Roll", note: "You can build things people click on." },
  { at: 0.6, name: "Head Girl", note: "Databases, the cloud, types. You're a developer." },
  { at: 0.85, name: "Valedictorian", note: "Nearly there. Start planning demo day." },
  { at: 1, name: "Brat Academy Graduate", note: "You did the whole thing. Go get that tech bag." },
];

/** school materials from elsewhere on the web, each with its site's own icon:
    in the binder's Cheat Sheets, and the School folder on the iMac */
export const MATERIALS: { name: string; href: string; icon: string }[] = [
  { name: "JavaScript cheat sheet", href: "https://htmlcheatsheet.com/js/", icon: `${process.env.PUBLIC_URL}/palais/modal_content/imac_desktop/htmlcheatsheet-js.png` },
];

/** the brainbook's study guides, by shelf */
export const SHEETS: { shelf: string; emoji: string; items: { name: string; href: string }[] }[] = [
  {
    shelf: "Languages",
    emoji: "💻",
    items: ["HTML", "CSS", "JavaScript", "TypeScript", "Tailwind", "Python", "SQL", "Solidity", "Rust", "Go", "Java", "C++", "EdgeQL"].map((name) => ({
      name,
      href: guide(
        `languages/${({ JavaScript: "JAVASCRIPT", TypeScript: "TYPESCRIPT", Tailwind: "TAILWIND", Go: "GOLANG", "C++": "C++", EdgeQL: "EDGEQL" } as Record<string, string>)[name] ?? name.toUpperCase()}.md`,
      ),
    })),
  },
  {
    shelf: "Frameworks",
    emoji: "🧩",
    items: [
      { name: "React", href: guide("frameworks/REACT.md") },
      { name: "Next.js", href: guide("frameworks/NEXTJS.md") },
      { name: "React Native", href: guide("frameworks/REACTNATIVE.md") },
      { name: "Vue", href: guide("frameworks/VUE.md") },
      { name: "Svelte", href: guide("frameworks/SVELTE.md") },
      { name: "Express", href: guide("frameworks/EXPRESS.md") },
      { name: "Django", href: guide("frameworks/DJANGO.md") },
      { name: "FastAPI", href: guide("frameworks/FASTAPI.md") },
      { name: "Hardhat", href: guide("frameworks/HARDHAT.md") },
    ],
  },
  {
    shelf: "Databases",
    emoji: "🗄️",
    items: [
      { name: "PostgreSQL", href: guide("databases/POSTGRESQL.md") },
      { name: "Supabase", href: guide("databases/SUPABASE.md") },
      { name: "Prisma", href: guide("databases/PRISMA.md") },
      { name: "MongoDB", href: guide("databases/MONGODB.md") },
      { name: "Redis", href: guide("databases/REDIS.md") },
      { name: "SQLite", href: guide("databases/SQLITE.md") },
      { name: "GraphQL", href: guide("databases/GRAPHQL.md") },
      { name: "Starter schema (SQL)", href: guide("databases/database.sql") },
    ],
  },
  {
    shelf: "Infrastructure",
    emoji: "🏗️",
    items: [
      { name: "Vercel", href: guide("infrastructure/VERCEL.md") },
      { name: "AWS", href: guide("infrastructure/AWS.md") },
      { name: "Firebase", href: guide("infrastructure/FIREBASE.md") },
      { name: "Docker", href: guide("infrastructure/Docker.md") },
      { name: "NGINX", href: guide("infrastructure/NGINX.md") },
      { name: "Cloudflare DNS", href: guide("infrastructure/CloudflareDNS.md") },
      { name: "Jupyter", href: guide("infrastructure/JUPYTERNOTEBOOK.md") },
      { name: "Docker + Jupyter on a GPU", href: guide("infrastructure/DockerJupyterLambdaSetup.md") },
      { name: "tmux", href: guide("infrastructure/TMUX.md") },
    ],
  },
  {
    shelf: "Tools",
    emoji: "🛠️",
    items: [
      { name: "Git", href: guide("git/GIT.md") },
      { name: ".gitignore", href: guide("git/.gitignore") },
      { name: "NPM", href: guide("package-managers/NPM.md") },
      { name: "Makefile", href: guide("configuration/Makefile") },
    ],
  },
  {
    shelf: "Blockchain",
    emoji: "⛓️",
    items: [
      { name: "Tokens & NFTs", href: guide("blockchain/TOKENS_NFTS.md") },
      { name: "ethers.js", href: guide("blockchain/ETHERS.md") },
      { name: "web3.js", href: guide("blockchain/WEB3JS.md") },
      { name: "wagmi + viem", href: guide("blockchain/WAGMI_VIEM.md") },
      { name: "Foundry", href: guide("blockchain/FOUNDRY.md") },
      { name: "Solana + Anchor", href: guide("blockchain/SOLANA_ANCHOR.md") },
      { name: "Smart contracts in Rust", href: guide("blockchain/RUST_SMARTCONTRACTS.md") },
    ],
  },
];
