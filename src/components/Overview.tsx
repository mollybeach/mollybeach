// src/components/Overview.tsx
import React from 'react';
import { GardenTag, shelfAt } from './garden';
import { Helmet } from 'react-helmet-async';

import { 
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const Overview: React.FC = () => {

  const shaderGifs = [
    { src: `${process.env.PUBLIC_URL}/images/mandelbrot.gif`, title: 'Mandelbrot Set' },
    { src: "https://res.cloudinary.com/storagemanagementcontainer/image/upload/v1731722339/portfolio/owl_ppb6ih.gif", title: 'Owl' },
    { src: `${process.env.PUBLIC_URL}/images/fidgetToy.gif`, title: 'Fidget Toy' },
    { src: `${process.env.PUBLIC_URL}/images/milkers.gif`, title: 'Milkers' },
    { src: `${process.env.PUBLIC_URL}/images/gene.gif`, title: 'Gene Expression' },
    { src: `${process.env.PUBLIC_URL}/images/butterfree.gif`, title: 'Butterfree' },
    { src: `${process.env.PUBLIC_URL}/images/binaryTree.gif`, title: 'Binary Tree' },
    { src: `${process.env.PUBLIC_URL}/images/rattata.gif`, title: 'Rattata' },
    { src: `${process.env.PUBLIC_URL}/images/poke.gif`, title: 'Poke' },
    { src: `${process.env.PUBLIC_URL}/images/purugly.gif`, title: 'Purugly' },
    { src: `${process.env.PUBLIC_URL}/images/growlithe.gif`, title: 'Growlithe' },
    { src: `${process.env.PUBLIC_URL}/images/chikorita.gif`, title: 'Chikorita' },
    { src: `${process.env.PUBLIC_URL}/images/grimLeaper.gif`, title: 'Grim Leaper' },
    { src: `${process.env.PUBLIC_URL}/images/zap.gif`, title: 'Zap' },
    { src: `${process.env.PUBLIC_URL}/images/horseSea.gif`, title: 'Horse Sea' },
    { src: `${process.env.PUBLIC_URL}/images/flowerGarden.gif`, title: 'Flower Garden' },
  ];
  
  return (
    <>
      <Helmet>
        <title>Molly Beach - Full-Stack Software Engineer | Portfolio</title>
        <meta name="description" content="Molly Beach - Senior Full-Stack Engineer specializing in blockchain, AI & Web3 systems. Building decentralized applications with cutting-edge technology." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:url" content="https://mollybeach.app/" />
        <meta property="og:title" content="Molly Beach - Full-Stack Software Engineer" />
        <meta property="og:description" content="Senior Full-Stack Engineer specializing in blockchain, AI & Web3 systems. Building decentralized applications with cutting-edge technology." />
        
        {/* Twitter */}
        <meta property="twitter:url" content="https://mollybeach.app/" />
        <meta property="twitter:title" content="Molly Beach - Full-Stack Software Engineer" />
        <meta property="twitter:description" content="Senior Full-Stack Engineer specializing in blockchain, AI & Web3 systems. Building decentralized applications with cutting-edge technology." />
      </Helmet>
      
      <div className="gilt-card p-6 bg-[#fffdf6] rounded-2xl">
      {/* Header with name and avatar */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Molly Beach</h1>
          <p className="text-lg text-gray-600 mb-4">Senior Full-Stack Engineer – Blockchain, AI & Web3 Systems</p>
          
          {/* Social Links */}
          <div className="flex gap-3">
            <a 
              href="https://github.com/mollybeach" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <img 
                src={`${process.env.PUBLIC_URL}/images/github-mark.png`}
                alt="GitHub"
                className="w-8 h-8 rounded shadow-sm hover:shadow-md"
              />
            </a>
            <a 
              href="https://www.linkedin.com/in/mollybeach" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
            <img 
              src={`${process.env.PUBLIC_URL}/images/linkedin-icon.png`}
              alt="LinkedIn"
              className="w-8 h-8 rounded shadow-sm hover:shadow-md"
            />
          </a>
          </div>
        </div>
        <img 
          src={"https://res.cloudinary.com/storagemanagementcontainer/image/upload/v1777385857/portfolio/BEACH_MOLLY_PASSPORT_PHOTO_wibxaf.png"}
          alt="Molly Beach"
          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-lg"
        />
      </div>

      {/* Contact Info */}
      <div className="mb-6 text-gray-700 bg-white">
        <p className="mb-1 text-gray-700 flex items-center">
          <PhoneIcon className="h-5 w-5 mr-2" />
          206.947.6991
        </p>
        <p className="text-gray-700 flex items-center">
          <EnvelopeIcon className="h-5 w-5 mr-2" />
          mollyjbeach@gmail.com
        </p>
      </div>

      {/* Overview content */}
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Molly Beach is a senior full-stack engineer at the intersection of blockchain, AI, and distributed systems. She works in Rust, Go, and Solidity, and ships full stacks with React and TypeScript. Her experience runs from DTCC Digital Assets (Stellar/Soroban, Solana/Anchor, leadership) and Blockmedia (custom L1 with federated learning in consensus) through BRKT, Parades, Accenture, and Treasure, spanning prediction markets, mobile and Scala backends, enterprise chains, and NFT / governance systems. She holds a B.S. from the University of Washington in molecular, cellular, and developmental biology with a minor in computer science.
        </p>
        
        <p className="text-gray-700 leading-relaxed">
          Recent hackathon results include Praxos (1st place, Rayls Hackathon Buenos Aires), LiveStakes (finalist, ETHGlobal Cannes), and HedgePod (World Pool prize, ETHGlobal Buenos Aires). Those builds mix modern Solidity, cross-chain tooling, and AI-driven UX on Next.js. She invests in the creative side of the stack too (shader work, GLSL, Three.js, and Unity), so protocol-heavy work still ships with interfaces people want to use. That pairing of rigor and craft is what she carries from hackathon demos into longer product roadmaps.
        </p>
        
        {/* the same tinted tags as the Skills page, a colour per line */}
        <div className="flex flex-wrap gap-2">
          {["Solidity", "Go", "Rust", "React", "TypeScript", "JavaScript", "Python", "Swift", "Blockchain", "Web3", "AI/ML", "Three.js", "GLSL", "Hardhat", "Next.js", "AWS", "Azure", "GCP"].map((tag, i) => (
            <GardenTag key={tag} shelf={shelfAt(Math.floor(i / 3))}>{tag}</GardenTag>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {shaderGifs.map((gif, index) => (
            <div key={index} className="relative group">
              <img 
                src={gif.src} 
                alt={gif.title}
                className="w-full h-48 object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                <p className="text-center text-sm">{}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Overview;
