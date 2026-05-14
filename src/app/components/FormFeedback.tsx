import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type FeedbackState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

interface Props {
  state: FeedbackState;
}

/**
 * Animated inline feedback for forms.
 * Renders a green success or red error panel above the form actions.
 * Caller controls state (kind + message) and clears it.
 */
export function FormFeedback({ state }: Props) {
  return (
    <AnimatePresence mode="wait">
      {state.kind === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{state.message}</span>
        </motion.div>
      )}
      {state.kind === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
