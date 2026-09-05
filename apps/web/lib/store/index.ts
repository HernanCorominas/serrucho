import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ISerruchoRepository } from "./repository";
import { MemorySerruchoRepository } from "./memory-repository";
import { SupabaseSerruchoRepository } from "./supabase-repository";

const globalForRepo = globalThis as unknown as {
  __SERRUCHO_REPO_INSTANCE__: ISerruchoRepository | undefined;
};

export function getRepository(): ISerruchoRepository {
  if (globalForRepo.__SERRUCHO_REPO_INSTANCE__) {
    return globalForRepo.__SERRUCHO_REPO_INSTANCE__;
  }

  const useMemoryStore =
    process.env.USE_MEMORY_STORE === "true" ||
    process.env.NEXT_PUBLIC_USE_MEMORY === "true" ||
    process.env.NODE_ENV === "test";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let instance: ISerruchoRepository;
  if (!useMemoryStore && supabaseUrl && serviceKey && supabaseUrl.startsWith("http")) {
    const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    instance = new SupabaseSerruchoRepository(supabase);
  } else {
    instance = new MemorySerruchoRepository();
  }

  globalForRepo.__SERRUCHO_REPO_INSTANCE__ = instance;
  return instance;
}

export function setRepository(repo: ISerruchoRepository | null) {
  globalForRepo.__SERRUCHO_REPO_INSTANCE__ = repo || undefined;
}
