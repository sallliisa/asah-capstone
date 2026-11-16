import { defineDomainPart } from '@southneuhof/sprindle/model'
import { tenantDetectorCoverage, tenantDetectorPredictions, tenantDetectorState, tenantDetectorPredictionRooms } from './tenant-detector.table'

export const domain = defineDomainPart({ entities: [], tables: { tenantDetectorCoverage, tenantDetectorPredictions, tenantDetectorState, tenantDetectorPredictionRooms } })
