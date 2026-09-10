import type { Reminder, ReminderSettings } from "@adobos/shared";
import {
  deleteReminder,
  fetchReminders,
  saveReminderSettings,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ToastBanner } from "@/components/ui/toast";
import { TimezoneCombobox } from "@/features/scheduled-messages/TimezoneCombobox";
import { queryKeys } from "@/lib/query/keys";
import { useGuildQuery } from "@/lib/query/useGuildQuery";
import { useForm } from "@tanstack/react-form";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

function formatDue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export function RemindersDashboard() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [rows, setRows] = useState<Reminder[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const query = useGuildQuery(queryKeys.reminders, fetchReminders);
  const loading = query.isPending;

  const form = useForm({
    defaultValues: {
      timezone: "UTC",
      enabled: true,
    },
    onSubmit: async ({ value }) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        const next = await saveReminderSettings({
          timezone: value.timezone,
          enabled: value.enabled,
        });
        setSettings(next);
        form.reset({ timezone: next.timezone, enabled: next.enabled });
        setSuccess("Settings saved.");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Couldn't save.");
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    if (!query.data) return;
    setSettings(query.data.settings);
    setRows(query.data.reminders);
    form.reset({
      timezone: query.data.settings.timezone,
      enabled: query.data.settings.enabled,
    });
    setError(null);
  }, [query.data]);

  useEffect(() => {
    if (query.isError) {
      setError(
        query.error instanceof Error ? query.error.message : "Couldn't load.",
      );
    }
  }, [query.isError, query.error]);

  async function onDelete(id: number): Promise<void> {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteReminder(id);
      setSuccess(`Cancelled #${id}.`);
      await query.refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't cancel.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !settings) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Loading reminders…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastBanner
        variant="error"
        message={error}
        onDismiss={() => setError(null)}
      />
      <ToastBanner
        variant="success"
        message={success}
        onDismiss={() => setSuccess(null)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Personal reminders</CardTitle>
          <CardDescription>
            Members use <code>/remind in</code> or <code>/remind at</code>. The
            bot notifies by DM; if DMs are closed, it mentions them in the
            channel. It does not post announcements — that's Scheduled Messages.
            Pending: {rows.length}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field name="enabled">
              {(field) => (
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                  Enabled
                </label>
              )}
            </form.Field>
            <form.Field name="timezone">
              {(field) => (
                <TimezoneCombobox
                  value={field.state.value}
                  onChange={(timezone) => field.handleChange(timezone)}
                />
              )}
            </form.Field>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <CardDescription>
            Staff can cancel any of them. The owner uses{" "}
            <code>/remind cancel</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody has a pending reminder.
            </p>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border/80 px-3 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    #{row.id} · {formatDue(row.dueAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    User {row.userId}
                  </p>
                  <p className="text-sm break-words">{row.message}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void onDelete(row.id)}
                >
                  <Trash2 className="size-4" />
                  Cancel
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
