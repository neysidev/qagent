import { redirect } from "next/navigation";

/** The composer lives on the home page now. */
export default function NewTaskPage() {
  redirect("/dashboard");
}
