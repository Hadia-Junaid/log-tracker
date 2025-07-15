// src/utils/updateLogTTL.ts

import mongoose from 'mongoose'
import logger from './logger'

export const updateLogTTLIndex = async (days: number) => {
  const collection = mongoose.connection.collection('logs')
  const ttlInSeconds = days * 86400

    // Drop existing TTL index if it exists
    const indexes = await collection.indexes()
    const ttlIndex = indexes.find((i) => i.name === 'createdAt_1' && i.expireAfterSeconds)

    if (ttlIndex) {
      await collection.dropIndex('createdAt_1')
      logger.info('Old TTL index dropped from logs collection.')
    }

    // Create new TTL index with updated value
    await collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: ttlInSeconds }
    )

    logger.info(`New TTL index created with retention: ${ttlInSeconds} seconds (${days} days)`)

}
