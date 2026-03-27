import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("Seeding database...");

  // 1. Portfolios
  await prisma.portfolio.createMany({
    data: [
      { name: "S-Invest Chile", description: "Portafolio principal" },
      { name: "S-Invest 3", description: "Portafolio S-Invest 3" },
      { name: "S-Invest 4", description: "Portafolio S-Invest 4" },
    ],
    skipDuplicates: true,
  });
  console.log("Portfolios created");

  // 2. Placeholder customer (will be overwritten by import scripts)
  await prisma.customer.upsert({
    where: { rut: "00000000-0" },
    update: {},
    create: { rut: "00000000-0", name: "Sin asignar" },
  });
  console.log("Placeholder customer created");

  // 3. Maestro user
  const maestroEmail = "nicoaguirrealende@gmail.com";
  const maestroPassword = "12345678";

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  let maestroAuthId: string;

  const existingMaestro = existingUsers?.users?.find((u) => u.email === maestroEmail);

  if (existingMaestro) {
    maestroAuthId = existingMaestro.id;
    console.log("Maestro auth user already exists");
  } else {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: maestroEmail,
      password: maestroPassword,
      email_confirm: true,
    });
    if (authError) throw authError;
    maestroAuthId = authData.user.id;
    console.log("Maestro auth user created");
  }

  await prisma.user.upsert({
    where: { email: maestroEmail },
    update: { supabaseId: maestroAuthId },
    create: {
      supabaseId: maestroAuthId,
      email: maestroEmail,
      name: "Admin Solar",
      role: "MAESTRO",
    },
  });
  console.log("Maestro user ready");

  console.log("\nSeed complete!");
  console.log("─────────────────────────────────");
  console.log("Maestro login:");
  console.log(`  Email:    ${maestroEmail}`);
  console.log(`  Password: ${maestroPassword}`);
  console.log("─────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
