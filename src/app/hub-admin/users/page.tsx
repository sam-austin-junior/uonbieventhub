import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { registrations: true, organizedEvents: true } } },
  });

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">All users</h1>
        <p className="text-sm text-ink-500 mt-1">
          {users.length} user{users.length === 1 ? "" : "s"} across the platform.
        </p>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Joined</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Events</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-ink-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.avatarUrl} size={32} />
                    <div>
                      <div className="font-medium text-ink-900">{u.name}</div>
                      <div className="text-xs text-ink-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={
                    u.role === "SUPERADMIN" ? "badge-accent" :
                    u.role === "ORGANIZER" || u.role === "ADMIN" ? "badge-brand" :
                    "badge-gray"
                  }>
                    {u.role.toLowerCase()}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                <td className="px-5 py-3">
                  {u.activatedAt ? <span className="badge-green">Active</span> : <span className="badge bg-amber-100 text-amber-700">Pending</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  {u.role === "ORGANIZER" ? u._count.organizedEvents : u._count.registrations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
