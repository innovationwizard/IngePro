import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST - Batch location updates from sendBeacon
export async function POST(request: NextRequest) {
  try {
    // sendBeacon sends data as a ReadableStream, so we need to handle it differently
    const body = await request.json()
    const { locations, timestamp } = body

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({ error: 'No locations provided' }, { status: 400 })
    }

    const prisma = await getPrisma()

    // Process batch locations
    const locationPromises = locations.map(async (location: any) => {
      try {
        await prisma.locationUpdates.upsert({
          where: {
            personId: location.personId
          },
          update: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date(location.timestamp),
            deltaDistance: location.deltaDistance || 0,
            deltaHeading: location.deltaHeading || 0,
            updatedAt: new Date()
          },
          create: {
            personId: location.personId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date(location.timestamp),
            deltaDistance: location.deltaDistance || 0,
            deltaHeading: location.deltaHeading || 0
          }
        })

        // Log batch update
        await prisma.auditLogs.create({
          data: {
            personId: location.personId,
            action: 'LOCATION_BATCH_UPDATE',
            entityType: 'LOCATION',
            entityId: location.personId,
            newValues: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              timestamp: location.timestamp,
              batchSize: locations.length
            }
          }
        })

        return { success: true, personId: location.personId }
      } catch (error) {
        console.error(`Failed to process location for person ${location.personId}:`, error)
        return { success: false, personId: location.personId, error: error.message }
      }
    })

    const results = await Promise.allSettled(locationPromises)
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    console.log(`Batch location update: ${successful} successful, ${failed} failed`)

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      successful,
      failed,
      timestamp
    })

  } catch (error) {
    console.error('Error processing batch location updates:', error)
    return NextResponse.json(
      { error: 'Failed to process batch location updates' },
      { status: 500 }
    )
  }
}
