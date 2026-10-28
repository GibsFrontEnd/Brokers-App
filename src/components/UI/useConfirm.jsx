import { useCallback, useState } from "react";
import { ConfirmDialog } from "./PageKit";

/**
 * A promise-based replacement for window.confirm:
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm({ title: "Delete role?", message: "…", confirmLabel: "Delete" }))) return;
 * and render {confirmDialog} somewhere in the component.
 */
export const useConfirm = () => {
  const [request, setRequest] = useState(null);

  const confirm = useCallback(
    (options) => new Promise((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  const answer = (value) => {
    request?.resolve(value);
    setRequest(null);
  };

  const dialog = request ? (
    <ConfirmDialog
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      tone={request.tone}
      onConfirm={() => answer(true)}
      onCancel={() => answer(false)}
    />
  ) : null;

  return [confirm, dialog];
};
