/**
 * Purge users with active=0 from the DB and Supabase Auth.
 *
 * Reassigns their contingencies, comments, attachments, and audit logs
 * to the configured reassign target (by email).
 *
 * Usage:
 *   tsx scripts/purge-inactive-users.ts            # dry run (default)
 *   tsx scripts/purge-inactive-users.ts --execute  # actually delete
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "../src/lib/prisma";
import { createAdminClient } from "../src/lib/supabase/admin";

const REASSIGN_EMAIL = "nicoaguirrealende@gmail.com";
const EXECUTE = process.argv.includes("--execute");

async function main() {
  console.log(`\n=== Purge inactive users (${EXECUTE ? "EXECUTE" : "DRY RUN"}) ===\n`);

  const reassignTarget = await prisma.user.findUnique({
    where: { email: REASSIGN_EMAIL },
    select: { id: true, name: true, active: true },
  });

  if (!reassignTarget) {
    throw new Error(`Reassign target ${REASSIGN_EMAIL} not found`);
  }
  if (reassignTarget.active !== 1) {
    throw new Error(`Reassign target ${REASSIGN_EMAIL} is not active`);
  }
  console.log(`Reassign target: ${reassignTarget.name} (id=${reassignTarget.id})\n`);

  const inactive = await prisma.user.findMany({
    where: { active: 0 },
    select: {
      id: true,
      email: true,
      name: true,
      supabaseId: true,
      _count: {
        select: {
          contingencies: true,
          contingencyComments: true,
          contingencyAttachments: true,
          auditLogs: true,
          plantPermissions: true,
          portfolioPermissions: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  if (inactive.length === 0) {
    console.log("No inactive users found. Nothing to do.\n");
    return;
  }

  console.log(`Found ${inactive.length} inactive user(s):\n`);
  let totalReassigns = 0;
  for (const u of inactive) {
    const r =
      u._count.contingencies +
      u._count.contingencyComments +
      u._count.contingencyAttachments +
      u._count.auditLogs;
    totalReassigns += r;
    console.log(
      `  #${u.id.toString().padStart(4)}  ${u.email.padEnd(40)}  ` +
        `cont=${u._count.contingencies} com=${u._count.contingencyComments} ` +
        `att=${u._count.contingencyAttachments} audit=${u._count.auditLogs} ` +
        `plantPerm=${u._count.plantPermissions} portPerm=${u._count.portfolioPermissions}`
    );
  }
  console.log(`\nTotal rows to reassign: ${totalReassigns}`);
  console.log(
    `Plant/portfolio permissions will CASCADE-delete automatically.\n`
  );

  const missingSupabaseId = inactive.filter((u) => !u.supabaseId).length;
  if (missingSupabaseId > 0) {
    console.log(`WARN: ${missingSupabaseId} user(s) have no supabaseId — cannot remove from Supabase Auth.\n`);
  }

  if (!EXECUTE) {
    console.log("DRY RUN — no changes made. Re-run with --execute to apply.\n");
    return;
  }

  console.log("Executing...\n");
  const supabaseAdmin = createAdminClient();

  let ok = 0;
  let fail = 0;
  for (const u of inactive) {
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.contingency.updateMany({
            where: { createdById: u.id },
            data: { createdById: reassignTarget.id },
          });
          await tx.contingencyComment.updateMany({
            where: { userId: u.id },
            data: { userId: reassignTarget.id },
          });
          await tx.contingencyAttachment.updateMany({
            where: { userId: u.id },
            data: { userId: reassignTarget.id },
          });
          await tx.auditLog.updateMany({
            where: { userId: u.id },
            data: { userId: reassignTarget.id },
          });
          await tx.user.delete({ where: { id: u.id } });
        },
        { timeout: 20000, maxWait: 10000 }
      );

      if (u.supabaseId) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(u.supabaseId);
        if (error) {
          console.log(`#${u.id} ${u.email} — DB ok, Supabase FAILED: ${error.message}`);
        } else {
          console.log(`#${u.id} ${u.email} — ok`);
        }
      } else {
        console.log(`#${u.id} ${u.email} — ok (no supabaseId)`);
      }
      ok++;
    } catch (err) {
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`#${u.id} ${u.email} — FAILED: ${msg.split("\n")[0]}`);
    }
  }

  console.log(`\nDone. Success: ${ok} — Failed: ${fail} (re-run to retry failures).\n`);
}

main()
  .catch((err) => {
    console.error("ERROR:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
