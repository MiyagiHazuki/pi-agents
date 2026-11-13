/**
 * Live top-level pi-subagents tasks in Atelier's sidebar (Atelier 0.18+, Subagents 0.23).
 * Global install: ~/.pi/agent/extensions/subagent-sidebar.ts, then /reload.
 * Layout/visibility live in ~/.pi/agent/pi-atelier.json, not in this extension.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { replaceControlCharacters, stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import {
  registerSidebarPanel,
  type SidebarPanelContribution,
  type SidebarPanelKeyValueRow,
  type SidebarPanelRole,
} from "../npm/node_modules/pi-atelier/extensions/index.ts";

const PANEL_ID = "subagents:live";
const MANAGER_KEY = Symbol.for("pi-subagents:manager");
const KEEP_FINISHED_MS = 12_000;
// Atelier drops an entire contributed panel if its total height exceeds remaining dock space.
// Capping content at 5 rows (8 rows with borders) guarantees visibility even when ACTIVITY expands:
// - 1..2 agents render in 2-row detail mode (max 1 + 2*2 = 5 rows)
// - 3..4 agents render in 1-row compact mode (max 1 + 4*1 = 5 rows)
// - 5+ agents render 3 compact rows + 1 overflow row (1 + 3 + 1 = 5 rows)
const COMPACT_THRESHOLD = 3;
const RIGHT_COLUMN_BUDGET = 24;

type Status = "queued" | "running" | "completed" | "steered" | "aborted" | "stopped" | "error";
interface AgentView {
  id: string;
  type: string;
  description: string;
  status: Status;
  startedAt: number;
  completedAt?: number;
  toolUses?: number;
}
interface ManagerRegistry {
  getRecord(id: string): Partial<AgentView> | undefined;
}

type Payload = Record<string, unknown> & { id: string };
const active = (status: Status): boolean => status === "queued" || status === "running";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const statuses = new Set<string>(["queued", "running", "completed", "steered", "aborted", "stopped", "error"]);
const clean = (value: string, max = 160): string =>
  Array.from(replaceControlCharacters(stripTerminalSequences(value.slice(0, 1280))).replace(/\s+/g, " ").trim())
    .slice(0, max).join("");
const clipColumns = (value: string, maxCols: number): string => {
  const text = clean(value);
  if (visibleWidth(text) <= maxCols) return text;
  let out = "";
  for (const ch of text) {
    if (visibleWidth(`${out}${ch}…`) > maxCols) break;
    out += ch;
  }
  return `${out}…`;
};
const duration = (ms: number): string => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes}m${seconds % 60}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours}h${minutes % 60}m` : `${hours}h`;
};
const badge: Record<Status, { icon: string; text: string; role: SidebarPanelRole }> = {
  running: { icon: "●", text: "running", role: "working" },
  queued: { icon: "◌", text: "queued", role: "caution" },
  completed: { icon: "✓", text: "done", role: "success" },
  steered: { icon: "↻", text: "steered", role: "accent" },
  aborted: { icon: "■", text: "aborted", role: "warning" },
  stopped: { icon: "■", text: "stopped", role: "warning" },
  error: { icon: "✕", text: "failed", role: "error" },
};

export default function (pi: ExtensionAPI) {
  const agents = new Map<string, AgentView>();
  let panel: ReturnType<typeof registerSidebarPanel> | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let subscriptions: (() => void)[] = [];
  let lastPayload = "";

  // The documented registry supplies tool counts absent from lifecycle events.
  // Copy only display fields; never mutate the manager's records or sessions.
  const sync = (agent: AgentView): void => {
    const registry = (globalThis as typeof globalThis & { [MANAGER_KEY]?: ManagerRegistry })[MANAGER_KEY];
    const record = typeof registry?.getRecord === "function" ? registry.getRecord(agent.id) : undefined;
    if (!record) return;
    if (typeof record.type === "string") agent.type = clean(record.type);
    if (typeof record.description === "string") agent.description = clean(record.description);
    if (typeof record.status === "string" && statuses.has(record.status)) agent.status = record.status;
    if (finite(record.startedAt)) agent.startedAt = record.startedAt;
    if (finite(record.completedAt)) agent.completedAt = record.completedAt;
    if (finite(record.toolUses)) agent.toolUses = Math.max(0, Math.floor(record.toolUses));
    if (!active(agent.status)) agent.completedAt ??= Date.now();
  };

  const contribution = (): SidebarPanelContribution => {
    const now = Date.now();
    const all = [...agents.values()];
    const rank = (agent: AgentView): number => agent.status === "running" ? 0 : agent.status === "queued" ? 1 : 2;
    all.sort((a, b) => rank(a) - rank(b) || (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt));
    const compact = all.length >= COMPACT_THRESHOLD;
    const maxVisible = !compact ? 2 : all.length > 4 ? 3 : 4;
    const visible = all.slice(0, maxVisible);
    const counts = { run: 0, queue: 0, done: 0, fail: 0 };
    for (const agent of all) {
      if (agent.status === "running") counts.run += 1;
      else if (agent.status === "queued") counts.queue += 1;
      else if (agent.status === "completed" || agent.status === "steered") counts.done += 1;
      else counts.fail += 1;
    }
    const live = counts.run + counts.queue;
    const summary = [
      counts.run ? `${counts.run} run` : "",
      counts.queue ? `${counts.queue} queue` : "",
      counts.done ? `${counts.done} done` : "",
      counts.fail ? `${counts.fail} fail` : "",
    ].filter(Boolean).join(" · ") || "recent";
    const keyValues: SidebarPanelKeyValueRow[] = all.length
      ? [{
          label: live ? `${live} live` : `${all.length} recent`,
          value: summary,
          labelRole: live ? "primary" : "muted",
          valueRole: counts.fail ? "error" : counts.run ? "working" : counts.queue ? "caution" : "success",
          ...(live ? { progress: counts.run / live } : {}),
        }]
      : [{ label: "◌ idle", value: "No active subagents", labelRole: "dim", valueRole: "dim" }];
    for (const agent of visible) {
      const info = badge[agent.status];
      const elapsed = duration((agent.completedAt ?? now) - agent.startedAt);
      const label = clipColumns(`${info.icon} ${agent.type || "agent"}`, 12);
      if (compact) {
        const tools = agent.toolUses === undefined ? "…" : `${agent.toolUses}t`;
        const meta = `${elapsed}·${tools}`;
        const desc = clipColumns(agent.description || info.text, Math.max(8, RIGHT_COLUMN_BUDGET - visibleWidth(meta) - 1));
        keyValues.push({
          label,
          value: `${desc} ${meta}`,
          labelRole: info.role,
          valueRole: active(agent.status) ? "primary" : "dim",
        });
      } else {
        const tools = agent.toolUses === undefined ? "… tools" : `${agent.toolUses} ${agent.toolUses === 1 ? "tool" : "tools"}`;
        keyValues.push(
          {
            label,
            value: agent.description || "(unnamed task)",
            labelRole: info.role,
            valueRole: active(agent.status) ? "primary" : "muted",
          },
          {
            label: `↳ ${info.text}`,
            value: `${elapsed} · ${tools}`,
            labelRole: active(agent.status) ? info.role : "dim",
            valueRole: "dim",
          },
        );
      }
    }
    if (all.length > visible.length) {
      keyValues.push({
        label: `… +${all.length - visible.length} more`,
        value: `${all.length} total · /agents`,
        labelRole: "caution",
        valueRole: "dim",
      });
    }
    return {
      id: PANEL_ID,
      title: "SUBAGENTS LIVE",
      role: counts.fail ? "error" : counts.run ? "working" : counts.queue ? "caution" : "output",
      rows: keyValues.map((row) => ({ text: clean(`${row.label} ${row.value}`), role: row.valueRole })),
      keyValues,
    };
  };

  const stopTimer = (): void => {
    if (timer) clearInterval(timer);
    timer = undefined;
  };
  const refresh = (): void => {
    if (!panel) return;
    const now = Date.now();
    for (const [id, agent] of agents) {
      sync(agent);
      if (agent.completedAt !== undefined && now - agent.completedAt >= KEEP_FINISHED_MS) agents.delete(id);
    }
    const next = contribution();
    const serialized = JSON.stringify(next);
    if (serialized !== lastPayload) {
      lastPayload = serialized;
      panel.update(next);
    }
    if (!agents.size) stopTimer();
  };

  const update = (data: unknown, kind: "created" | "started" | "completed" | "failed"): void => {
    if (!panel || !data || typeof data !== "object") return;
    const event = data as Payload;
    if (typeof event.id !== "string" || !event.id || event.parentAgentId !== undefined || event.workflowId !== undefined) return;
    const now = Date.now();
    const previous = agents.get(event.id);
    const agent: AgentView = previous ?? {
      id: event.id,
      type: typeof event.type === "string" ? clean(event.type) : "Agent",
      description: typeof event.description === "string" ? clean(event.description) : "",
      status: kind === "created" ? "queued" : "running",
      startedAt: now,
    };
    if (typeof event.type === "string") agent.type = clean(event.type);
    if (typeof event.description === "string") agent.description = clean(event.description);
    // created can arrive AFTER started on immediate spawns, resumes and handoffs.
    if (kind === "started") {
      agent.status = "running";
      agent.startedAt = now;
      agent.completedAt = undefined;
      agent.toolUses = undefined;
    } else if (kind === "completed" || kind === "failed") {
      agent.status = typeof event.status === "string" && statuses.has(event.status)
        ? event.status as Status : kind === "failed" ? "error" : "completed";
      agent.completedAt = now;
      if (finite(event.durationMs)) agent.startedAt = now - Math.max(0, event.durationMs);
      if (finite(event.toolUses)) agent.toolUses = Math.max(0, Math.floor(event.toolUses));
    }
    agents.set(agent.id, agent);
    refresh();
    if (agents.size && !timer) {
      timer = setInterval(refresh, 1000);
      timer.unref();
    }
  };

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui" || !ctx.hasUI || panel) return;
    panel = registerSidebarPanel(pi, contribution(), { source: "local-subagent-sidebar" });
    lastPayload = JSON.stringify(contribution());
    for (const kind of ["created", "started", "completed", "failed"] as const) {
      subscriptions.push(pi.events.on(`subagents:${kind}`, (data) => update(data, kind)));
    }
    subscriptions.push(pi.events.on("subagents:disposed", () => {
      agents.clear();
      stopTimer();
      refresh();
    }));
  });

  pi.on("session_shutdown", () => {
    stopTimer();
    for (const unsubscribe of subscriptions) unsubscribe();
    subscriptions = [];
    panel?.dispose();
    panel = undefined;
    agents.clear();
    lastPayload = "";
  });
}
