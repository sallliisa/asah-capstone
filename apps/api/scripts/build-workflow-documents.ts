import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const documents: Record<string, { id: string; version: string; content: string }> = {}
for (const area of ['rooms', 'schedules', 'finances', 'guidance']) {
  const content = await readFile(new URL(`../knowledge/workflows/${area}.md`, import.meta.url), 'utf8')
  const version = createHash('sha256').update(content).digest('hex')
  documents[area] = { id: area, version, content }
}
const output = `export const workflowDocuments = ${JSON.stringify(documents, null, 2)}\n`
const target = new URL('../src/knowledge/workflows.generated.ts', import.meta.url)
const existing = await readFile(target, 'utf8').catch(() => '')
if (existing !== output) await writeFile(target, output)
