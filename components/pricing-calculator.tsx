"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Trash2 } from "lucide-react";
import CreatableSelect from "react-select/creatable";
import type { StylesConfig } from "react-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { priceUsage } from "@/lib/pricing";
import type { SavedForm, SavedRow } from "@/lib/saved-form";
import { MermaidDiagram } from "@/components/mermaid-diagram";

type NamedRow = {
  id: string;
  name: string;
  placeholder: string;
  records: string;
  generatedFor?: string;
  linkedProjectId?: string;
  generatedName?: string;
  generatedRecords?: string;
  generatedAutomationFor?: string;
  linkedAutomationId?: string;
  generatedAutomationName?: string;
  generatedAutomationRecords?: string;
  description?: string;
  diagram?: string;
  bubbleColor?: string;
  generating?: boolean;
  revealing?: boolean;
};

type KnownApp = {
  name: string;
  logo_url: string;
};

type SourceOption = {
  value: string;
  label: string;
  logoUrl?: string;
};

const appsUrl = "https://app.askgrapple.com/api/public/apps";

const starterSources: NamedRow[] = [
  {
    id: "source-1",
    name: "Salesforce",
    placeholder: "Source name",
    records: "",
  },
  { id: "source-2", name: "Stripe", placeholder: "Source name", records: "" },
  {
    id: "source-3",
    name: "Quickbooks",
    placeholder: "Source name",
    records: "",
  },
];

const starterProjects: NamedRow[] = [
  { id: "project-1", name: "", placeholder: "Project name", records: "" },
];

const starterAutomations: NamedRow[] = [
  {
    id: "automation-1",
    name: "",
    placeholder: "Automation name",
    records: "",
  },
];

const bubbleColors = [
  "bg-rose-100 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100",
  "bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100",
  "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100",
  "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100",
  "bg-violet-100 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100",
  "bg-orange-100 text-orange-950 dark:bg-orange-950/50 dark:text-orange-100",
  "bg-teal-100 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100",
  "bg-fuchsia-100 text-fuchsia-950 dark:bg-fuchsia-950/50 dark:text-fuchsia-100",
  "bg-indigo-100 text-indigo-950 dark:bg-indigo-950/50 dark:text-indigo-100",
  "bg-lime-100 text-lime-950 dark:bg-lime-950/50 dark:text-lime-100",
];

function randomBubbleColor() {
  return bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
}

const countFormat = new Intl.NumberFormat("en-US");
const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function decimalInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) {
    return cleaned;
  }

  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
}

function optionForName(options: SourceOption[], name: string) {
  const trimmed = name.trim();
  if (trimmed === "") {
    return null;
  }

  const needle = trimmed.toLowerCase();
  for (const option of options) {
    if (option.label.toLowerCase() === needle) {
      return option;
    }
  }

  return { value: trimmed, label: name };
}

function AppLogo({ src }: { src: string }) {
  return (
    // Logos include SVG files, which next/image will not render.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className="size-4 shrink-0"
    />
  );
}

const sourceSelectStyles: StylesConfig<SourceOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "2rem",
    height: "2rem",
    borderRadius: "var(--radius-lg)",
    borderColor: state.isFocused ? "var(--ring)" : "var(--input)",
    backgroundColor: "transparent",
    boxShadow: state.isFocused
      ? "0 0 0 3px color-mix(in oklch, var(--ring) 50%, transparent)"
      : "none",
    fontSize: "0.875rem",
    "&:hover": {
      borderColor: state.isFocused ? "var(--ring)" : "var(--input)",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 0.5rem",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "2rem",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "0 0.375rem",
    color: "var(--muted-foreground)",
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "0 0.125rem",
    color: "var(--muted-foreground)",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--muted-foreground)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--foreground)",
  }),
  input: (base) => ({
    ...base,
    color: "var(--foreground)",
    margin: 0,
    padding: 0,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: state.isFocused ? "var(--accent)" : "transparent",
    color: "var(--foreground)",
  }),
};

