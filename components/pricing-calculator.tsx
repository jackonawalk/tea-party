"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedKind } from "@/lib/saved-form";
import { Eye, EyeOff, Info, Trash2 } from "lucide-react";
import CreatableSelect from "react-select/creatable";
import type { StylesConfig } from "react-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { priceUsage } from "@/lib/pricing";
import { suggestPlan } from "@/lib/plans";
import {
  defaultPricePerCreditText,
  defaultQuoteTitle,
  type SavedForm,
} from "@/lib/saved-form";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { toSavedForm, useAutosave } from "@/components/use-autosave";
import {
  parseCount,
  useGeneratedRows,
  type NamedRow,
} from "@/components/use-generated-rows";

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

const generatedCopy: Record<
  GeneratedKind,
  { legend: string; label: string; generating: string; add: string }
> = {
  project: {
    legend: "Projects",
    label: "Project",
    generating: "Dreaming up a project",
    add: "Add project",
  },
  automation: {
    legend: "Automations",
    label: "Automation",
    generating: "Dreaming up an automation",
    add: "Add automation",
  },
};

const countFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});
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
  bubbleColor,
}: {
  description: string;
  bubbleColor?: string;
}) {
  return (
    <p
      className={`relative ml-1 mt-2.5 w-fit max-w-full rounded-2xl px-3 py-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 ${bubbleColor}`}
    >
      <span
        aria-hidden
        className="absolute -top-2.5 left-4 h-3.5 w-5 bg-inherit [clip-path:path('M_0_14_L_9_1.5_Q_10_0_11_1.5_L_20_14_Z')]"
      />
      “{description}”
    </p>
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

function DiagramBlock({
  diagram,
  generating,
  hidden,
  onHiddenChange,
}: {
  diagram?: string;
  generating?: boolean;
  hidden?: boolean;
  onHiddenChange: (hidden: boolean) => void;
}) {
  if (!diagram && !generating) {
    return null;
  }

  return (
    <div className="col-span-full flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {generating ? (
          <p className="text-sm text-muted-foreground">Updating diagram</p>
        ) : null}
        {diagram ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto"
            aria-pressed={hidden === true}
            onClick={() => {
              onHiddenChange(hidden !== true);
            }}
          >
            {hidden ? <EyeOff /> : <Eye />}
            <span className="sr-only">
              {hidden ? "Show diagram" : "Hide diagram"}
            </span>
          </Button>
        ) : null}
      </div>
      {diagram && hidden !== true ? <MermaidDiagram chart={diagram} /> : null}
    </div>
  );
}

