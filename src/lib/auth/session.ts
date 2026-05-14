import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

// React.cache deduplicates this across layout + page within the same render,
// preventing concurrent supabase.auth.getUser() calls that trigger token
// rotation race conditions.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseId: authUser.id, active: 1 },
  });

  return user;
});
