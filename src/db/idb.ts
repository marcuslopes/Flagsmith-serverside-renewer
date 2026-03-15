import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Package, AttendanceRecord, ExchangeRateCache } from '../types'

interface DanceTrackerDB extends DBSchema {
  packages: {
    key: string
    value: Package
    indexes: { 'by-instructor': string; 'by-created': number }
  }
  attendance: {
    key: string
    value: AttendanceRecord
    indexes: { 'by-package': string; 'by-date': number }
  }
  settings: {
    key: string
    value: { key: string; value: unknown }
  }
}

let dbPromise: Promise<IDBPDatabase<DanceTrackerDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DanceTrackerDB>('dance-tracker-v1', 1, {
      upgrade(db) {
        const pkgStore = db.createObjectStore('packages', { keyPath: 'id' })
        pkgStore.createIndex('by-instructor', 'instructorName')
        pkgStore.createIndex('by-created', 'createdAt')

        const attStore = db.createObjectStore('attendance', { keyPath: 'id' })
        attStore.createIndex('by-package', 'packageId')
        attStore.createIndex('by-date', 'attendedAt')

        db.createObjectStore('settings', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

// --- Packages ---
export async function dbGetPackages(): Promise<Package[]> {
  const db = await getDB()
  return db.getAll('packages')
}

export async function dbPutPackage(pkg: Package): Promise<void> {
  const db = await getDB()
  await db.put('packages', pkg)
}

export async function dbDeletePackage(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['packages', 'attendance'], 'readwrite')
  await tx.objectStore('packages').delete(id)
  const idx = tx.objectStore('attendance').index('by-package')
  let cursor = await idx.openCursor(id)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}

// --- Attendance ---
export async function dbGetAttendance(packageId?: string): Promise<AttendanceRecord[]> {
  const db = await getDB()
  if (packageId) {
    return db.getAllFromIndex('attendance', 'by-package', packageId)
  }
  return db.getAll('attendance')
}

export async function dbPutAttendance(record: AttendanceRecord): Promise<void> {
  const db = await getDB()
  await db.put('attendance', record)
}

export async function dbDeleteAttendance(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('attendance', id)
}

// --- Settings ---
export async function dbGetSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB()
  const row = await db.get('settings', key)
  return row?.value as T | undefined
}

export async function dbSetSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put('settings', { key, value })
}

export async function dbGetRateCache(): Promise<ExchangeRateCache | undefined> {
  return dbGetSetting<ExchangeRateCache>('exchangeRateCache')
}

export async function dbSetRateCache(cache: ExchangeRateCache): Promise<void> {
  return dbSetSetting('exchangeRateCache', cache)
}
