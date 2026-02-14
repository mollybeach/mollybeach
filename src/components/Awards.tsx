// path: src/components/Awards.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface Award {
  hackathon: string;
  logo: string;
  date: string;
  location: string;
  project: string;
  prize: string;
  achievements: string[];
  projectLink?: string;
  githubUrl?: string;
}

const awards: Award[] = [
  {
    hackathon: "RAYLS HACKATHON",
    logo: `${process.env.PUBLIC_URL}/images/rayls_hackathon.png`,
    date: "NOV 18-19, 2025",
    location: "BUENOS AIRES, ARGENTINA",
    project: "PRAXOS",
    prize: "🥇 1ST PLACE WINNER",
    achievements: [
      "Won 1st place for building AI-generated ERC-4626 vault engine for RWAs",
      "Designed compliant vault system integrating ERC-3643 + identity modules",
      "Built institutional RWA tokenization + allocation optimization engine"
    ],
    projectLink: "https://praxos.vercel.app/",
    githubUrl: "https://github.com/mollybeach/praxos"
  },
  {
    hackathon: "ETHGLOBAL CANNES",
    logo: `${process.env.PUBLIC_URL}/images/ethglobal_cannes.png`,
    date: "JUL 4-6, 2025",
    location: "CANNES, FRANCE",
    project: "LIVESTAKES",
    prize: "🏆 FINALIST",
    achievements: [
      "Built real-time prediction market for live hackathon demos",
      "Implemented AI-driven market creation from livestream data",
      "Enabled instant payouts via Flow smart contracts"
    ],
    projectLink: "https://www.livestakes.fun/",
    githubUrl: "https://github.com/mollybeach/livestakes"
  },
  {
    hackathon: "ETHGLOBAL BUENOS AIRES",
    logo: `${process.env.PUBLIC_URL}/images/ethglobal_world_coin_hackathon_buenos_aires.png`,
    date: "NOV 21-23, 2025",
    location: "BUENOS AIRES, ARGENTINA",
    project: "HEDGEPOD",
    prize: "🏆 WORLD POOL PRIZE WINNER",
    achievements: [
      "Built cross-chain AI DeFi agent managing yield across 8+ chains",
      "Implemented APR-aware routing + automated rebalancing logic",
      "Delivered gasless consumer UX for 23M+ World App users"
    ],
    projectLink: "https://hedgepod.vercel.app/",
    githubUrl: "https://github.com/mollybeach/hedgepod"
  }
];

const Awards: React.FC = () => {
  const [expandedAwards, setExpandedAwards] = React.useState<{[key: number]: boolean}>(() => {
    const initialState: {[key: number]: boolean} = {};
    awards.forEach((_, index) => {
      initialState[index] = true;
    });
    return initialState;
  });

  const toggleAward = (index: number) => {
    setExpandedAwards(prev => ({...prev, [index]: !prev[index]}));
  };

  return (
    <>
      <Helmet>
        <title>Awards - Molly Beach | Hackathon Wins</title>
        <meta name="description" content="Molly Beach's hackathon awards and achievements - 1st Place at Rayls Hackathon, ETHGlobal Finalist, and World Pool Prize Winner." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:url" content="https://mollybeach.app/awards" />
        <meta property="og:title" content="Awards - Molly Beach | Hackathon Wins" />
        <meta property="og:description" content="Hackathon awards including 1st Place at Rayls Hackathon, ETHGlobal Finalist, and World Pool Prize Winner." />
        
        {/* Twitter */}
        <meta property="twitter:url" content="https://mollybeach.app/awards" />
        <meta property="twitter:title" content="Awards - Molly Beach | Hackathon Wins" />
        <meta property="twitter:description" content="Hackathon awards including 1st Place at Rayls Hackathon, ETHGlobal Finalist, and World Pool Prize Winner." />
      </Helmet>

      <div className="space-y-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Awards</h2>
        {awards.map((award, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gradient-to-br from-[#D63384]/5 to-[#B02968]/5 border-[#D63384]/20">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={award.logo} 
                alt={`${award.hackathon} logo`} 
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-bold text-xl">{award.hackathon}</h3>
                <p className="text-sm text-gray-600">{award.date} • {award.location}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="ml-20">
                <button 
                  onClick={() => toggleAward(index)}
                  className="flex items-center gap-2 text-left w-full"
                >
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${expandedAwards[index] ? 'rotate-90' : ''}`}
                    viewBox="0 0 24 24"
                  >
                    <path 
                      fill="currentColor" 
                      d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-2xl text-[#D63384]">{award.prize}</p>
                    </div>
                    <p className="font-semibold text-lg text-gray-800 mt-1">{award.project}</p>
                  </div>
                </button>
                
                {expandedAwards[index] && (
                  <div className="mt-4 ml-6">
                    <ul className="list-disc list-inside mb-4 space-y-2">
                      {award.achievements.map((achievement, idx) => (
                        <li key={idx} className="text-gray-700">{achievement}</li>
                      ))}
                    </ul>
                    
                    {(award.projectLink || award.githubUrl) && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {award.projectLink && (
                          <a 
                            href={award.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#D63384] text-white rounded-lg hover:bg-[#B02968] transition-colors shadow-md hover:shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Project
                          </a>
                        )}
                        {award.githubUrl && (
                          <a 
                            href={award.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-md hover:shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            View GitHub
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Awards;
