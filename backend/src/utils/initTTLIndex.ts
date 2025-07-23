// src/utils/initTTLIndex.ts

import mongoose from 'mongoose'
import DataRetention from '../models/dataRetention'
import logger from './logger'

export const ensureTTLIndex = async () => {
  const logs = mongoose.connection.collection('logs')

  // Get current retention value from DB
  const retentionDoc = await DataRetention.findOne({ type: 'logSettings' })
  const retentionDays = retentionDoc?.retentionDays || 30
  const ttlInSeconds = retentionDays * 86400

  const indexes = await logs.indexes()
  const existingTTL = indexes.find(i => i.name === 'createdAt_1' && i.expireAfterSeconds)

  if (existingTTL) {
    logger.info(
  `✅ TTL index already exists on logs.createdAt (${(existingTTL.expireAfterSeconds ?? 0) / 86400} days)`
)
    return
  }

  await logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: ttlInSeconds })

  logger.info(`🚀 TTL index created on logs.createdAt with ${retentionDays} day(s) retention`)
}
