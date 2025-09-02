'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdvancedAnalytics from '@/components/analytics/AdvancedAnalytics'
import AIInsights from '@/components/ai-insights/AIInsights'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Project {
  id: string
  name: string
  nameEs?: string
}

interface Worker {
  id: string
  name: string
}

export default function AnalysisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchProjects()
    fetchWorkers()
  }, [session, status, router])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/people')
      if (response.ok) {
        const data = await response.json()
        // Filter only WORKER people
        const workerPeople = (data.people || []).filter((person: any) => person.role === 'WORKER')
        setWorkers(workerPeople)
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user?.role === 'ADMIN'
  const isSupervisor = session.user?.role === 'SUPERVISOR'

  // Only allow admin and supervisor access
  if (!isAdmin && !isSupervisor) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Análisis</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Análisis avanzado y recomendaciones de inteligencia artificial para tus proyectos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full gap-1 sm:gap-2 p-1 sm:p-2 tabs-list-mobile overflow-x-auto min-h-[3rem] bg-gray-100 rounded-lg shadow-sm">
          <TabsTrigger value="analytics" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Análisis Avanzado</TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Avanzado</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedAnalytics 
                projects={projects}
                workers={workers}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insights de IA</CardTitle>
            </CardHeader>
            <CardContent>
              <AIInsights 
                projects={projects}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
