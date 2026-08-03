import { redirect } from "next/navigation";

export default function PlansRedirectPage() {
  redirect("/billing/plans");
}
