"use client";

export default function ImageSlot({ label, url, onFile, onClear, small }: { label: string; url?: string; onFile: (f: File) => void; onClear: () => void; small?: boolean }) {
  return (
    <div className={`imgslot ${small ? "sm" : ""}`}>
      {url ? <div className="tb"><img src={url} alt="" /><button type="button" onClick={onClear} aria-label="Remover">✕</button></div> : null}
      <label className="upl">{url ? "Trocar" : label}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} /></label>
    </div>
  );
}
