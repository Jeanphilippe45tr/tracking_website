// -------------------------------------------------------------------
// ProgressStepper — horizontal 5-stage progress bar.
// -------------------------------------------------------------------
// Stages: Created -> Picked up -> In transit -> Out for delivery ->
// Delivered. "Delayed" is an exception: we highlight the last reached
// normal stage and show a warning banner.
// -------------------------------------------------------------------

import "../styles/stepper.css";

// The ordered list of normal stages (Delayed is handled separately).
const STAGES = [
  { key: "Created", label: "Created" },
  { key: "Picked up", label: "Picked up" },
  { key: "In transit", label: "In transit" },
  { key: "Out for delivery", label: "Out for delivery" },
  { key: "Delivered", label: "Delivered" },
];

export default function ProgressStepper({ status }) {
  // "Delayed" is not one of the pipeline stages, so we treat it as an
  // exception: the step before it (In transit) stays highlighted.
  const isDelayed = status === "Delayed";
  const effectiveStatus = isDelayed ? "In transit" : status;

  // Index of the current stage. -1 if unknown.
  const currentIndex = STAGES.findIndex((s) => s.key === effectiveStatus);

  return (
    <div className="stepper-wrap">
      {isDelayed && (
        <div className="stepper-warning" role="status">
          <span aria-hidden="true">⚠</span> This shipment is currently delayed.
        </div>
      )}

      <ol className="stepper" aria-label="Shipment progress">
        {STAGES.map((stage, index) => {
          // A stage is "done" if its index is below the current one.
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          let cls = "step";
          if (isDone) cls += " done";
          if (isCurrent) cls += " current";
          if (isCurrent && isDelayed) cls += " delayed";

          return (
            <li key={stage.key} className={cls} aria-current={isCurrent ? "step" : undefined}>
              <span className="step-dot" aria-hidden="true">
                {isDone ? "✓" : index + 1}
              </span>
              <span className="step-label">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
