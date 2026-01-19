import { redirect } from "next/navigation";

export default function Home() {
  // In production, this would check auth status
  // For now, redirect to login
  redirect("/login");
}
