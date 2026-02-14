// path: src/components/Experience.tsx
import React from 'react';

interface Project {
  title: string;
  description: string[];
  technologies: string[];
}

interface ExperienceItem {
  company: string;
  logo: string;
  roles: {
    title: string;
    date: string;
    location: string;
    details: string[];
    projects: Project[];
    skills: string[];
  }[];
}

const experiences: ExperienceItem[] = [
  {
    company: "BLOCKMEDIA",
    logo: `${process.env.PUBLIC_URL}/images/blockmedia.png`,
    roles: [
      {
        title: "PRINCIPAL FULL-STACK SOFTWARE ENGINEER | GO, RUST, PYTHON",
        date: "MAY 2025 - PRESENT",
        location: "REMOTE",
        details: [
          "Developed protocol-level architecture for a custom Layer 1 blockchain integrating federated AI model coordination into consensus",
          "Designed transaction flows for secure model submission, validation, and on-chain reward attribution custom data types cryptographic verification",
          "Designed and optimized backend APIs with Express.js, Firebase Firestore, and GraphQL for scalable and secure data handling",
          "Contributed to cross-language infrastructure in Go and Rust, enhancing modular consensus logic and decentralized computation pathways",
          "Built cross-language infrastructure in Go and Rust for modular consensus and distributed execution",
          "Collaborated with engineers across AI, cryptography, and distributed systems to ensure protocol integrity and validator incentives"
        ],
        projects: [],
        skills: ["Go", "Rust", "PyTorch", "Solidity", "Docker", "Hardhat", "Federated Learning", "Cryptography", "EVM Forks", "Protocol Design", "AI"]
      }
    ]
  },
  {
    company: "BRKT",
    logo: `${process.env.PUBLIC_URL}/images/brkt.png`,
    roles: [
      {
        title: "SENIOR FULL-STACK SOFTWARE ENGINEER",
        date: "JAN 2025 - APRIL 2025",
        location: "REMOTE",
        details: [],
        projects: [
          {
            title: "Blockchain Prediction Platform | Solidity, React",
            description: [
              "Developed a blockchain-powered competitive gaming and prediction market platform with smart contract-based betting and prize distribution",
              "Built a responsive Web3 UI using Next.js, React, TypeScript, and integrated wallet connectivity with MetaMask and EVM-compatible wallets",
              "Designed and optimized backend APIs with Express.js, Firebase Firestore, and GraphQL for scalable and secure data handling",
              "Architected Solidity trustless betting mechanisms, ensuring fairness and automation of payouts",
              "Integrated Ethers.js Aptos SDK for seamless smart contract interactions, enabling secure betting prize distribution"
            ],
            technologies: ["Next.js", "React", "TypeScript", "Solidity", "Ethereum", "Aptos", "Ethers.js", "Express.js", "Firebase Firestore", "GraphQL", "Web3 Integration"]
          },
          {
            title: "Swipe-Based Prediction Market Engine | React Native, Rust",
            description: [
              "Built swipe-driven betting interface with real-time outcome updates",
              "Implemented event streams powering live odds and bet activity",
              "Designed low-latency APIs for wager placement and settlement flows",
              "Built reward engine handling rankings, payouts, and streak logic",
              "Optimized mobile performance for high-frequency UI updates"
            ],
            technologies: ["React Native", "Rust", "WebSockets", "Redis", "PostgreSQL", "Zustand", "Reanimated", "TypeScript", "Expo", "Node.js", "GraphQL", "gRPC", "Docker", "Nginx", "Firebase", "OAuth", "JWT", "CI/CD", "Kubernetes"]
          }
        ],
        skills: ["Next.js", "React", "React Native", "TypeScript", "Solidity", "Ethereum", "Aptos", "Rust", "Ethers.js", "Express.js", "Firebase Firestore", "GraphQL", "Web3 Integration", "WebSockets", "Redis", "PostgreSQL"]
      }
    ]
  },
  {
    company: "PARADES",
    logo: `${process.env.PUBLIC_URL}/images/paradessquare.png`,
    roles: [
      {
        title: "SENIOR FULL-STACK SOFTWARE ENGINEER",
        date: "JAN 2024 - DEC 2024",
        location: "REMOTE",
        details: [],
        projects: [
          {
            title: "Financial Services Mobile Platform | iOS",
            description: [
              "Developed and enhanced a financial services app, enabling users to access cash, build credit, and manage debt",
              "Created key iOS features using Swift, focusing on intuitive UI/UX, scalability, and performance",
              "Collaborated with teams to ensure seamless integration and consistent design across app features"
            ],
            technologies: ["Swift", "iOS Development", "UI/UX Design", "REST APIs", "Performance Optimization", "Agile Development", "Cross-functional Collaboration"]
          },
          {
            title: "Distributed Data Platform | Scala",
            description: [
              "Developed and maintained scalable backend services using Scala, leveraging functional programming for optimized data processing",
              "Built RESTful APIs, integrated third-party services, and utilized Akka for distributed programming",
              "Collaborated on cloud-based deployments using AWS and GCP",
              "Performed code reviews and managed PostgreSQL and MongoDB data"
            ],
            technologies: ["Scala", "Functional Programming", "RESTful APIs", "Akka", "AWS", "GCP", "PostgreSQL", "MongoDB", "Microservices", "Agile Development"]
          }
        ],
        skills: ["Swift", "Scala", "iOS Development", "RESTful APIs", "Akka", "AWS", "GCP", "PostgreSQL", "MongoDB", "Functional Programming", "Microservices"]
      }
    ]
  },
  {
    company: "ACCENTURE",
    logo: `${process.env.PUBLIC_URL}/images/accenture.png`,
    roles: [
      {
        title: "SOFTWARE ENGINEER FULL-STACK | METAVERSE, BLOCKCHAIN",
        date: "OCT 2022 - DEC 2023",
        location: "REMOTE",
        details: [],
        projects: [
          {
            title: "GenAI 3D Chat Application | TypeScript",
            description: [
              "Built AI apps combining chat systems with real-time graphics",
              "Implemented WebGL rendering pipelines, scene management, and shader effects using Three.js",
              "Designed modular frontend architecture supporting dynamic visual interaction"
            ],
            technologies: ["Microsoft Azure", "Astro", "Three.js", "Tailwind", "Blender", "TypeScript", "JavaScript", "Nanostores", "Canvas API"]
          },
          {
            title: "AI Procurement Automation Bot | React",
            description: [
              "Developed an AI-powered bot to streamline purchase orders for logistics and accounting, integrating blockchain for secure, transparent transactions"
            ],
            technologies: ["React", "Azure", "PowerAutomate", "Swagger", "Arrow API", "Azure", "Ethereum"]
          },
          {
            title: "Blockchain Verification Platform | Go, Rust",
            description: [
              "Built vehicle verification system using Hyperledger Fabric and Besu",
              "Built consortium services and smart-contract integrations in Go and Rust",
              "Optimized runtime performance by analyzing scheduling, memory, and system constraints under load",
              "Enabled cross-chain interoperability using Kaleido and Polygon Edge"
            ],
            technologies: ["Go", "Rust", "Hyperledger Fabric", "Besu", "Polygon", "Kaleido", "GoQuorum", "Indy"]
          },
          {
            title: "Enterprise Credential Infrastructure Tooling | Python",
            description: [
              "Centralized credentials across 96 services via automated config audits",
              "Built scripts to detect drift, redeploy services, and standardize auth"
            ],
            technologies: ["JavaScript", "HTML", "Python", "Securiti"]
          },
          {
            title: "Token Gated Access Platform | Rust, Solidity, React",
            description: [
              "Developed a Discord bot to control server access for token holders using ERC-4337 account abstraction",
              "Built backend verification services in Node.js and implemented high-performance chain Rust event listeners for realtime token validation",
              "Stored token ownership data via serverless APIs and Moralis webhooks"
            ],
            technologies: ["Solidity", "React", "Rust", "Ethers", "Discord API", "AWS", "Serverless", "Account Abstraction", "Docker"]
          },
          {
            title: "Metaverse Interaction Analytics Platform | React, TypeScript",
            description: [
              "Developed blockchain-based analytics system tracking NFT ownership, interactions, and engagement metrics across virtual environments",
              "Built frontend visualization components displaying real-time activity including views, likes, comments, and transactions",
              "Integrated Unity event streams to analyze gameplay behavior"
            ],
            technologies: ["React", "TypeScript", "Metaverse", "Solidity", "Unity", "Hardhat"]
          }
        ],
        skills: [
          "React",
          "TypeScript",
          "Blockchain",
          "Solidity",
          "Three.js",
          "WebGL",
          "Azure",
          "Unity",
          "Python",
          "Go",
          "Rust",
          "Web3",
          "Smart Contracts",
          "Hyperledger Fabric",
          "Besu",
          "Polygon",
          "Kaleido",
          "ERC-4337",
          "Account Abstraction",
          "Discord API",
          "AWS"
        ]
      }
    ]
  },
  {
    company: "PARADES",
    logo: `${process.env.PUBLIC_URL}/images/paradessquare.png`,
    roles: [
      {
        title: "SOFTWARE ENGINEER FULL-STACK",
        date: "SEP 2021 - SEP 2022",
        location: "REMOTE",
        details: [],
        projects: [
          {
            title: "Distributed Data Processing Platform | Python, Rust",
            description: [
              "Built scalable APIs for high-volume data systems",
              "Developed Rust modules for concurrent validation",
              "Improved throughput through async optimizations",
              "Delivered production infrastructure and monitoring"
            ],
            technologies: ["Python", "Rust", "Flask", "PostgreSQL", "Celery", "Redis", "Docker"]
          },
          {
            title: "Cross Platform Application Framework | React Native, TypeScript",
            description: [
              "Built scalable web and mobile apps with React and React Native",
              "Implemented state management and GraphQL data layers",
              "Developed full-stack features across APIs and databases",
              "Delivered secure production systems with auth and caching"
            ],
            technologies: ["React", "TypeScript", "GraphQL", "Express", "PostgreSQL", "OAuth", "JWT"]
          },
          {
            title: "Modular Smart Contract Infrastructure | Solidity, TypeScript",
            description: [
              "Designed scalable blockchain architecture and modular contracts",
              "Managed full contract lifecycle from build to deployment",
              "Built event-driven integrations across APIs, IPFS, and clients",
              "Implemented automated tests and CI pipelines for releases"
            ],
            technologies: ["Solidity", "TypeScript", "JavaScript", "Hardhat", "Foundry", "Node.js", "React", "Ethers.js", "Web3", "IPFS", "GraphQL", "Docker", "GitHub Actions"]
          }
        ],
        skills: ["Python", "Rust", "TypeScript", "React", "React Native", "Solidity", "Flask", "PostgreSQL", "GraphQL", "Docker", "Hardhat", "Foundry"]
      }
    ]
  },
  {
    company: "TREASURE",
    logo: `${process.env.PUBLIC_URL}/images/treasureicon.png`,
    roles: [
      {
        title: "SOFTWARE ENGINEER FULL-STACK",
        date: "JAN 2020 - AUG 2021",
        location: "REMOTE",
        details: [],
        projects: [
          {
            title: "Decentralized NFT Contract Platform | React, TypeScript",
            description: [
              "Designed and deployed token standards using Solidity and OpenZeppelin (ERC-20, 721, 1155, 777, 1400)",
              "Built full-stack dApps with wallets and on-chain interactions",
              "Built automation scripts for transaction and contract monitoring"
            ],
            technologies: ["Solidity", "React", "TypeScript", "Ethers.js", "Web3.js", "Hardhat", "IPFS"]
          },
          {
            title: "Distributed Asset Registration System | Go, Rust",
            description: [
              "Built Golang services for asset tracking with go-ethereum",
              "Developed Rust microservices for cryptographic validation logic",
              "Designed REST APIs supporting real-time blockchain state queries",
              "Automated contract testing on Ganache and Rinkeby"
            ],
            technologies: ["Golang", "Rust", "Solidity", "React.js", "Node.js", "IPFS", "Ethereum"]
          },
          {
            title: "Cross-Chain Governance Platform | Solana, Python, Rust",
            description: [
              "Built decentralized governance systems across Ethereum, BSC, and Solana",
              "Developed Rust programs for vote validation and state transitions",
              "Implemented Python services for signatures and off-chain coordination",
              "Built APIs and monitoring tools for governance execution"
            ],
            technologies: ["Python", "Rust", "Flask", "Web3.py", "IPFS", "Ethereum"]
          }
        ],
        skills: ["Solidity", "Go", "Rust", "Python", "TypeScript", "React", "Ethers.js", "Web3.js", "Hardhat", "IPFS", "Flask"]
      },
    ]
  },
  {
    company: "CARD SWAPPER",
    logo: `${process.env.PUBLIC_URL}/images/cardswappersquare.png`,
    roles: [
      {
        title: "WEB DEVELOPMENT INTERNSHIP",
        date: "SEPT 2017 - DEC 2019",
        location: "SEATTLE, WA",
        details: [
          "Developed the first user-to-user trading app for gift cards, enabling instant buying, selling, and trading via mobile. The first-generation app was built entirely in Objective-C"
        ],
        projects: [],
        skills: ["Objective-C", "iOS Development", "Mobile Development"]
      }
    ]
  }
];

