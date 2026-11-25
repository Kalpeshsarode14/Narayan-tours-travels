import { useEffect, useId, useRef, useState } from "react";
import { importLibrary } from "./google-maps";
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
  prediction: any;
}

// Bias suggestions toward Maharashtra; results anywhere in India remain available.
const MAHARASHTRA_BIAS = { north: 22.1, south: 15.6, east: 80.9, west: 72.6 };

/**
 * Location search using Google Places API (New) Autocomplete Data API, with session tokens
 * (one billable session per selection). Only a selected Google place counts as a value.
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
  const sessionRef = useRef<any>(null);
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
        const places = await importLibrary("places");
        if (!sessionRef.current) sessionRef.current = new places.AutocompleteSessionToken();
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: sessionRef.current,
          includedRegionCodes: ["in"],
          locationBias: MAHARASHTRA_BIAS,
          language: "en-IN",
          region: "in",
        });
        if (n !== reqRef.current) return;
        setItems(
          suggestions
            .filter((s: any) => s.placePrediction)
            .slice(0, 6)
            .map((s: any) => ({
              placeId: s.placePrediction.placeId,
              main: s.placePrediction.mainText?.text || s.placePrediction.text.text,
              secondary: s.placePrediction.secondaryText?.text || "",
              prediction: s.placePrediction,
            }))
        );
        // Only pop the list open while the customer is in this field (not for pre-filled text on page load)
        setOpen(document.activeElement === inputRef.current);
        setActive(-1);
        setMapsError("");
      } catch (e: any) {
        if (n === reqRef.current) setMapsError(e?.message?.includes("Google Maps") ? e.message : "Location search is unavailable right now. Please try again.");
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
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] });
      sessionRef.current = null; // session ends with the details request
      const sel: PlaceSelection = {
        placeId: place.id,
        name: place.displayName || s.main,
        address: place.formattedAddress || `${s.main}, ${s.secondary}`,
        location: { lat: place.location.lat(), lng: place.location.lng() },
      };
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
            powered by Google
          </li>
        </ul>
      )}
      {value && <p className="ntt-hint ntt-verified">✓ Location verified on Google Maps</p>}
      {!value && text.trim().length >= 2 && !open && !loading && !shownError && (
        <p className="ntt-hint">Please choose a location from the suggestions.</p>
      )}
      {shownError && <p className="ntt-error">{shownError}</p>}
    </div>
  );
}
