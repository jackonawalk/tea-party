"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { GeneratedKind, SavedRow } from "@/lib/saved-form";

export type NamedRow = SavedRow & {
  diagramGenerating?: boolean;
  generating?: boolean;
  revealing?: boolean;
};

const projectShareOfSource = 0.2;
const automationShareOfProject = 0.1;

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

export function parseCount(value: string) {
  if (value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function hasRealRecordCount(records: string) {
  const trimmed = records.trim();
  if (trimmed === "" || trimmed === "0") {
    return false;
  }

  return parseCount(trimmed) > 0;
}

function suggestedRecords(kind: GeneratedKind, sourceRecords: string) {
  const projectRecords = parseCount(sourceRecords) * projectShareOfSource;
  const amount =
    kind === "project"
      ? projectRecords
      : projectRecords * automationShareOfProject;
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0";
  }

  return String(Math.round(amount * 10000) / 10000);
}

function linkFor(source: NamedRow, kind: GeneratedKind) {
  if (!source.generated) {
    return undefined;
  }

  return source.generated[kind];
}

type RowPatch = Partial<
  Pick<NamedRow, "name" | "records" | "diagramHidden" | "placeholder">
>;

type GenerationApi = {
  reserveGenerating: (kind: GeneratedKind, source: NamedRow) => string;
  clearGenerating: (kind: GeneratedKind, rowId: string) => void;
  revealGenerated: (
    kind: GeneratedKind,
    sourceId: string,
    sourceName: string,
    rowId: string,
    rowName: string,
    description: string,
    diagram: string,
  ) => void;
};

export function useGeneratedRows({
  sources,
  setSources,
  sourcesRef,
  initialProjects,
  initialAutomations,
  initialNextProjectId,
  initialNextAutomationId,
  focusNameIdRef,
}: {
  sources: NamedRow[];
  setSources: Dispatch<SetStateAction<NamedRow[]>>;
  sourcesRef: RefObject<NamedRow[]>;
  initialProjects: NamedRow[];
  initialAutomations: NamedRow[];
  initialNextProjectId: number;
  initialNextAutomationId: number;
  focusNameIdRef: RefObject<string | null>;
}) {
  const [projects, setProjects] = useState<NamedRow[]>(initialProjects);
  const [nextProjectId, setNextProjectId] = useState(initialNextProjectId);
  const [automations, setAutomations] = useState<NamedRow[]>(initialAutomations);
  const [nextAutomationId, setNextAutomationId] = useState(
    initialNextAutomationId,
  );
  const projectsRef = useRef(projects);
  const automationsRef = useRef(automations);
  const nextProjectIdRef = useRef(nextProjectId);
  const nextAutomationIdRef = useRef(nextAutomationId);
  const requestedNames = useRef(new Set<string>());
  const diagramTimers = useRef(new Map<string, number>());
  const diagramTitles = useRef(new Map<string, string>());
  const generationRef = useRef<GenerationApi | null>(null);

  const bucket = useCallback((kind: GeneratedKind) => {
    if (kind === "project") {
      return {
        rowsRef: projectsRef,
        setRows: setProjects,
        nextIdRef: nextProjectIdRef,
        setNextId: setNextProjectId,
        placeholder: "Project name",
        idPrefix: "project",
      };
    }

    return {
      rowsRef: automationsRef,
      setRows: setAutomations,
      nextIdRef: nextAutomationIdRef,
      setNextId: setNextAutomationId,
      placeholder: "Automation name",
      idPrefix: "automation",
    };
  }, []);

  const clearGenerating = useCallback((kind: GeneratedKind, rowId: string) => {
    const { rowsRef, setRows } = bucket(kind);
    setRows((current) => {
      const next = current.map((row) =>
        row.id === rowId ? { ...row, generating: false } : row,
      );
      rowsRef.current = next;
      return next;
    });
  }, [bucket]);

  const reserveGenerating = useCallback((kind: GeneratedKind, source: NamedRow) => {
    const fields = bucket(kind);
    const current = fields.rowsRef.current;
    const link = linkFor(source, kind);
    const linked = link
      ? current.find((row) => row.id === link.linkedId)
      : undefined;
    const userEdited =
      linked !== undefined &&
      link !== undefined &&
      !linked.revealing &&
      (linked.name !== link.name || linked.records !== link.records);

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
  }, [bucket]);

  const revealGenerated = useCallback((
    kind: GeneratedKind,
    sourceId: string,
    sourceName: string,
    rowId: string,
    rowName: string,
    description: string,
    diagram: string,
  ) => {
    const fields = bucket(kind);
    const source = sourcesRef.current.find((item) => item.id === sourceId);
    if (!source || source.name.trim() !== sourceName) {
      clearGenerating(kind, rowId);
      return;
    }

    const records = suggestedRecords(kind, source.records);

    setSources((current) => {
      const next = current.map((item) => {
        if (item.id !== sourceId || item.name.trim() !== sourceName) {
          return item;
        }

        const previous = item.generated ? item.generated : {};
        return {
          ...item,
          generated: {
            ...previous,
            [kind]: {
              sourceName,
              linkedId: rowId,
              name: rowName,
              records,
            },
          },
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
  }, [bucket, clearGenerating, setSources, sourcesRef]);

  useEffect(() => {
    generationRef.current = {
      reserveGenerating,
      clearGenerating,
      revealGenerated,
    };
  }, [reserveGenerating, clearGenerating, revealGenerated]);

  useEffect(() => {
    const kinds: GeneratedKind[] = ["project", "automation"];
    for (const source of sources) {
      const sourceName = source.name.trim();
      if (sourceName === "" || !hasRealRecordCount(source.records)) {
        continue;
      }

      for (const kind of kinds) {
        const link = linkFor(source, kind);
        if (link && link.sourceName === sourceName) {
          continue;
        }

        const requestKey = `${kind}:${source.id}:${sourceName}`;
        if (requestedNames.current.has(requestKey)) {
          continue;
        }
        requestedNames.current.add(requestKey);
        queueMicrotask(() => {
          const api = generationRef.current;
          if (!api) {
            return;
          }
          const rowId = api.reserveGenerating(kind, source);

          void fetch("/api/project-name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceName, kind }),
          })
            .then(async (response) => {
              const current = generationRef.current;
              if (!current) {
                return;
              }
              if (!response.ok) {
                requestedNames.current.delete(requestKey);
                current.clearGenerating(kind, rowId);
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
                requestedNames.current.delete(requestKey);
                current.clearGenerating(kind, rowId);
                return;
              }

              current.revealGenerated(
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
              const current = generationRef.current;
              if (!current) {
                return;
              }
              requestedNames.current.delete(requestKey);
              current.clearGenerating(kind, rowId);
            });
        });
      }
    }
  }, [sources]);

  function applyDiagram(
    kind: GeneratedKind,
    id: string,
    patch: Partial<
      Pick<
        NamedRow,
        "diagram" | "diagramGenerating" | "description" | "bubbleColor"
      >
    >,
  ) {
    const fields = bucket(kind);
    fields.setRows((current) => {
      const next = current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const updated = { ...row, ...patch };
        if (updated.description && !updated.bubbleColor) {
          updated.bubbleColor = randomBubbleColor();
        }
        return updated;
      });
      fields.rowsRef.current = next;
      return next;
    });
  }

  function scheduleDiagram(kind: GeneratedKind, id: string, name: string) {
    const key = `${kind}:${id}`;
    const existing = diagramTimers.current.get(key);
    if (existing) {
      window.clearTimeout(existing);
    }

    const title = name.trim();
    diagramTitles.current.set(key, title);
    if (title === "") {
      applyDiagram(kind, id, {
        diagram: "",
        description: "",
        diagramGenerating: false,
      });
      return;
    }

    const timer = window.setTimeout(() => {
      applyDiagram(kind, id, { diagramGenerating: true });
      const source = sourcesRef.current.find((item) => {
        const link = linkFor(item, kind);
        return link ? link.linkedId === id : false;
      });
      const sourceName = source ? source.name.trim() : "";

      void fetch("/api/project-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name: title, sourceName }),
      })
        .then(async (response) => {
          if (diagramTitles.current.get(key) !== title) {
            return;
          }
          if (!response.ok) {
            applyDiagram(kind, id, { diagramGenerating: false });
            return;
          }

          const payload = (await response.json()) as {
            diagram?: unknown;
            description?: unknown;
          };
          if (diagramTitles.current.get(key) !== title) {
            return;
          }
          if (
            typeof payload.diagram !== "string" ||
            payload.diagram.trim() === "" ||
            typeof payload.description !== "string" ||
            payload.description.trim() === ""
          ) {
            applyDiagram(kind, id, { diagramGenerating: false });
            return;
          }

          applyDiagram(kind, id, {
            diagram: payload.diagram.trim(),
            description: payload.description.trim(),
            diagramGenerating: false,
          });
        })
        .catch(() => {
          if (diagramTitles.current.get(key) !== title) {
            return;
          }
          applyDiagram(kind, id, { diagramGenerating: false });
        });
    }, 500);
    diagramTimers.current.set(key, timer);
  }

  function updateRow(kind: GeneratedKind, id: string, patch: RowPatch) {
    const fields = bucket(kind);
    fields.setRows((current) => {
      const next = current.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      );
      fields.rowsRef.current = next;
      return next;
    });
    if (patch.name !== undefined) {
      scheduleDiagram(kind, id, patch.name);
    }
  }

  function removeRow(kind: GeneratedKind, id: string) {
    const fields = bucket(kind);
    const rows = fields.rowsRef.current;
    const isLast = rows.length === 1 && rows[0].id === id;
    let blank: NamedRow | null = null;
    if (isLast) {
      const blankId = `${fields.idPrefix}-${fields.nextIdRef.current}`;
      fields.nextIdRef.current += 1;
      fields.setNextId(fields.nextIdRef.current);
      focusNameIdRef.current = `${blankId}-name`;
      blank = {
        id: blankId,
        name: "",
        placeholder: fields.placeholder,
        records: "",
      };
    }

    fields.setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      if (next.length === 0 && blank) {
        fields.rowsRef.current = [blank];
        return [blank];
      }

      fields.rowsRef.current = next;
      return next;
    });
  }

  function addRow(kind: GeneratedKind) {
    const fields = bucket(kind);
    const id = `${fields.idPrefix}-${fields.nextIdRef.current}`;
    focusNameIdRef.current = `${id}-name`;
    fields.nextIdRef.current += 1;
    fields.setNextId(fields.nextIdRef.current);
    fields.setRows((current) => {
      const next = [
        ...current,
        {
          id,
          name: "",
          placeholder: fields.placeholder,
          records: "",
        },
      ];
      fields.rowsRef.current = next;
      return next;
    });
  }

  return {
    projects,
    automations,
    nextProjectId,
    nextAutomationId,
    updateRow,
    addRow,
    removeRow,
  };
}
