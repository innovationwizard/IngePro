'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { es } from '@/lib/translations/es'

// Mock work logs for demo
const mockWorkLogs = [
  {
    id: '1',
    date: '2024-01-15',
    clockIn: '07:30',
    clockOut: '16:30',
    hours: 9,
    approved: true,
  },
  {
    id: '2',
    date: '2024-01-14',
    clockIn: '08:00',
    clockOut: '17:00',
    hours: 9,
    approved: false,
  },
  {
    id: '3',
    date: '2024-01-13',
    clockIn: '07:45',
    clockOut: '16:45',
    hours: 9,
    approved: true,
  },
]

export function RecentWorkLogs() {
  const [workLogs, setWorkLogs] = useState(mockWorkLogs)

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{es.workLogs.recentWorkLogs}</h2>
      
      <div className="space-y-3">
        {workLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{log.date}</div>
                <div className="text-sm text-gray-500">
                  {log.clockIn} - {log.clockOut} ({log.hours}{es.workLogs.hours})
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {log.approved ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-xs text-gray-500">
                {log.approved ? es.workLogs.approved : es.workLogs.pending}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium">
          {es.workLogs.viewAllWorkLogs}
        </button>
      </div>
    </div>
  )
}