function EstimateHint({ label, hint }: { label: string; hint?: string }) {
  return (
    <dt className="flex items-center gap-1 text-muted-foreground">
      {label}
      {hint ? (
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
      ) : null}
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

function GeneratedRowList({
  kind,
  rows,
  onUpdate,
  onAdd,
  onRemove,
}: {
  kind: GeneratedKind;
  rows: NamedRow[];
  onUpdate: (
    kind: GeneratedKind,
    id: string,
    patch: Partial<Pick<NamedRow, "name" | "records" | "diagramHidden">>,
  ) => void;
  onAdd: (kind: GeneratedKind) => void;
  onRemove: (kind: GeneratedKind, id: string) => void;
}) {
  const copy = generatedCopy[kind];

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="sr-only text-sm font-medium">{copy.legend}</legend>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const nameId = `${row.id}-name`;
          const recordsId = `${row.id}-records`;

          return (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor={nameId}>{copy.label}</Label>
                <div className="relative">
                  <Input
                    id={nameId}
                    value={row.name}
                    placeholder={row.generating ? "" : row.placeholder}
                    readOnly={row.generating || row.revealing}
                    aria-busy={row.generating}
                    onChange={(event) => {
                      onUpdate(kind, row.id, { name: event.target.value });
                    }}
                  />
                  {row.generating ? (
                    <GeneratingHint label={copy.generating} />
                  ) : null}
                </div>
                {row.description ? (
                  <GeneratedReply
                    description={row.description}
                    bubbleColor={row.bubbleColor}
                  />
                ) : null}
              </div>
              <div className="flex items-end gap-3">
                <RecordsField
                  id={recordsId}
                  value={row.records}
                  onChange={(records) => {
                    onUpdate(kind, row.id, { records });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${row.name || row.placeholder || kind}`}
                  onClick={() => {
                    onRemove(kind, row.id);
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
              <DiagramBlock
                diagram={row.diagram}
                generating={row.diagramGenerating}
                hidden={row.diagramHidden}
                onHiddenChange={(diagramHidden) => {
                  onUpdate(kind, row.id, { diagramHidden });
                }}
              />
            </div>
          );
        })}
      </div>
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onAdd(kind);
          }}
        >
          {copy.add}
        </Button>
      </div>
    </fieldset>
  );
}

const starterForm = toSavedForm(
  defaultQuoteTitle,
  starterSources,
  starterProjects,
  starterAutomations,
  starterSources.length + 1,
  starterProjects.length + 1,
  starterAutomations.length + 1,
  false,
  defaultPricePerCreditText,
);

export function PricingCalculator({
  quoteId,
  initialForm,
  title,
}: {
  quoteId?: string;
  initialForm?: SavedForm;
  title: string;
}) {
  const [sources, setSources] = useState<NamedRow[]>(
    initialForm ? initialForm.sources : starterSources,
  );
  const [nextSourceId, setNextSourceId] = useState(
    initialForm ? initialForm.nextSourceId : starterSources.length + 1,
  );
  const [whiteGlove] = useState(initialForm ? initialForm.whiteGlove : false);
  const [pricePerCredit] = useState(
    initialForm ? initialForm.pricePerCredit : defaultPricePerCreditText,
  );
  const sourcesRef = useRef(sources);
  const focusNameId = useRef<string | null>(null);
  const {
    projects,
    automations,
    nextProjectId,
    nextAutomationId,
    updateRow,
    addRow,
    removeRow,
  } = useGeneratedRows({
    sources,
    setSources,
    sourcesRef,
    initialProjects: initialForm ? initialForm.projects : starterProjects,
    initialAutomations: initialForm
      ? initialForm.automations
      : starterAutomations,
    initialNextProjectId: initialForm
      ? initialForm.nextProjectId
      : starterProjects.length + 1,
    initialNextAutomationId: initialForm
      ? initialForm.nextAutomationId
      : starterAutomations.length + 1,
    focusNameIdRef: focusNameId,
  });
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
    whiteGlove,
    pricePerCredit: parseCount(pricePerCredit),
  });

  const suggestedPlan = suggestPlan(estimate.credits);

  useAutosave({
    quoteId,
    title,
    sources,
    projects,
    automations,
    nextSourceId,
    nextProjectId,
    nextAutomationId,
    whiteGlove,
    pricePerCredit,
    starterForm,
  });

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
    const isLast = sources.length === 1 && sources[0].id === id;
    let blank: NamedRow | null = null;
    if (isLast) {
      const blankId = `source-${nextSourceId}`;
      focusNameId.current = `${blankId}-name`;
      setNextSourceId(nextSourceId + 1);
      blank = {
        id: blankId,
        name: "",
        placeholder: "Source name",
        records: "",
      };
    }

    setSources((current) => {
      const next = current.filter((source) => source.id !== id);
      if (next.length === 0 && blank) {
        sourcesRef.current = [blank];
        return [blank];
      }

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

        <GeneratedRowList
          kind="project"
          rows={projects}
          onUpdate={updateRow}
          onAdd={addRow}
          onRemove={removeRow}
        />
        <GeneratedRowList
          kind="automation"
          rows={automations}
          onUpdate={updateRow}
          onAdd={addRow}
          onRemove={removeRow}
        />
      </form>

      <div className="flex flex-col gap-6 lg:sticky lg:top-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <EstimateHint
                  label="Sources"
                  hint="Total records across all sources."
                />
                <dd className="text-right">
                  <span className="block font-medium tabular-nums">
                    {countFormat.format(estimate.sourceRecords)}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <EstimateHint
                  label="Projects"
                  hint="Projects refresh hourly but are metered daily. Multiply each project's daily usage by 30 to estimate monthly usage."
                />
                <dd className="text-right">
                  <span className="block font-medium tabular-nums">
                    {countFormat.format(estimate.projectRecords)}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <EstimateHint
                  label="Credits Used"
                  hint={`One credit is 1M Records`}
                />
                <dd className="text-right">
                  <span className="block font-medium tabular-nums">
                    {countFormat.format(estimate.credits)}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <EstimateHint label="Automations" />
                <dd className="text-right">
                  <span className="block font-medium tabular-nums">
                    {countFormat.format(estimate.automationRecords)}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Suggested Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-left">
            <p className="text-base font-medium">{suggestedPlan.name}</p>
            <p className="font-medium tabular-nums">
              {moneyFormat.format(suggestedPlan.annualPrice)}
              <span className="font-normal text-muted-foreground"> / year</span>
            </p>
            <span className="block font-normal text-muted-foreground">
              Includes {countFormat.format(suggestedPlan.annualCredits)} credits
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
