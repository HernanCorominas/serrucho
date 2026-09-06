import { redirect } from "next/navigation";

export default async function KittyShortPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const query = new URLSearchParams();
  Object.entries(sp).forEach(([key, val]) => {
    if (typeof val === "string") query.set(key, val);
  });

  const queryString = query.toString();
  redirect(`/dashboard/${id}${queryString ? `?${queryString}` : ""}`);
}
