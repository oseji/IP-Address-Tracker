const MINUS = "−";

/** "-07:00" → -420. Returns null when absent or malformed. */
export function parseOffset(tz) {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(tz ?? "");
  if (!m) return null;
  const mins = Number(m[2]) * 60 + Number(m[3]);
  return m[1] === "-" ? -mins : mins;
}

const pad = (n) => String(n).padStart(2, "0");

export function formatOffset(mins) {
  if (mins === null) return "";
  if (mins === 0) return "UTC";
  const a = Math.abs(mins);
  return `UTC${mins < 0 ? MINUS : "+"}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

const clock = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" });
const plainClock = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

/** Wall-clock time at a fixed UTC offset. */
export function timeAt(offset, now) {
  const shifted = new Date(now.getTime() + offset * 60000);
  return {
    time: clock.format(shifted),
    day: weekday.format(shifted),
    hours: shifted.getUTCHours() + shifted.getUTCMinutes() / 60,
  };
}

export const localClock = (date) => plainClock.format(date);

export const visitorOffset = (now) => -now.getTimezoneOffset();

export const hoursOfDay = (date) => date.getHours() + date.getMinutes() / 60;

/** "3 h behind you", "5 h 30 min ahead of you", "Same time as you". */
export function relativeToVisitor(offset, now) {
  const diff = offset - visitorOffset(now);
  if (diff === 0) return "Same time as you";
  const a = Math.abs(diff);
  const h = Math.floor(a / 60);
  const m = a % 60;
  const span = [h && `${h} h`, m && `${m} min`].filter(Boolean).join(" ");
  return `${span} ${diff < 0 ? "behind" : "ahead of"} you`;
}
