// path: src/components/Projects.tsx
import React from 'react';
import { PageTitle, shelfAt } from './garden';
import ProjectCard from './ProjectCard';
import { projects } from './projectsData';
import { ProjectsImac } from '../palais/ProjectsImac';

const Projects: React.FC = () => {
  return (
    <section className="space-y-6">
      <PageTitle>Projects</PageTitle>
      <ProjectsImac />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            project={project}
            shelf={shelfAt(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default Projects;
