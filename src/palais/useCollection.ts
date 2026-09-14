import { useCallback, useEffect, useState } from "react";
import { currentEditor, dbConfigured, listLayouts, onEditorChange, type Editor, type SavedLayout } from "./layoutsDb";

export interface Collection {
  configured: boolean;
  /** every saved layout, for every room and device, newest first */
  saved: SavedLayout[];
  /** who's signed in, if anyone */
  editor: Editor | null;
  error: string;
  setError: (message: string) => void;
  refresh: () => Promise<void>;
}

export const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** the saved layouts, and whether Molly is signed in to change them */
export function useCollection(): Collection {
  const [saved, setSaved] = useState<SavedLayout[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!dbConfigured) return;
    try {
      setSaved(await listLayouts());
      setError("");
    } catch (e) {
      setError(messageOf(e));
    }
  }, []);

  useEffect(() => {
    if (!dbConfigured) return;
    void refresh();
    currentEditor()
      .then(setEditor)
      .catch(() => {});
    return onEditorChange(setEditor);
  }, [refresh]);

  return { configured: dbConfigured, saved, editor, error, setError, refresh };
}
