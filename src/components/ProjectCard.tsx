// src/components/ProjectCard.tsx
import React from 'react';
import { GardenTag, type Shelf } from './garden';
import { paletteOf, useFloral } from '../palais/florals';

interface ProjectCardProps {
  project: {
    title: string;
    date: string;
    description: string;
    technologies: string[];
    microlink: string;
    link: string;
    previewType: 'microlink' | 'image';
    overview: string;
    keyFeatures: {
      title: string;
      description: string;
      icon?: string;
    }[];
    installation: {
      steps: {
        command: string;
        description: string;
      }[];
    };
    screenshots: {
      url: string;
      alt: string;
      caption?: string;
    }[];
    demoUrl?: string;
    githubUrl?: string;
    status: 'In Development' | 'Completed' | 'Archived';
    architecture?: string;
    techStack: {
      frontend?: string[];
      backend?: string[];
      deployment?: string[];
      tools?: string[];
    };
  }
}

const ProjectCard: React.FC<ProjectCardProps & { shelf: Shelf }> = ({ project, shelf }) => {
  const ribbon = paletteOf(useFloral('footer').now).jewel;
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <div 
      style={{ order: isExpanded ? -1 : 0 }}
      className={`gilt-card block rounded-2xl overflow-hidden transition-all duration-300 ease-in-out bg-[#fffdf6]
        ${isExpanded ? 'col-span-full w-[85%] mx-auto relative z-10' : 'relative z-0'}`}
    >
      <div className="flex flex-col">
        {/* Preview Image with Link */}
        <a href={project.link} target="_blank" rel="noopener noreferrer" className="block p-3">
          {/* the preview sits in a frame of the same stone as the plaque at the
              top of the page (garden.tsx) */}
          <div
            className={`relative overflow-hidden rounded-xl border-[3px] bg-[#fffdf6] transition-all duration-300 ease-in-out
            ${isExpanded ? 'h-[400px]' : 'h-48'}`}
            style={{ borderColor: ribbon }}
          >
            <img
              src={project.microlink}
              alt={project.title}
              className="w-full h-full object-contain hover:opacity-80 transition-opacity duration-200"
              loading="lazy"
            />
          </div>
        </a>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between mb-1">
            <h3 className="text-xl font-bold">{project.title}</h3>
            <span className="text-sm text-gray-600">{project.date}</span>
          </div>
          
          {/* Status Badge - Now on its own row */}
          <div className="mb-2">
            <span className={`text-sm px-2 py-1 rounded-full ${
              project.status === 'Completed' ? 'bg-green-100 text-green-800' :
              project.status === 'In Development' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          </div>

          {/* Overview */}
          <div className={`transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[800px]' : 'max-h-[100px] overflow-hidden'}`}>
            <p className="text-gray-700 leading-relaxed mb-4">
              {isExpanded ? project.overview : project.description}
            </p>

            {isExpanded && (
              <>
                {/* Key Features */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">🔑 Key Features</h4>
                  <ul className="space-y-2">
                    {project.keyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">{feature.icon}</span>
                        <div>
                          <span className="font-medium">{feature.title}:</span>
                          <span className="text-gray-600 ml-1">{feature.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tech Stack */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">🛠️ Tech Stack</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(project.techStack).map(([category, techs]) => (
                      <div key={category}>
                        <h5 className="font-medium capitalize mb-1">{category}:</h5>
                        <ul className="list-disc list-inside text-gray-600">
                          {techs.map((tech, index) => (
                            <li key={index}>{tech}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Technologies Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {project.technologies
              .slice(0, isExpanded ? undefined : 6)
              .map((tech, index) => (
                <GardenTag key={index} shelf={shelf}>{tech}</GardenTag>
            ))}
            {!isExpanded && project.technologies.length > 6 && (
              <span className="px-2.5 py-1 rounded-full text-sm" style={{ color: shelf.ink, opacity: 0.75 }}>
                +{project.technologies.length - 6} more
              </span>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#D63384] border-2 border-[#D63384] rounded-full hover:bg-[#D63384] hover:text-white transition-all duration-200"
            >
              <span className="font-medium">{isExpanded ? 'Show Less' : 'Show More'}</span>
              <svg 
                className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
