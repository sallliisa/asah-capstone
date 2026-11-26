import { createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod/v4'
import { issueReports } from './issue-reports.table'

export const issueReportStatusSchema = z.enum(['open', 'in_progress', 'resolved'])
export type IssueReportStatus = z.infer<typeof issueReportStatusSchema>

export const issueReportCreateSchema = z.strictObject({
  roomId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
})

export const issueReportUpdateSchema = z.strictObject({
  status: issueReportStatusSchema,
  activityId: z.string().min(1).nullable().optional(),
})

export const issueReportSelectSchema = createSelectSchema(issueReports, { status: issueReportStatusSchema })
export const issueReportPublicSchema = issueReportSelectSchema
  .pick({ id: true, title: true, description: true, status: true, createdAt: true, updatedAt: true })
  .extend({
    roomName: z.string(),
    reporterName: z.string(),
    activityId: z.string().nullable(),
    activityName: z.string().nullable(),
  })

export const issueReportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(160).optional(),
  status: issueReportStatusSchema.optional(),
})
