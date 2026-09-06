import { getRepository } from "@/lib/store";

export class ReadOnlyPermissionError extends Error {
  constructor(
    message = "Acceso de solo lectura: no tienes permisos para crear, modificar o eliminar registros en este serrucho."
  ) {
    super(message);
    this.name = "ReadOnlyPermissionError";
  }
}

/**
 * Checks whether a given token is a read-only token for the specified serrucho.
 */
export async function isReadOnlyToken(
  serruchoId: string,
  tokenCandidate?: string | null
): Promise<boolean> {
  if (!tokenCandidate || tokenCandidate.trim().length === 0) return false;
  const repo = getRepository();
  const serrucho = await repo.getSerruchoById(serruchoId);
  if (!serrucho || !serrucho.read_only_token) return false;
  return serrucho.read_only_token === tokenCandidate.trim();
}

/**
 * Asserts write permission for an API request targeting a specific serrucho.
 * Inspects headers, query params and body for read-only tokens.
 * Throws ReadOnlyPermissionError if the request is in read-only mode.
 */
export async function assertWritePermission(
  serruchoId: string,
  req: Request | { headers: Headers | { get(name: string): string | null }; url: string }
): Promise<void> {
  // Check headers
  const headerToken =
    req.headers.get("x-read-only-token") ||
    req.headers.get("x-ro-token") ||
    req.headers.get("x-serrucho-token");

  // Check URL search params
  const url = new URL(req.url);
  const queryToken =
    url.searchParams.get("ro") ||
    url.searchParams.get("ro_token") ||
    url.searchParams.get("token");
  const isExplicitReadOnly =
    url.searchParams.get("readonly") === "true" ||
    url.searchParams.get("readonly") === "1";

  if (isExplicitReadOnly) {
    throw new ReadOnlyPermissionError();
  }

  const tokenToCheck = headerToken || queryToken;
  if (tokenToCheck) {
    const isReadOnly = await isReadOnlyToken(serruchoId, tokenToCheck);
    if (isReadOnly) {
      throw new ReadOnlyPermissionError();
    }
  }
}

/**
 * Handles API errors, returning a 403 Forbidden for ReadOnlyPermissionError.
 */
export function handleApiError(err: any): Response {
  if (err instanceof ReadOnlyPermissionError || err.name === "ReadOnlyPermissionError") {
    return Response.json({ error: err.message }, { status: 403 });
  }
  return Response.json({ error: err.message || "Error interno del servidor" }, { status: 400 });
}
