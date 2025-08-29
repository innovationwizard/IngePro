#!/usr/bin/env node

/**
 * Debug script to check task assignment issues
 * Usage: node scripts/debug-task-assignment.js <task-id> <company-id>
 */

const taskId = process.argv[2]
const companyId = process.argv[3]

if (!taskId || !companyId) {
  console.log('Usage: node scripts/debug-task-assignment.js <task-id> <company-id>')
  console.log('Example: node scripts/debug-task-assignment.js cmex4os6r0007kv04zmvzblhc cmer9p8sd0001jy04igqjg3me')
  process.exit(1)
}

async function debugTaskAssignment() {
  try {
    console.log(`🔍 Debugging task assignment for:`)
    console.log(`  Task ID: ${taskId}`)
    console.log(`  Company ID: ${companyId}\n`)

    // Make a request to check the task
    const response = await fetch(`http://localhost:3000/api/debug/worker-status/${taskId}`)
    
    if (!response.ok) {
      console.log('❌ Could not fetch task data (authentication required)')
      console.log('💡 Please check manually in your browser:')
      console.log(`   http://localhost:3000/api/debug/worker-status/${taskId}`)
      return
    }

    const data = await response.json()
    console.log('📊 Task Data:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.log('❌ Error:', error.message)
    console.log('\n💡 Manual debugging steps:')
    console.log('1. Check if the task exists in the database')
    console.log('2. Verify the task has project assignments')
    console.log('3. Check if the company ID matches')
    console.log('4. Ensure the development server is running with latest code')
  }
}

debugTaskAssignment()
