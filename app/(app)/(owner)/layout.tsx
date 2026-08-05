import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user.role !== "OWNER") {
    redirect("/pos");
  }
  return <>{children}</>;
}
