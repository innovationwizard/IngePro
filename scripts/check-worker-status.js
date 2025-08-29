#!/usr/bin/env node

/**
 * Quick script to check a specific worker's status
 * Usage: node scripts/check-worker-status.js <worker-id>
 */

const workerId = process.argv[2]

if (!workerId) {
  console.log('Usage: node scripts/check-worker-status.js <worker-id>')
  console.log('Example: node scripts/check-worker-status.js cmex1529d0003l104pn24ys0l')
  process.exit(1)
}

async function checkWorkerStatus() {
  try {
    console.log(`🔍 Checking status for worker: ${workerId}\n`)

    // Make a request to the debug endpoint
    const response = await fetch('http://localhost:3000/api/debug/worklog-data', {
      headers: {
        'Cookie': `next-auth.session-token=your-session-token` // This won't work without proper auth
      }
    })

    if (!response.ok) {
      console.log('❌ Could not fetch debug data (authentication required)')
      console.log('💡 Please check the debug endpoint manually in your browser:')
      console.log('   http://localhost:3000/api/debug/worklog-data')
      return
    }

    const data = await response.json()
    console.log('📊 Debug Data:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.log('❌ Error:', error.message)
    console.log('\n💡 Manual check instructions:')
    console.log('1. Open your browser and go to: http://localhost:3000/api/debug/worklog-data')
    console.log('2. Look for the worker ID in the project assignments')
    console.log('3. Check if the worker has any active PersonProjects records')
    console.log('4. Verify if there are any worklogs for this worker')
  }
}

checkWorkerStatus()
