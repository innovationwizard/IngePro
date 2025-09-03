const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixOrphanedWorklog() {
  try {
    console.log('🔧 Fixing orphaned worklog...')
    
    // Find the orphaned worklog
    const orphanedWorklog = await prisma.workLogs.findFirst({
      where: {
        id: 'cmf47uc810001ih04ygz20qso',
        personId: 'cmex0nu3h0003js04x6hwied6',
        clockOut: null
      }
    })
    
    if (!orphanedWorklog) {
      console.log('❌ Orphaned worklog not found')
      return
    }
    
    console.log('📋 Found orphaned worklog:', {
      id: orphanedWorklog.id,
      personId: orphanedWorklog.personId,
      clockIn: orphanedWorklog.clockIn,
      clockOut: orphanedWorklog.clockOut,
      notes: orphanedWorklog.notes
    })
    
    // Close the worklog by setting clockOut to now
    const fixedWorklog = await prisma.workLogs.update({
      where: { id: orphanedWorklog.id },
      data: {
        clockOut: new Date(),
        notes: `${orphanedWorklog.notes} - Automatically closed due to system issue`,
        notesEs: `${orphanedWorklog.notesEs} - Cerrado automáticamente debido a problema del sistema`,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Worklog fixed successfully:', {
      id: fixedWorklog.id,
      clockIn: fixedWorklog.clockIn,
      clockOut: fixedWorklog.clockOut,
      notes: fixedWorklog.notes
    })
    
    // Calculate duration
    const duration = Math.round((fixedWorklog.clockOut.getTime() - fixedWorklog.clockIn.getTime()) / (1000 * 60))
    console.log(`⏱️  Total duration: ${duration} minutes`)
    
  } catch (error) {
    console.error('❌ Error fixing orphaned worklog:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixOrphanedWorklog()
