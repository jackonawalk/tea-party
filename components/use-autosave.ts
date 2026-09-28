"use client";

import { useEffect, useRef } from "react";
import type { SavedForm, SavedRow } from "@/lib/saved-form";
import type { NamedRow } from "@/components/use-generated-rows";

function savedRow(row: NamedRow): SavedRow {
  const saved: SavedRow = {
    id: row.id,
    name: row.name,
    placeholder: row.placeholder,
    records: row.records,
  };
  if (row.generated && (row.generated.project || row.generated.automation)) {
    saved.generated = {};
    if (row.generated.project) {
      saved.generated.project = row.generated.project;
    }
    if (row.generated.automation) {
      saved.generated.automation = row.generated.automation;
    }
  }
  if (row.description) {
    saved.description = row.description;
  }
  if (row.diagram) {
    saved.diagram = row.diagram;
  }
  if (row.diagramHidden) {
    saved.diagramHidden = true;
  }
  if (row.bubbleColor) {
    saved.bubbleColor = row.bubbleColor;
  }
  return saved;
}

export function toSavedForm(
  title: string,
  sources: NamedRow[],
  projects: NamedRow[],
  automations: NamedRow[],
  nextSourceId: number,
  nextProjectId: number,
  nextAutomationId: number,
  whiteGlove: boolean,
): SavedForm {
  return {
    title,
    sources: sources.map(savedRow),
    projects: projects.map(savedRow),
    automations: automations.map(savedRow),
    nextSourceId,
    nextProjectId,
    nextAutomationId,
    whiteGlove,
  };
}

function sameForm(left: SavedForm, right: SavedForm) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useAutosave({
  quoteId,
  title,
  sources,
  projects,
  automations,
  nextSourceId,
  nextProjectId,
  nextAutomationId,
  whiteGlove,
  starterForm,
}: {
  quoteId?: string;
  title: string;
  sources: NamedRow[];
  projects: NamedRow[];
  automations: NamedRow[];
  nextSourceId: number;
  nextProjectId: number;
  nextAutomationId: number;
  whiteGlove: boolean;
  starterForm: SavedForm;
}) {
  const quoteIdRef = useRef(quoteId ? quoteId : "");
  const latestForm = useRef<SavedForm | null>(null);
  const saveTimer = useRef<number | null>(null);
  const pendingWrite = useRef<Promise<void> | null>(null);
  const hydrating = useRef(true);

  useEffect(() => {
    const form = toSavedForm(
      title,
      sources,
      projects,
      automations,
      nextSourceId,
      nextProjectId,
      nextAutomationId,
      whiteGlove,
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
  }, [
    sources,
    projects,
    automations,
    nextSourceId,
    nextProjectId,
    nextAutomationId,
    whiteGlove,
    title,
    starterForm,
  ]);
}