const Experience: React.FC = () => {
  const [expandedRoles, setExpandedRoles] = React.useState<{[key: string]: boolean}>(() => {
    const initialState: {[key: string]: boolean} = {};
    experiences.forEach((exp, companyIndex) => {
      exp.roles.forEach((_, roleIndex) => {
        initialState[`${companyIndex}-${roleIndex}`] = true;
      });
    });
    return initialState;
  });

  const toggleRole = (companyIndex: number, roleIndex: number) => {
    const key = `${companyIndex}-${roleIndex}`;
    setExpandedRoles(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Experience</h2>
      {experiences.map((exp, companyIndex) => (
        <div key={companyIndex} className="border rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={exp.logo} 
              alt={`${exp.company} logo`} 
              className="w-12 h-12 object-contain"
            />
            <h3 className="font-bold text-xl">{exp.company}</h3>
          </div>
          
          <div className="space-y-6">
            {exp.roles.map((role, roleIndex) => {
              const isExpanded = expandedRoles[`${companyIndex}-${roleIndex}`];
              return (
                <div key={roleIndex} className="ml-16">
                  <button 
                    onClick={() => toggleRole(companyIndex, roleIndex)}
                    className="flex items-center gap-2 text-left w-full"
                  >
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      viewBox="0 0 24 24"
                    >
                      <path 
                        fill="currentColor" 
                        d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-lg">{role.title}</p>
                      <p className="text-sm text-gray-500">{role.date} • {role.location}</p>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-4 ml-6">
                      <ul className="list-disc list-inside mb-4">
                        {role.details.map((detail, idx) => (
                          <li key={idx} className="text-gray-700">{detail}</li>
                        ))}
                      </ul>
                      
                      {role.projects.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Projects</h4>
                          {role.projects.map((project, idx) => (
                            <div key={idx} className="mb-4 bg-gray-50 p-4 rounded">
                              <h5 className="font-medium mb-2">{project.title}</h5>
                              <ul className="list-disc list-inside mb-2">
                                {project.description.map((desc, descIdx) => (
                                  <li key={descIdx} className="text-gray-600 text-sm">{desc}</li>
                                ))}
                              </ul>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.map((tech, techIdx) => (
                                  <span key={techIdx} className="px-2 py-1 bg-gray-200 rounded-full text-xs">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {role.skills.map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Experience;
