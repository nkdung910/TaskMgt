/**
 * Backfill Role Scores for Existing Articles
 * 
 * This script calculates and updates role relevance scores
 * for all existing news articles in the database
 */

import { backfillRoleScores } from '../src/lib/news/categorizer'

async function main() {
  console.log('🚀 Starting role score backfill process...\n')
  
  const result = await backfillRoleScores()
  
  if (result.success) {
    console.log(`\n✅ Backfill completed successfully!`)
    console.log(`   Articles scored: ${result.updated}`)
  } else {
    console.error(`\n❌ Backfill failed:`, result.error)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

