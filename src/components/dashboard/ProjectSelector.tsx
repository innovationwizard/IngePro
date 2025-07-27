'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store'
import { Building2, ChevronDown } from 'lucide-react'
import { es } from '@/lib/translations/es'

// Mock projects for demo with Spanish names
const mockProjects = [
  { id: '1', name: 'Downtown Office Complex', nameEs: 'Complejo de Oficinas Centro', description: 'Main building construction', descriptionEs: 'Construcción del edificio principal' },
  { id: '2', name: 'Residential Tower A', nameEs: 'Torre Residencial A', description: 'Apartment complex phase 1', descriptionEs: 'Complejo de apartamentos fase 1' },
  { id: '3', name: 'Shopping Center', nameEs: 'Centro Comercial', description: 'Retail space development', descriptionEs: 'Desarrollo de espacio comercial' },
]

export function ProjectSelector() {
  const { projects, currentProject, setProjects, setCurrentProject } = useProjectStore()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load projects (in real app, this would be an API call)
    setProjects(mockProjects)
  }, [setProjects])

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{es.projects.currentProject}</h2>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div className="text-left">
              <div className="font-medium text-gray-900">
                {currentProject?.nameEs || currentProject?.name || es.projects.selectProject}
              </div>
              {(currentProject?.descriptionEs || currentProject?.description) && (
                <div className="text-sm text-gray-500">
                  {currentProject?.descriptionEs || currentProject?.description}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setCurrentProject(project)
                  setIsOpen(false)
                }}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{project.nameEs || project.name}</div>
                <div className="text-sm text-gray-500">{project.descriptionEs || project.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
