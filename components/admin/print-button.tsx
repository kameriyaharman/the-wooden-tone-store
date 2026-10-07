"use client";
export function PrintButton() {
  return <button onClick={() => window.print()} className="btn-gold btn-sm">Print / Save PDF</button>;
}
