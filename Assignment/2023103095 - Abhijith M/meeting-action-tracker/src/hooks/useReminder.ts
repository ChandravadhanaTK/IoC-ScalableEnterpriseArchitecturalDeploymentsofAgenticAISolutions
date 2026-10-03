import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { runReminderAgent } from "@/lib/agents.functions";

let ranThisSession = false;

/** Runs the Reminder Agent once per browser session when a page that shows deadlines opens. */
export function useReminderOnMount() {
  const run = useServerFn(runReminderAgent);
  const qc = useQueryClient();
  useEffect(() => {
    if (ranThisSession) return;
    ranThisSession = true;
    run().then(() => qc.invalidateQueries()).catch(() => { ranThisSession = false; });
  }, [run, qc]);
}
