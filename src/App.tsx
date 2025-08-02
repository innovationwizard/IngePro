import React from 'react';
import ProjectCard from './components/ProjectCard';

// Project data - easy to add more projects
const projects = [
  {
    id: 1,
    name: "IngePro",
    logo: "IP",
    description: "A comprehensive project management platform with time tracking, user management, and real-time collaboration features. Built with Next.js, TypeScript, and Prisma."
  },
  {
    id: 2,
    name: "AI Dev",
    logo: "AI",
    description: "Portfolio showcasing artificial intelligence developments and projects. A minimalist, mobile-first design highlighting innovative AI solutions and technologies."
  }
];

function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <img src="/ingepro_logo.png" alt="IngePro Logo" width="80" height="80" />
            </div>
            <h1 className="title">IngePro - Gestión de Productividad en Construcción</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; 2024 IngePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 