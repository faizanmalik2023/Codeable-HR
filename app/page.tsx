import { redirect } from "next/navigation";

export default function Home() {
  // Session lives in localStorage, so the server can't tell if you're signed in.
  // Send everyone to the guarded shell and let AuthGuard decide: signed in →
  // through, signed out → /login. Redirecting straight to /login here logged out
  // anyone who opened the bare domain in a new tab.
  redirect("/dashboard");
}