function GeneratedReply({
  description,
  diagram,
  bubbleColor,
}: {
  description: string;
  diagram?: string;
  bubbleColor?: string;
}) {
  return (
    <>
      <p
        className={`relative ml-1 mt-2.5 w-fit max-w-full rounded-2xl px-3 py-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 ${bubbleColor}`}
      >
        <span
          aria-hidden
          className="absolute -top-2.5 left-4 h-3.5 w-5 bg-inherit [clip-path:path('M_0_14_L_9_1.5_Q_10_0_11_1.5_L_20_14_Z')]"
        />
        “{description}”
      </p>
      {diagram ? <MermaidDiagram chart={diagram} /> : null}
    </>
  );
}

function GeneratingHint({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center gap-1.5 text-sm">
      <span className="ai-spark" aria-hidden>
        ✦
      </span>
      <span className="ai-shimmer-text">{label}</span>
      <span className="ai-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

function EstimateHint({ label, hint }: { label: string; hint: string }) {
  return (
    <dt className="flex items-center gap-1 text-muted-foreground">
      {label}
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label={`About ${label}`}
          className="text-muted-foreground"
        >
          <Info className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    </dt>
  );
}

function RecordsField({
  id,
  value,
  onChange,
  label = "Records",
  unitHint = "Pricing is per million records",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  unitHint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative w-32">
        <Input
          id={id}
          inputMode="numeric"
          value={value}
          placeholder="0"
          className="pr-20"
          aria-describedby={`${id}-unit`}
          onChange={(event) => {
            onChange(decimalInput(event.target.value));
          }}
        />
        <Tooltip>
          <TooltipTrigger
            id={`${id}-unit`}
            type="button"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground"
          >
            Million
          </TooltipTrigger>
          <TooltipContent>{unitHint}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function hasRealRecordCount(records: string) {
  const trimmed = records.trim();
  if (trimmed === "" || trimmed === "0") {
    return false;
  }

  return parseCount(trimmed) > 0;
}

function parseCount(value: string) {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function savedRow(row: NamedRow): SavedRow {
  const saved: SavedRow = {
    id: row.id,
    name: row.name,
    placeholder: row.placeholder,
    records: row.records,
  };
  if (row.generatedFor) {
    saved.generatedFor = row.generatedFor;
  }
  if (row.linkedProjectId) {
    saved.linkedProjectId = row.linkedProjectId;
  }
  if (row.generatedName) {
    saved.generatedName = row.generatedName;
  }
  if (row.generatedRecords) {
    saved.generatedRecords = row.generatedRecords;
  }
  if (row.generatedAutomationFor) {
    saved.generatedAutomationFor = row.generatedAutomationFor;
  }
  if (row.linkedAutomationId) {
    saved.linkedAutomationId = row.linkedAutomationId;
  }
  if (row.generatedAutomationName) {
    saved.generatedAutomationName = row.generatedAutomationName;
  }
  if (row.generatedAutomationRecords) {
    saved.generatedAutomationRecords = row.generatedAutomationRecords;
  }
  if (row.description) {
    saved.description = row.description;
  }
  if (row.diagram) {
    saved.diagram = row.diagram;
  }
  if (row.bubbleColor) {
    saved.bubbleColor = row.bubbleColor;
  }
  return saved;
}

function toSavedForm(
  sources: NamedRow[],
  projects: NamedRow[],
  automations: NamedRow[],
  nextSourceId: number,
  nextProjectId: number,
  nextAutomationId: number,
): SavedForm {
  return {
    sources: sources.map(savedRow),
    projects: projects.map(savedRow),
    automations: automations.map(savedRow),
    nextSourceId,
    nextProjectId,
    nextAutomationId,
  };
}

const starterForm = toSavedForm(
  starterSources,
  starterProjects,
  starterAutomations,
  starterSources.length + 1,
  starterProjects.length + 1,
  starterAutomations.length + 1,
);

function sameForm(left: SavedForm, right: SavedForm) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function fifthOfRecords(records: string) {
  const amount = parseCount(records) / 5;
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0";
  }

  return String(Math.round(amount * 1000) / 1000);
}

export function PricingCalculator({
  quoteId,
  initialForm,
}: {
  quoteId?: string;
  initialForm?: SavedForm;
}) {
  const [sources, setSources] = useState<NamedRow[]>(
    initialForm ? initialForm.sources : starterSources,
  );
  const [nextSourceId, setNextSourceId] = useState(
    initialForm ? initialForm.nextSourceId : starterSources.length + 1,
  );
  const [projects, setProjects] = useState<NamedRow[]>(
    initialForm ? initialForm.projects : starterProjects,
  );
  const [nextProjectId, setNextProjectId] = useState(
    initialForm ? initialForm.nextProjectId : starterProjects.length + 1,
  );
  const [automations, setAutomations] = useState<NamedRow[]>(
    initialForm ? initialForm.automations : starterAutomations,
  );
  const [nextAutomationId, setNextAutomationId] = useState(
    initialForm
      ? initialForm.nextAutomationId
      : starterAutomations.length + 1,
  );
  const sourcesRef = useRef(sources);
  const projectsRef = useRef(projects);
  const automationsRef = useRef(automations);
  const nextProjectIdRef = useRef(nextProjectId);
  const nextAutomationIdRef = useRef(nextAutomationId);
  const quoteIdRef = useRef(quoteId ? quoteId : "");
  const latestForm = useRef<SavedForm | null>(null);
  const saveTimer = useRef<number | null>(null);
  const pendingWrite = useRef<Promise<void> | null>(null);
  const hydrating = useRef(true);
  const focusNameId = useRef<string | null>(null);
  const requestedProjectNames = useRef(new Set<string>());
  const [apps, setApps] = useState<KnownApp[]>([]);
  const sourceOptions = useMemo<SourceOption[]>(
    () =>
      apps.map((app) => ({
        value: app.name,
        label: app.name,
        logoUrl: app.logo_url,
      })),
    [apps],
  );

  useEffect(() => {
    let cancelled = false;

    fetch(appsUrl)
      .then((response) => {
        if (!response.ok) {
          return [];
        }

        return response.json() as Promise<KnownApp[]>;
      })
      .then((nextApps) => {
        if (!cancelled) {
          setApps(nextApps);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  type GeneratedKind = "project" | "automation";

  function bucket(kind: GeneratedKind) {
    if (kind === "project") {
      return {
        rowsRef: projectsRef,
        setRows: setProjects,
        nextIdRef: nextProjectIdRef,
        setNextId: setNextProjectId,
        placeholder: "Project name",
        idPrefix: "project",
        generatedFor: "generatedFor" as const,
        linkedId: "linkedProjectId" as const,
        generatedName: "generatedName" as const,
        generatedRecords: "generatedRecords" as const,
      };
    }

    return {
      rowsRef: automationsRef,
      setRows: setAutomations,
      nextIdRef: nextAutomationIdRef,
      setNextId: setNextAutomationId,
      placeholder: "Automation name",
      idPrefix: "automation",
      generatedFor: "generatedAutomationFor" as const,
      linkedId: "linkedAutomationId" as const,
      generatedName: "generatedAutomationName" as const,
      generatedRecords: "generatedAutomationRecords" as const,
    };
  }

  function clearGenerating(kind: GeneratedKind, rowId: string) {
    const { rowsRef, setRows } = bucket(kind);
    setRows((current) => {
      const next = current.map((row) =>
        row.id === rowId ? { ...row, generating: false } : row,
      );
      rowsRef.current = next;
      return next;
    });
  }

  function reserveGenerating(kind: GeneratedKind, source: NamedRow) {
    const fields = bucket(kind);
    const current = fields.rowsRef.current;
    const linkedId = source[fields.linkedId];
    const linked = linkedId
      ? current.find((row) => row.id === linkedId)
      : undefined;
    const generatedName = source[fields.generatedName];
    const generatedRecords = source[fields.generatedRecords];
    const userEdited =
      linked !== undefined &&
      !linked.revealing &&
      generatedName !== undefined &&
      (linked.name !== generatedName || linked.records !== generatedRecords);

    if (linked && !userEdited) {
      const next = current.map((row) =>
        row.id === linked.id
          ? {
              ...row,
              name: "",
              description: "",
              diagram: "",
              records: "",
              generating: true,
            }
          : row,
      );
      fields.rowsRef.current = next;
      fields.setRows(next);
      return linked.id;
    }

    const open = current.find(
      (row) => row.name.trim() === "" && !row.generating,
    );
    if (open) {
      const next = current.map((row) =>
        row.id === open.id ? { ...row, generating: true } : row,
      );
      fields.rowsRef.current = next;
      fields.setRows(next);
      return open.id;
    }

    const id = `${fields.idPrefix}-${fields.nextIdRef.current}`;
    fields.nextIdRef.current += 1;
    fields.setNextId(fields.nextIdRef.current);
    const next = [
      ...current,
      {
        id,
        name: "",
        placeholder: fields.placeholder,
        records: "",
        generating: true,
      },
    ];
    fields.rowsRef.current = next;
    fields.setRows(next);
    return id;
  }

  function revealGenerated(
    kind: GeneratedKind,
    sourceId: string,
    sourceName: string,
    rowId: string,
    rowName: string,
    description: string,
    diagram: string,
  ) {
    const fields = bucket(kind);
    const source = sourcesRef.current.find((item) => item.id === sourceId);
    if (!source || source.name.trim() !== sourceName) {
      clearGenerating(kind, rowId);
      return;
    }

    const records = fifthOfRecords(source.records);

    setSources((current) => {
      const next = current.map((item) => {
        if (item.id !== sourceId || item.name.trim() !== sourceName) {
          return item;
        }

        return {
          ...item,
          [fields.generatedFor]: sourceName,
          [fields.linkedId]: rowId,
          [fields.generatedName]: rowName,
          [fields.generatedRecords]: records,
        };
      });
      sourcesRef.current = next;
      return next;
    });

    let index = 0;
    const tick = () => {
      index += 1;
      const partial = rowName.slice(0, index);
      const done = index >= rowName.length;
      fields.setRows((current) => {
        const next = current.map((row) => {
          if (row.id !== rowId) {
            return row;
          }

          return {
            ...row,
            generating: false,
            revealing: !done,
            name: partial,
            records,
            description: done ? description : "",
            diagram: done ? diagram : "",
            bubbleColor: done
              ? row.bubbleColor
                ? row.bubbleColor
                : randomBubbleColor()
              : row.bubbleColor,
          };
        });
        fields.rowsRef.current = next;
        return next;
      });
      if (!done) {
        window.setTimeout(tick, 38);
      }
    };
    tick();
  }

  useEffect(() => {
    const kinds: GeneratedKind[] = ["project", "automation"];
    for (const source of sources) {
      const sourceName = source.name.trim();
      if (sourceName === "" || !hasRealRecordCount(source.records)) {
        continue;
      }

      for (const kind of kinds) {
        const fields = bucket(kind);
        if (source[fields.generatedFor] === sourceName) {
          continue;
        }

        const requestKey = `${kind}:${source.id}:${sourceName}`;
        if (requestedProjectNames.current.has(requestKey)) {
          continue;
        }
        requestedProjectNames.current.add(requestKey);
        queueMicrotask(() => {
          const rowId = reserveGenerating(kind, source);

          void fetch("/api/project-name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceName, kind }),
          })
            .then(async (response) => {
              if (!response.ok) {
                requestedProjectNames.current.delete(requestKey);
                clearGenerating(kind, rowId);
                return;
              }

              const payload = (await response.json()) as {
                name?: unknown;
                description?: unknown;
                diagram?: unknown;
              };
              if (
                typeof payload.name !== "string" ||
                payload.name.trim() === "" ||
                typeof payload.description !== "string" ||
                payload.description.trim() === "" ||
                typeof payload.diagram !== "string" ||
                payload.diagram.trim() === ""
              ) {
                requestedProjectNames.current.delete(requestKey);
                clearGenerating(kind, rowId);
                return;
              }

              revealGenerated(
                kind,
                source.id,
                sourceName,
                rowId,
                payload.name.trim(),
                payload.description.trim(),
                payload.diagram.trim(),
              );
            })
            .catch(() => {
              requestedProjectNames.current.delete(requestKey);
              clearGenerating(kind, rowId);
            });
        });
      }
    }
  }, [sources]);

  const estimate = priceUsage({
    sources: sources.map((source) => ({
      name: source.name,
      recordsInMillions: parseCount(source.records),
    })),
    projects: projects.map((project) => ({
      name: project.name,
      recordsInMillions: parseCount(project.records),
    })),
    automations: automations.map((automation) => ({
      name: automation.name,
      recordsInMillions: parseCount(automation.records),
    })),
  });

  useEffect(() => {
    const form = toSavedForm(
      sources,
      projects,
      automations,
      nextSourceId,
      nextProjectId,
      nextAutomationId,
    );
    latestForm.current = form;
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
    }
    if (hydrating.current) {
      hydrating.current = false;
      return;
    }

    async function saveNow() {
      const current = latestForm.current;
      if (!current) {
        return;
      }
      if (quoteIdRef.current === "" && sameForm(current, starterForm)) {
        return;
      }

      if (quoteIdRef.current === "") {
        const response = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current),
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { id?: unknown };
        if (typeof payload.id !== "string" || payload.id === "") {
          return;
        }
        quoteIdRef.current = payload.id;
        window.history.replaceState(null, "", `/q/${payload.id}`);
        const latest = latestForm.current;
        if (!latest || sameForm(latest, current)) {
          return;
        }
        await fetch(`/api/quotes/${payload.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latest),
        });
        return;
      }

      const latest = latestForm.current;
      if (!latest) {
        return;
      }
      await fetch(`/api/quotes/${quoteIdRef.current}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest),
      });
    }

    async function runSave() {
      if (pendingWrite.current) {
        await pendingWrite.current;
      }
      const run = saveNow();
      pendingWrite.current = run;
      try {
        await run;
      } finally {
        if (pendingWrite.current === run) {
          pendingWrite.current = null;
        }
      }
    }

    saveTimer.current = window.setTimeout(() => {
      void runSave();
    }, 500);

    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [sources, projects, automations, nextSourceId, nextProjectId, nextAutomationId]);

  function updateSource(
    id: string,
    patch: Partial<Pick<NamedRow, "name" | "records" | "placeholder">>,
  ) {
    setSources((current) => {
      const next = current.map((source) =>
        source.id === id ? { ...source, ...patch } : source,
      );
      sourcesRef.current = next;
      return next;
    });
  }

  function removeSource(id: string) {
    setSources((current) => {
      if (current.length <= 1) {
        return current;
      }

      const next = current.filter((source) => source.id !== id);
      sourcesRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    const id = focusNameId.current;
    if (!id) {
      return;
    }
    focusNameId.current = null;
    document.getElementById(id)?.focus();
  }, [sources, projects, automations]);

  function addSource() {
    const id = `source-${nextSourceId}`;
    focusNameId.current = `${id}-name`;
    setNextSourceId(nextSourceId + 1);
    setSources((current) => {
      const next = [
        ...current,
        { id, name: "", placeholder: "Source name", records: "" },
      ];
      sourcesRef.current = next;
      return next;
    });
  }

  function updateProject(
    id: string,
    patch: Partial<Pick<NamedRow, "name" | "records">>,
  ) {
    setProjects((current) => {
      const next = current.map((project) =>
        project.id === id ? { ...project, ...patch } : project,
      );
      projectsRef.current = next;
      return next;
    });
  }

  function removeProject(id: string) {
    setProjects((current) => {
      if (current.length <= 1) {
        return current;
      }

      const next = current.filter((project) => project.id !== id);
      projectsRef.current = next;
      return next;
    });
  }

  function addProject() {
    const id = `project-${nextProjectIdRef.current}`;
    focusNameId.current = `${id}-name`;
    nextProjectIdRef.current += 1;
    setNextProjectId(nextProjectIdRef.current);
    setProjects((current) => {
      const next = [
        ...current,
        { id, name: "", placeholder: "Project name", records: "" },
      ];
      projectsRef.current = next;
      return next;
    });
  }

  function updateAutomation(
    id: string,
    patch: Partial<Pick<NamedRow, "name" | "records">>,
  ) {
    setAutomations((current) => {
      const next = current.map((automation) =>
        automation.id === id ? { ...automation, ...patch } : automation,
      );
      automationsRef.current = next;
      return next;
    });
  }

  function removeAutomation(id: string) {
    setAutomations((current) => {
      if (current.length <= 1) {
        return current;
      }

      const next = current.filter((automation) => automation.id !== id);
      automationsRef.current = next;
      return next;
    });
  }

  function addAutomation() {
    const id = `automation-${nextAutomationIdRef.current}`;
    focusNameId.current = `${id}-name`;
    nextAutomationIdRef.current += 1;
    setNextAutomationId(nextAutomationIdRef.current);
    setAutomations((current) => {
      const next = [
        ...current,
        { id, name: "", placeholder: "Automation name", records: "" },
      ];
      automationsRef.current = next;
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <form
        className="flex flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-medium sr-only">Data sources</legend>
          <p className="text-sm text-muted-foreground sr-only">
            Enter how many records you have in each source.
          </p>
          <div className="flex flex-col gap-3">
            {sources.map((source) => {
              const nameId = `${source.id}-name`;
              const recordsId = `${source.id}-records`;
              const selectedSource = optionForName(sourceOptions, source.name);

              return (
                <div
                  key={source.id}
                  className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={nameId}>Data Source</Label>
                    <CreatableSelect<SourceOption, false>
                      inputId={nameId}
                      instanceId={nameId}
                      options={sourceOptions}
                      value={selectedSource}
                      placeholder={source.placeholder}
                      styles={sourceSelectStyles}
                      formatCreateLabel={(inputValue) => `Use "${inputValue}"`}
                      formatOptionLabel={(option) => (
                        <span className="flex items-center gap-2">
                          {option.logoUrl ? (
                            <AppLogo src={option.logoUrl} />
                          ) : null}
                          <span>{option.label}</span>
                        </span>
                      )}
                      onChange={(option) => {
                        updateSource(source.id, {
                          name: option ? option.label : "",
                        });
                      }}
                    />
                  </div>
                  <RecordsField
                    id={recordsId}
                    value={source.records}
                    onChange={(records) => {
                      updateSource(source.id, { records });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${source.name || source.placeholder || "source"}`}
                    disabled={sources.length <= 1}
                    onClick={() => {
                      removeSource(source.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
          </div>
          <div>
            <Button type="button" variant="outline" onClick={addSource}>
              Add source
            </Button>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only text-sm font-medium">Projects</legend>
          <div className="flex flex-col gap-3">
            {projects.map((project) => {
              const nameId = `${project.id}-name`;
              const recordsId = `${project.id}-records`;

              return (
                <div
                  key={project.id}
                  className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={nameId}>Project</Label>
                    <div className="relative">
                      <Input
                        id={nameId}
                        value={project.name}
                        placeholder={
                          project.generating ? "" : project.placeholder
                        }
                        readOnly={project.generating || project.revealing}
                        aria-busy={project.generating}
                        onChange={(event) => {
                          updateProject(project.id, {
                            name: event.target.value,
                          });
                        }}
                      />
                      {project.generating ? (
                        <GeneratingHint label="Dreaming up a project" />
                      ) : null}
                    </div>
                    {project.description ? (
                      <GeneratedReply
                        description={project.description}
                        diagram={project.diagram}
                        bubbleColor={project.bubbleColor}
                      />
                    ) : null}
                  </div>
                  <div className="flex items-end gap-3">
                    <RecordsField
                      id={recordsId}
                      value={project.records}
                      onChange={(records) => {
                        updateProject(project.id, { records });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${project.name || project.placeholder || "project"}`}
                      disabled={projects.length <= 1}
                      onClick={() => {
                        removeProject(project.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <Button type="button" variant="outline" onClick={addProject}>
              Add project
            </Button>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="text-sm font-medium">Automations</legend>
          <p className="text-sm text-muted-foreground">
            $500 per million rows, separate from sources and projects.
          </p>
          <div className="flex flex-col gap-3">
            {automations.map((automation) => {
              const nameId = `${automation.id}-name`;
              const recordsId = `${automation.id}-records`;

              return (
                <div
                  key={automation.id}
                  className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={nameId}>Automation</Label>
                    <div className="relative">
                      <Input
                        id={nameId}
                        value={automation.name}
                        placeholder={
                          automation.generating ? "" : automation.placeholder
                        }
                        readOnly={
                          automation.generating || automation.revealing
                        }
                        aria-busy={automation.generating}
                        onChange={(event) => {
                          updateAutomation(automation.id, {
                            name: event.target.value,
                          });
                        }}
                      />
                      {automation.generating ? (
                        <GeneratingHint label="Dreaming up an automation" />
                      ) : null}
                    </div>
                    {automation.description ? (
                      <GeneratedReply
                        description={automation.description}
                        diagram={automation.diagram}
                        bubbleColor={automation.bubbleColor}
                      />
                    ) : null}
                  </div>
                  <div className="flex items-end gap-3">
                    <RecordsField
                      id={recordsId}
                      value={automation.records}
                      onChange={(records) => {
                        updateAutomation(automation.id, { records });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${automation.name || automation.placeholder || "automation"}`}
                      disabled={automations.length <= 1}
                      onClick={() => {
                        removeAutomation(automation.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <Button type="button" variant="outline" onClick={addAutomation}>
              Add automation
            </Button>
          </div>
        </fieldset>
      </form>

      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Estimate</CardTitle>
          <CardDescription>
            Sources and projects are $50 per million. Automations are $500 per
            million rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <EstimateHint
                label="Source records"
                hint="The records stored in each data source."
              />
              <dd className="text-right">
                <span className="block font-medium tabular-nums">
                  {countFormat.format(estimate.sourceRecords)}
                </span>
                <span className="block text-muted-foreground tabular-nums">
                  {moneyFormat.format(estimate.sourceAmount)}
                </span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <EstimateHint
                label="Project records"
                hint="Projects update hourly but only count towards usage 1x per day. That daily total is billed across the month."
              />
              <dd className="text-right">
                <span className="block font-medium tabular-nums">
                  {countFormat.format(estimate.projectRecords)}
                </span>
                <span className="block text-muted-foreground tabular-nums">
                  {moneyFormat.format(estimate.projectAmount)}
                </span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <EstimateHint
                label="Automations"
                hint="Billed at $500 per million rows, separate from sources and projects."
              />
              <dd className="text-right">
                <span className="block font-medium tabular-nums">
                  {countFormat.format(estimate.automationRecords)}
                </span>
                <span className="block text-muted-foreground tabular-nums">
                  {moneyFormat.format(estimate.automationAmount)}
                </span>
              </dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between gap-4 border-t pt-4">
            <p className="text-muted-foreground">Monthly total</p>
            <p className="text-base font-medium tabular-nums">
              {moneyFormat.format(estimate.monthlyTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
