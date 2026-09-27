/**
 * A lookup failure with copy ready to show.
 * `retry` marks transient failures worth a "Try again" button.
 * `tone: "info"` marks answers that aren't faults (e.g. a private address).
 */
export class LookupError extends Error {
  constructor(code, title, detail, { retry = false, tone = "error" } = {}) {
    super(detail);
    this.name = "LookupError";
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.retry = retry;
    this.tone = tone;
  }
}

// Validation problems are shown inline under the field rather than as a notice.
export const isInputError = (err) => err?.code === "empty" || err?.code === "invalid";
