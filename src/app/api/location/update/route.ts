import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST - Update location with delta-based tracking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      latitude, 
      longitude, 
      accuracy, 
      timestamp,
      deltaDistance, // Distance from last known position in meters
      deltaHeading,  // Heading change in degrees
      isSignificant // Whether this update meets delta thresholds
    } = body

    const prisma = await getPrisma()

    // Only store significant updates (meeting delta thresholds)
    if (isSignificant) {
      await prisma.locationUpdates.upsert({
        where: {
          personId: session.user.id
        },
        update: {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(timestamp),
          deltaDistance,
          deltaHeading,
          updatedAt: new Date()
        },
        create: {
          personId: session.user.id,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(timestamp),
          deltaDistance,
          deltaHeading
        }
      })

      // Log significant movement for audit trail
      await prisma.auditLogs.create({
        data: {
          personId: session.user.id,
          action: 'LOCATION_UPDATE',
          entityType: 'LOCATION',
          entityId: session.user.id,
          newValues: {
            latitude,
            longitude,
            accuracy,
            deltaDistance,
            deltaHeading,
            timestamp
          }
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      stored: isSignificant,
      message: isSignificant ? 'Location stored' : 'Location skipped (insignificant delta)'
    })

  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// GET - Get current location for a person
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getPrisma()
    
    const location = await prisma.locationUpdates.findUnique({
      where: { personId: session.user.id },
      select: {
        latitude: true,
        longitude: true,
        accuracy: true,
        timestamp: true,
        deltaDistance: true,
        deltaHeading: true
      }
    })

    if (!location) {
      return NextResponse.json({ error: 'No location data found' }, { status: 404 })
    }

    return NextResponse.json(location)

  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}
