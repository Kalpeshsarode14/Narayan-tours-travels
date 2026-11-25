import { useEffect, useId, useRef, useState } from "react";
import { api } from "./api";
import type { PlaceSelection } from "../../lib/booking/types";

interface Props {
  label: string;
  placeholder: string;
  value: PlaceSelection | null;
  onChange: (p: PlaceSelection | null) => void;
  error?: string;
  icon?: "pickup" | "drop" | "stop";
  onRemove?: () => void;
  autoFocus?: boolean;
  /** Pre-filled search text (e.g. "Shirdi" from a destination link). The customer still picks a suggestion. */
  initialText?: string;
}

interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
}

/**
 * Location search using Ola Maps Autocomplete through our own /api/places (the key stays on the server).
 * Only a place picked from the suggestions counts as a value; the server then confirms its exact
 * name, address and coordinates with Ola.
 */
export default function PlaceInput({ label, placeholder, value, onChange, error, icon = "pickup", onRemove, autoFocus, initialText }: Props) {
  const id = useId();
  const [text, setText] = useState(value?.address || initialText || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [mapsError, setMapsError] = useState("");
  const reqRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Show the chosen place's full name. When the value is cleared because the customer is typing,
  // keep their text as it is (clearing is done explicitly by the × button).
  useEffect(() => {
    if (value) setText(value.name && !value.address.startsWith(value.name) ? `${value.name}, ${value.address}` : value.address);
  }, [value?.placeId]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (value && text === (value.name && !value.address.startsWith(value.name) ? `${value.name}, ${value.address}` : value.address)) return;
    const q = text.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    const n = ++reqRef.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { suggestions } = await api.places(q);
        if (n !== reqRef.current) return;
        setItems(suggestions.map((x) => ({ placeId: x.placeId, main: x.main, secondary: x.secondary })));
        // Only pop the list open while the customer is in this field (not for pre-filled text on page load)
        setOpen(document.activeElement === inputRef.current);
        setActive(-1);
        setMapsError("");
      } catch (e: any) {
        if (n === reqRef.current) setMapsError(e?.message || "Location search is unavailable right now. Please try again.");
      } finally {
        if (n === reqRef.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [text]);

  async function choose(s: Suggestion) {
    setOpen(false);
    setLoading(true);
    try {
      const { place: sel } = await api.place(s.placeId);
      onChange(sel);
      setText(sel.name && !sel.address.startsWith(sel.name) ? `${sel.name}, ${sel.address}` : sel.address);
    } catch {
      setMapsError("Could not load that location. Please pick it again.");
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") setOpen(false);
  }

  const shownError = error || mapsError;
  return (
    <div className={`ntt-field ntt-place ${shownError ? "has-error" : ""}`} ref={boxRef}>
      <label htmlFor={id}>{label}</label>
      <div className="ntt-place-input">
        <span className={`ntt-dot ntt-dot-${icon}`} aria-hidden />
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={text}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-invalid={!!shownError}
          onChange={(e) => {
            setText(e.target.value);
            if (value) onChange(null); // typed text is not a valid location until a suggestion is picked
          }}
          onFocus={() => {
            if (items.length && !value) setOpen(true);
          }}
          onKeyDown={onKey}
        />
        {loading && <span className="ntt-spinner" aria-label="Loading" />}
        {!loading && text && (
          <button
            type="button"
            className="ntt-clear"
            aria-label={`Clear ${label}`}
            onClick={() => {
              setText("");
              setItems([]);
              onChange(null);
            }}
          >
            ×
          </button>
        )}
        {onRemove && (
          <button type="button" className="ntt-remove" onClick={onRemove} aria-label="Remove stop">
            Remove
          </button>
        )}
      </div>
      {open && items.length > 0 && (
        <ul className="ntt-suggestions" id={`${id}-list`} role="listbox">
          {items.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(s)}
            >
              <strong>{s.main}</strong>
              <span>{s.secondary}</span>
            </li>
          ))}
          <li className="ntt-powered" aria-hidden>
            Search by Ola Maps
          </li>
        </ul>
      )}
      {value && <p className="ntt-hint ntt-verified">✓ Exact location selected</p>}
      {!value && text.trim().length >= 2 && !open && !loading && !shownError && (
        <p className="ntt-hint">Please choose a location from the suggestions.</p>
      )}
      {shownError && <p className="ntt-error">{shownError}</p>}
    </div>
  );
}
