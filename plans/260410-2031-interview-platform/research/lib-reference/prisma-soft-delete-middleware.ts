/**
 * Prisma Client Extension for Soft Deletes
 *
 * Automatically filters out soft-deleted records from queries.
 * Usage: Always query with `includeDeleted: false` (default) to exclude deleted records.
 *
 * Example:
 *   const questions = await prisma.question.findMany(); // excludes deleted
 *   const allQuestions = await prisma.question.findMany({ where: { includeDeleted: true } }); // includes deleted
 */

import { Prisma, PrismaClient } from '@prisma/client';

// Models that support soft deletes
const SOFT_DELETE_MODELS = [
  'User',
  'Role',
  'Topic',
  'Question',
  'ScenarioTemplate',
  'KnowledgeBase',
];

/**
 * Creates a Prisma Client with soft delete support via client extensions.
 * Automatically adds `deletedAt: null` filter to read queries for soft-delete models.
 */
export function createPrismaClientWithSoftDelete() {
  const prismaClient = new PrismaClient();

  return prismaClient.$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        // Only apply soft delete filtering to these operations
        const readOperations = [
          'findUnique',
          'findFirst',
          'findMany',
          'count',
          'aggregate',
          'groupBy',
        ];

        // Check if this is a model with soft deletes and a read operation
        if (SOFT_DELETE_MODELS.includes(model) && readOperations.includes(operation)) {
          // Skip soft delete filtering if explicitly requested
          if (args.where?.includeDeleted === true) {
            delete args.where.includeDeleted;
            return query(args);
          }

          // Add deletedAt: null to where clause
          if (args.where === undefined) {
            args.where = {};
          }

          // Handle nested where (e.g., findMany with complex filters)
          if (typeof args.where === 'object' && args.where !== null) {
            args.where.deletedAt = null;
          }
        }

        return query(args);
      },
    },
  });
}

/**
 * Soft delete a record by setting deletedAt timestamp and optionally deletedBy user.
 * Works with models that have deletedAt and deletedBy fields.
 */
export async function softDeleteRecord(
  prisma: ReturnType<typeof createPrismaClientWithSoftDelete>,
  model: string,
  id: number,
  deletedBy?: number
) {
  const updateData: any = { deletedAt: new Date() };
  if (deletedBy) {
    updateData.deletedBy = deletedBy;
  }

  return (prisma as any)[model.toLowerCase()].update({
    where: { id },
    data: updateData,
  });
}

/**
 * Restore a soft-deleted record by clearing deletedAt and deletedBy.
 */
export async function restoreRecord(
  prisma: ReturnType<typeof createPrismaClientWithSoftDelete>,
  model: string,
  id: number
) {
  return (prisma as any)[model.toLowerCase()].update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });
}

/**
 * Hard delete a record (actually removes from database).
 * WARNING: This is permanent and cannot be undone.
 */
export async function hardDeleteRecord(
  prisma: ReturnType<typeof createPrismaClientWithSoftDelete>,
  model: string,
  id: number
) {
  return (prisma as any)[model.toLowerCase()].delete({
    where: { id },
  });
}

/**
 * List only deleted records for a model (audit trail / recovery).
 */
export async function listDeletedRecords(
  prisma: ReturnType<typeof createPrismaClientWithSoftDelete>,
  model: string,
  limit: number = 100
) {
  return (prisma as any)[model.toLowerCase()].findMany({
    where: { deletedAt: { not: null }, includeDeleted: true },
    include: {
      deletedByRelation: true, // Assumes relation field exists
    },
    orderBy: { deletedAt: 'desc' },
    take: limit,
  });
}

/**
 * Example usage in application code:
 *
 * const prisma = createPrismaClientWithSoftDelete();
 *
 * // Query active questions only (soft-deleted filtered out)
 * const questions = await prisma.question.findMany({
 *   where: { topicId: 1 }
 * });
 *
 * // Query including deleted
 * const allQuestions = await prisma.question.findMany({
 *   where: { topicId: 1, includeDeleted: true }
 * });
 *
 * // Soft delete a question
 * await softDeleteRecord(prisma, 'Question', questionId, userId);
 *
 * // Restore a deleted question
 * await restoreRecord(prisma, 'Question', questionId);
 *
 * // View deleted records for audit
 * const deletedQuestions = await listDeletedRecords(prisma, 'Question', 50);
 */
