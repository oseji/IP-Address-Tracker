import { useState } from "react";

const SEPARATOR = /[.:]/;

// Diff old → new per character position. Unchanged positions keep their
// generation (and so their DOM node), so only changed characters animate.
function diffSlots(prevSlots, prevValue, value, gen) {
  const prev = prevValue ?? "";
  const len = Math.max(prev.length, value.length);
  const slots = [];
  let rank = 0;
  for (let i = 0; i < len; i++) {
    const from = prev[i] ?? null;
    const char = value[i] ?? null;
    if (from === char && prevSlots[i]) {
      slots.push({ ...prevSlots[i], from: null, changed: false });
    } else {
      slots.push({ i, char, from, gen, rank: rank++, changed: true });
    }
  }
  return slots;
}

// Group characters into octets/hextets so long addresses wrap between groups.
function group(slots) {
  const groups = [[]];
  for (const s of slots) {
    groups.at(-1).push(s);
    if (s.char && SEPARATOR.test(s.char)) groups.push([]);
  }
  return groups.filter((g) => g.length);
}

const sizeFor = (v) => (v.length <= 15 ? "l" : v.length <= 24 ? "m" : "s");

// Measured advance widths (em) of Archivo 780 at each size's width axis,
// so the address can be sized to fill its column exactly without wrapping.
const ADVANCE = {
  l: { digit: 0.767, hex: 0.726, sep: 0.335 },
  m: { digit: 0.686, hex: 0.65, sep: 0.33 },
  s: { digit: 0.611, hex: 0.58, sep: 0.325 },
};
const emWidth = (v, size) => {
  const a = ADVANCE[size];
  return [...v].reduce(
    (n, c) => n + (SEPARATOR.test(c) ? a.sep : /\d/.test(c) ? a.digit : a.hex),
    0,
  );
};

/**
 * The looked-up address set like a QSL callsign. Fixed digit slots
 * (tabular figures); a new value swaps only the characters that differ.
 */
export default function Callsign({ value, children }) {
  const [state, setState] = useState({ value: null, slots: [], gen: 0 });

  if (value && value !== state.value) {
    const gen = state.gen + 1;
    setState({
      value,
      gen,
      slots: diffSlots(
        state.slots.filter((s) => s.char),
        state.value,
        value,
        gen,
      ),
    });
  }

  if (!state.value) {
    return (
      <div className="callsign-fit">
        <p className="callsign is-empty" aria-hidden="true" style={{ "--em": 9.4 }}>
          {[0, 1, 2, 3].map((g) => (
            <span className="callsign-group" key={g}>
              {[0, 1, 2].map((c) => (
                <span className="comb" key={c} style={{ "--rank": g * 3 + c }} />
              ))}
              {g < 3 && <span className="slot slot-sep">.</span>}
            </span>
          ))}
        </p>
        {children}
      </div>
    );
  }

  const size = sizeFor(state.value);
  return (
    <div className="callsign-fit">
      <p
        className="callsign"
        data-size={size}
        aria-hidden="true"
        style={{ "--em": emWidth(state.value, size).toFixed(3) }}
      >
        {group(state.slots).map((slots) => (
          <span className="callsign-group" key={slots[0].i}>
            {slots.map((s) => (
              <span
                className={`slot${s.char && SEPARATOR.test(s.char) ? " slot-sep" : ""}`}
                key={s.i}
              >
                {s.from && (
                  <span className="slot-ghost" key={`g${s.gen}`} style={{ "--rank": s.rank }}>
                    {s.from}
                  </span>
                )}
                {s.char && (
                  <span
                    className={`slot-char${s.changed ? " is-new" : ""}`}
                    key={`c${s.gen}`}
                    style={{ "--rank": s.rank }}
                  >
                    {s.char}
                  </span>
                )}
              </span>
            ))}
          </span>
        ))}
      </p>
      {children}
    </div>
  );
}
