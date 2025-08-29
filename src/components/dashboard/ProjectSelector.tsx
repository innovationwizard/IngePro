'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store'
import { Building2, ChevronDown } from 'lucide-react'
import { es } from '@/lib/translations/es'
import { useSession } from 'next-auth/react'

interface Project {
  id: string
  name: string
  description: string
  company: {
    id: string
    name: string
  }
  createdAt: string
}

export function ProjectSelector() {
  const { projects, currentProject, setProjects, setCurrentProject } = useProjectStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchProjects = async () => {
      if (!session) return
      
      try {
        setIsLoading(true)
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        } else {
          console.error('Error fetching projects')
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [setProjects, session])

  if (isLoading) {
    return (
      <div className="mobile-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{es.projects.currentProject}</h2>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{es.projects.currentProject}</h2>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {currentProject?.name || es.projects.selectProject}
              </div>
              {currentProject?.description && (
                <div className="text-sm text-gray-500 truncate">
                  {currentProject.description}
                </div>
              )}
              {currentProject?.company && (
                <div className="text-xs text-gray-400 truncate">
                  {currentProject.company.name}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {projects.length > 0 ? (
              projects.map((project: Project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentProject(project)
                    setIsOpen(false)
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 truncate">{project.name}</div>
                  <div className="text-sm text-gray-500 truncate">{project.description}</div>
                  <div className="text-xs text-gray-400 truncate">{project.company.name}</div>
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500">
                No hay proyectos disponibles
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
