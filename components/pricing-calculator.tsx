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

type NamedRow = {
  id: string;
  name: string;
  placeholder: string;
  records: string;
  generatedFor?: string;
  linkedProjectId?: string;
  generatedName?: string;
  generatedRecords?: string;
  description?: string;
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

function GeneratingHint() {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center gap-1.5 text-sm">
      <span className="ai-spark" aria-hidden>
        ✦
      </span>
      <span className="ai-shimmer-text">Dreaming up a project</span>
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
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Records</Label>
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
          <TooltipContent>Pricing is per million records</TooltipContent>
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
  if (row.description) {
    saved.description = row.description;
  }
  if (row.bubbleColor) {
    saved.bubbleColor = row.bubbleColor;
  }
  return saved;
}

function toSavedForm(
  sources: NamedRow[],
  projects: NamedRow[],
  nextSourceId: number,
  nextProjectId: number,
): SavedForm {
  return {
    sources: sources.map(savedRow),
    projects: projects.map(savedRow),
    nextSourceId,
    nextProjectId,
  };
}

const starterForm = toSavedForm(
  starterSources,
  starterProjects,
  starterSources.length + 1,
  starterProjects.length + 1,
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
  const sourcesRef = useRef(sources);
  const projectsRef = useRef(projects);
  const nextProjectIdRef = useRef(nextProjectId);
  const quoteIdRef = useRef(quoteId ? quoteId : "");
  const latestForm = useRef<SavedForm | null>(null);
  const saveTimer = useRef<number | null>(null);
  const pendingWrite = useRef<Promise<void> | null>(null);
  const hydrating = useRef(true);
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

  function clearGenerating(projectId: string) {
    setProjects((current) => {
      const next = current.map((project) =>
        project.id === projectId ? { ...project, generating: false } : project,
      );
      projectsRef.current = next;
      return next;
    });
  }

  function reserveGeneratingProject(source: NamedRow) {
    const current = projectsRef.current;
    const linked = source.linkedProjectId
      ? current.find((project) => project.id === source.linkedProjectId)
      : undefined;
    const userEdited =
      linked !== undefined &&
      !linked.revealing &&
      source.generatedName !== undefined &&
      (linked.name !== source.generatedName ||
        linked.records !== source.generatedRecords);

    if (linked && !userEdited) {
      const next = current.map((project) =>
        project.id === linked.id
          ? {
              ...project,
              name: "",
              description: "",
              records: "",
              generating: true,
            }
          : project,
      );
      projectsRef.current = next;
      setProjects(next);
      return linked.id;
    }

    const open = current.find(
      (project) => project.name.trim() === "" && !project.generating,
    );
    if (open) {
      const next = current.map((project) =>
        project.id === open.id ? { ...project, generating: true } : project,
      );
      projectsRef.current = next;
      setProjects(next);
      return open.id;
    }

    const id = `project-${nextProjectIdRef.current}`;
    nextProjectIdRef.current += 1;
    setNextProjectId(nextProjectIdRef.current);
    const next = [
      ...current,
      {
        id,
        name: "",
        placeholder: "Project name",
        records: "",
        generating: true,
      },
    ];
    projectsRef.current = next;
    setProjects(next);
    return id;
  }

  function revealProject(
    sourceId: string,
    sourceName: string,
    projectId: string,
    projectName: string,
    description: string,
  ) {
    const source = sourcesRef.current.find((item) => item.id === sourceId);
    if (!source || source.name.trim() !== sourceName) {
      clearGenerating(projectId);
      return;
    }

    const records = fifthOfRecords(source.records);

    const nextSources = sourcesRef.current.map((item) => {
      if (item.id !== sourceId || item.name.trim() !== sourceName) {
        return item;
      }

      return {
        ...item,
        generatedFor: sourceName,
        linkedProjectId: projectId,
        generatedName: projectName,
        generatedRecords: records,
      };
    });
    sourcesRef.current = nextSources;
    setSources(nextSources);

    let index = 0;
    const tick = () => {
      index += 1;
      const partial = projectName.slice(0, index);
      const done = index >= projectName.length;
      setProjects((current) => {
        const next = current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          return {
            ...project,
            generating: false,
            revealing: !done,
            name: partial,
            records,
            description: done ? description : "",
            bubbleColor: done
              ? project.bubbleColor
                ? project.bubbleColor
                : randomBubbleColor()
              : project.bubbleColor,
          };
        });
        projectsRef.current = next;
        return next;
      });
      if (!done) {
        window.setTimeout(tick, 38);
      }
    };
    tick();
  }

  useEffect(() => {
    for (const source of sources) {
      const sourceName = source.name.trim();
      if (sourceName === "" || !hasRealRecordCount(source.records)) {
        continue;
      }
      if (source.generatedFor === sourceName) {
        continue;
      }

      const requestKey = `${source.id}:${sourceName}`;
      if (requestedProjectNames.current.has(requestKey)) {
        continue;
      }
      requestedProjectNames.current.add(requestKey);
      queueMicrotask(() => {
        const projectId = reserveGeneratingProject(source);

        void fetch("/api/project-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceName }),
        })
          .then(async (response) => {
            if (!response.ok) {
              requestedProjectNames.current.delete(requestKey);
              clearGenerating(projectId);
              return;
            }

            const payload = (await response.json()) as {
              name?: unknown;
              description?: unknown;
            };
            if (
              typeof payload.name !== "string" ||
              payload.name.trim() === "" ||
              typeof payload.description !== "string" ||
              payload.description.trim() === ""
            ) {
              requestedProjectNames.current.delete(requestKey);
              clearGenerating(projectId);
              return;
            }

            revealProject(
              source.id,
              sourceName,
              projectId,
              payload.name.trim(),
              payload.description.trim(),
            );
          })
          .catch(() => {
            requestedProjectNames.current.delete(requestKey);
            clearGenerating(projectId);
          });
      });
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
  });

  useEffect(() => {
    const form = toSavedForm(sources, projects, nextSourceId, nextProjectId);
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
  }, [sources, projects, nextSourceId, nextProjectId]);

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

  function addSource() {
    const id = `source-${nextSourceId}`;
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
                      {project.generating ? <GeneratingHint /> : null}
                    </div>
                    {project.description ? (
                      <p
                        className={`relative ml-1 mt-2.5 w-fit max-w-full rounded-2xl px-3 py-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 ${project.bubbleColor}`}
                      >
                        <span
                          aria-hidden
                          className="absolute -top-2.5 left-4 h-3.5 w-5 bg-inherit [clip-path:path('M_0_14_L_9_1.5_Q_10_0_11_1.5_L_20_14_Z')]"
                        />
                        “{project.description}”
                      </p>
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
      </form>

      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>Estimate</CardTitle>
          <CardDescription>$50 per million records each month.</CardDescription>
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
