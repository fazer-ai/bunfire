import { Loader2, Search, Shield, ShieldOff, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card } from "@/client/components";
import { useToast } from "@/client/components/Toast";
import { useAuth } from "@/client/contexts/AuthContext";
import { api } from "@/client/lib/api";
import { cn, formatDate } from "@/client/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface AdminStats {
  totalUsers: number;
  adminCount: number;
}

export function AdminPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const { data } = await api.api.admin.stats.get();
    if (data?.stats) {
      setStats(data.stats);
    }
  }, []);

  const fetchUsers = useCallback(async (pageNum = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const { data } = await api.api.admin.users.get({
        query: {
          page: String(pageNum),
          search: searchQuery || undefined,
        },
      });
      if (data) {
        setUsers(data.users as AdminUser[]);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [fetchStats, fetchUsers]);

  const handleSearch = () => {
    fetchUsers(1, search);
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const { data, error } = await api.api.admin
      .users({ id: user.id })
      .role.patch({
        role: newRole,
      });

    if (error) {
      showToast(t("admin.roleUpdateFailed", "Failed to update role"), "error");
      return;
    }

    if (data?.user) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, role: data.user.role } : u,
        ),
      );
      showToast(
        t("admin.roleUpdated", "Role updated to {{role}}", {
          role: newRole,
        }),
        "success",
      );
      fetchStats();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">
        {t("admin.title", "Admin Panel")}
      </h1>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {stats.totalUsers}
              </p>
              <p className="text-sm text-text-secondary">
                {t("admin.totalUsers", "Total Users")}
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {stats.adminCount}
              </p>
              <p className="text-sm text-text-secondary">
                {t("admin.admins", "Admins")}
              </p>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("admin.searchUsers", "Search users by email...")}
              className="w-full bg-bg-tertiary border border-border rounded-lg pl-10 pr-4 py-2 text-text-primary placeholder-text-placeholder focus:outline-none focus:border-border-focus"
            />
          </div>
          <Button size="sm" onClick={handleSearch}>
            {t("common.search", "Search")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 px-2 text-text-secondary font-medium">
                      {t("admin.email", "Email")}
                    </th>
                    <th className="py-3 px-2 text-text-secondary font-medium">
                      {t("admin.name", "Name")}
                    </th>
                    <th className="py-3 px-2 text-text-secondary font-medium">
                      {t("admin.role", "Role")}
                    </th>
                    <th className="py-3 px-2 text-text-secondary font-medium">
                      {t("admin.createdAt", "Created")}
                    </th>
                    <th className="py-3 px-2 text-text-secondary font-medium">
                      {t("admin.lastLogin", "Last Login")}
                    </th>
                    <th className="py-3 px-2 text-text-secondary font-medium">
                      {t("admin.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-bg-tertiary/50"
                    >
                      <td className="py-3 px-2 text-text-primary">
                        {user.email}
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {user.name || "-"}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "warning" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          type="button"
                          onClick={() => handleToggleRole(user)}
                          disabled={
                            user.id === currentUser?.id && user.role === "ADMIN"
                          }
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border border-border rounded transition-colors",
                            {
                              "text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-hover cursor-pointer":
                                !(
                                  user.id === currentUser?.id &&
                                  user.role === "ADMIN"
                                ),
                              "text-text-muted bg-bg-tertiary opacity-50 cursor-not-allowed":
                                user.id === currentUser?.id &&
                                user.role === "ADMIN",
                            },
                          )}
                          title={
                            user.id === currentUser?.id && user.role === "ADMIN"
                              ? t(
                                  "admin.cannotDemoteSelf",
                                  "Cannot demote yourself",
                                )
                              : user.role === "ADMIN"
                                ? t("admin.demote", "Demote to User")
                                : t("admin.promote", "Promote to Admin")
                          }
                        >
                          {user.role === "ADMIN" ? (
                            <>
                              <ShieldOff className="w-3 h-3" />
                              {t("admin.demote", "Demote")}
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3" />
                              {t("admin.promote", "Promote")}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchUsers(page - 1, search)}
                >
                  {t("common.previous", "Previous")}
                </Button>
                <span className="flex items-center text-sm text-text-secondary px-3">
                  {t("common.pageOf", "{{page}} of {{total}}", {
                    page,
                    total: totalPages,
                  })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchUsers(page + 1, search)}
                >
                  {t("common.next", "Next")}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
