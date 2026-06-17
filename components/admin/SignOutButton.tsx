import { signOut } from "@/auth";
import styles from "./SignOutButton.module.scss";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/api/auth/signin" });
      }}
    >
      <button className={styles["sign-out-button"]} type="submit">
        Sign out
      </button>
    </form>
  );
}
