import { redirect } from "next/navigation";

// Root redirects straight to the home dashboard
export default function RootPage() {
  redirect("/home");
}
