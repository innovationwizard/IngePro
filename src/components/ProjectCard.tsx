import React from 'react';

interface Project {
  id: number;
  name: string;
  logo: string;
  description: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="project-card">
      <div className="project-content">
        <div className="project-logo">
          {project.logo}
        </div>
        <div className="project-description">
          <h3 style={{ color: '#ffffff', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
            {project.name}
          </h3>
          <p>{project.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 