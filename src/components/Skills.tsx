// path: src/components/Skills.tsx
import React from 'react';
import { GardenHeading, GardenTag, shelfAt } from './garden';

const skills = {
  'Programming Languages': [
    'TypeScript', 'JavaScript', 'Solidity', 'Python', 'Swift', 'Rust', 
    'Java', 'Golang', 'Scala', 'C++', 'R', 'JSON', 'Ruby', 'HTML', 'CSS', 'SCSS'
  ],
  'Frontend Development': [
    'React', 'Node.js', 'Vue', 'Next.js', 'Angular', 'D3.js', 'Tailwind', 
    'Bootstrap', 'Material UI', 'Redux', 'Zustand'
  ],
  'Backend Development & API Integration': [
    'Node.js', 'Express.js', 'Django', 'Flask API', 'GraphQL', 'REST APIs', 
    'Web Sockets'
  ],
  'Authentication': [
    'OAuth', 'JWT', 'Firebase Auth'
  ],
  'Databases & Data Management': [
    'PostgreSQL', 'SQL', 'MySQL', 'MS SQL Server', 'Firestore', 'MongoDB', 
    'Redis', 'Docker'
  ],
  'Data Science & Analytics': [
    'Pandas', 'Numpy', 'TensorFlow', 'Matplotlib'
  ],
  'Cloud, DevOps & Infrastructure': [
    'AWS', 'Microsoft Azure', 'Vercel', 'Netlify', 'Heroku', 'Cloudflare', 
    'GCP', 'Docker', 'Kubernetes'
  ],
  'CI/CD': [
    'Terraform', 'Github Actions', 'Jenkins', 'Gitlab CI/CD'
  ],
  'Serverless Computing': [
    'Firebase Functions', 'AWS Lambda'
  ],
  'Blockchain & Web3': [
    'Solidity', 'Ethereum', 'Stellar', 'Soroban', 'Aptos', 'Near', 'Arbitrum', 'Solana', 
    'Hardhat', 'Truffle', 'Remix', 'Ganache', 'Foundry', 'IPFS', 
    'Moralis', 'Chainlink', 'Arweave'
  ],
  'Smart Contract Security': [
    'Zero-knowledge Proofs', 'Account Abstraction'
  ],
  'Testing & QA': [
    'Jest', 'Mocha', 'Chai', 'Playwright', 'Pytest', 'Hardhat', 'Foundry', 'Truffle'
  ],
  'Game Development & Creative Coding': [
    'GLSL', 'Three.js', 'Shaderpark', 'Unity', 'Unreal Engine', 'Canvas API'
  ],
  'System Design & Scalability': [
    'Distributed Systems', 'Microservices', 'Event Driven Architecture', 
    'Caching & Load Balancing', 'Redis', 'Memcached', 'Nginx', 'Cloudflare'
  ],
  'Program Management & Agile': [
    'Jira', 'Scrum', 'Kanban', 'Linear'
  ],
  'Message Queues & Event Driven Architecture': [
    'Apache Kafka', 'RabbitMQ', 'ZeroMQ', 'Redis Streams', 'NATS', 
    'Event Sourcing', 'CQRS', 'Webhooks', 'Pub/Sub Architecture', 
    'Google Pub/Sub', 'AWS SNS/SQS'
  ]
};

const Skills: React.FC = () => {
  return (
    <section className="space-y-6 p-8">
      <h2 className="text-3xl font-bold mb-8 text-center">Skills</h2>
      {/* two columns of cards on a wide screen, one on a phone; each card keeps
          its own colour and flower */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {Object.entries(skills).map(([category, items], i) => {
          const shelf = shelfAt(i);
          return (
            <div key={category} className="gilt-card space-y-3 rounded-2xl bg-[#fffdf6] p-5">
              <GardenHeading shelf={shelf} count={items.length}>
                <span className="capitalize">{category}</span>
              </GardenHeading>
              <div className="flex flex-wrap gap-2">
                {items.map(skill => (
                  <GardenTag key={skill} shelf={shelf}>{skill}</GardenTag>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Skills;
