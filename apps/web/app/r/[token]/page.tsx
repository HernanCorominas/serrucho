import { notFound, redirect } from "next/navigation";
import { SerruchoService } from "@/features/serruchos/service";

interface ReadOnlyRedirectPageProps {
  params: Promise<{ token: string }>;
}

export default async function ReadOnlyRedirectPage({ params }: ReadOnlyRedirectPageProps) {
  const { token } = await params;
  if (!token) notFound();

  const serrucho = await SerruchoService.getByReadOnlyToken(token);
  if (!serrucho) notFound();

  redirect(`/dashboard/${serrucho.id}?ro=${encodeURIComponent(token)}`);
}
