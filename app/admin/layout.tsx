import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import SignOutButton from "./_components/SignOutButton";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <>
      {children}
      <SignOutButton />
    </>
  );
}
