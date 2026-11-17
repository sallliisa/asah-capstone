import { z } from 'zod/v4'
import { getDb } from '../db'
import { piRoutingEvents } from '../routes/(authenticated)/pi/pi.table'
import { modelRequest } from '../model-service'
import { workflowDocuments } from './workflows.generated'
import { retrieveGuidance } from './retrieve'

export const questionSchema = z.object({ question: z.string().trim().min(1).max(2000) }).strict()
const intentSchema = z.object({
  status: z.enum(['routed', 'uncertain', 'out-of-scope']),
  intent: z.enum(['rooms', 'schedules', 'finances', 'guidance', 'out-of-scope']).nullable(),
  confidence: z.number().min(0).max(1),
  margin: z.number().min(0).max(1),
  modelVersion: z.string().min(1),
})

async function routeQuestion(question: string) {
  const input = questionSchema.parse({ question })
  let prediction: z.output<typeof intentSchema>
  try {
    prediction = intentSchema.parse(await modelRequest('/intent/classify', input))
  } catch {
    return { status: 'unavailable', message: 'Perutean pertanyaan belum tersedia. Gunakan aplikasi atau coba lagi nanti.' }
  }
  if (prediction.status === 'uncertain')
    return { status: 'uncertain', prediction, message: 'Anda ingin melihat data kamar, jadwal, keuangan, atau petunjuk penggunaan? Mohon sebutkan hasil yang dibutuhkan.' }
  if (prediction.status === 'out-of-scope')
    return { status: 'out-of-scope', prediction, message: 'Saya membantu pengelolaan kos dan penggunaan aplikasi. Silakan ajukan pertanyaan dalam lingkup tersebut.' }
  const area = prediction.intent
  if (!area || area === 'out-of-scope') return { status: 'unavailable', message: 'Hasil perutean tidak valid.' }
  const document = workflowDocuments[area]
  const retrieval = await retrieveGuidance(input.question, area)
  return { status: 'routed', prediction, document, retrieval }
}

export async function getQuestionContext(question: string, ownerId: string) {
  const result = await routeQuestion(question)
  const event = (await getDb().insert(piRoutingEvents).values({ ownerId, question, result }).returning({ id: piRoutingEvents.id }))[0]
  return { ...result, eventId: event.id }
}
