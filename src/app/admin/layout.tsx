import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constanta";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin-login");
  if (!(session.user.role.role == ROLES[0].value || session.user.role.id == ROLES[0].id)) redirect("/");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
      <AdminSidebar />
      <main className="flex-1 ml-60 p-6 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
