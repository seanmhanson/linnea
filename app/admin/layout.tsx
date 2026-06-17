import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import SignOutButton from "./_components/SignOutButton";
import styles from "./layout.module.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }

  return (
    <div className={styles.admin}>
      {children}
      <SignOutButton />
    </div>
  );
}
