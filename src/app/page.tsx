import { redirect } from "next/navigation";

export default function Home() {
  redirect("/wods");
  return null;
}
