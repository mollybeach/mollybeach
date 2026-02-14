// path: src/components/Skills.tsx
import React from 'react';

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
    'Solidity', 'Ethereum', 'Aptos', 'Near', 'Arbitrum', 'Solana', 
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
      {Object.entries(skills).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-xl font-medium text-gray-800 capitalize">
            {category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {items.map(skill => (
              <span
                key={skill}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors 
                          rounded-full text-sm text-gray-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default Skills;
