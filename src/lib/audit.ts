import { prisma } from "./prisma";
import type { SessionPayload } from "./auth";

/**
 * Record an admin/staff action in the AuditLog table.
 * Fail-soft: any write error is swallowed so it never breaks the user's action.
 */
export async function writeAudit(args: {
  session: SessionPayload;
  action: string;
  targetType?: string;
  targetId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: args.session.userId,
        actorEmail: args.session.email,
        actorName: args.session.name,
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId,
        summary: args.summary,
        metadata: args.metadata ? JSON.stringify(args.metadata) : null,
        ip: args.ip,
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("audit log write failed:", e);
    }
  }
}
