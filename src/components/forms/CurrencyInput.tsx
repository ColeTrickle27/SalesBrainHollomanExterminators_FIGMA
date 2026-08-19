import { useEffect, useState, type KeyboardEvent } from "react"

interface Props {
  cents: number
  onChange: (cents: number) => void
  className?: string
  ariaLabel?: string
}

export function formatCurrencyInput(cents: number) {
  return (Math.max(0, cents) / 100).toFixed(2)
}

export function parseCurrencyInput(value: string) {
  const normalized = value.replace(/[$,\s]/g, "")
  if (normalized === "" || normalized === ".") return 0
  const dollars = Number(normalized)
  if (!Number.isFinite(dollars) || dollars < 0) return null
  return Math.round(dollars * 100)
}

export function CurrencyInput({ cents, onChange, className = "", ariaLabel }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => formatCurrencyInput(cents))

  useEffect(() => {
    if (!editing) setDraft(formatCurrencyInput(cents))
  }, [cents, editing])

  const commit = () => {
    const parsed = parseCurrencyInput(draft)
    const next = parsed ?? cents
    if (parsed !== null) onChange(parsed)
    setDraft(formatCurrencyInput(next))
    setEditing(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur()
  }

  return <input
    type="text"
    inputMode="decimal"
    aria-label={ariaLabel}
    value={draft}
    onFocus={(event) => {
      setEditing(true)
      event.currentTarget.select()
    }}
    onChange={(event) => {
      const value = event.target.value
      setDraft(value)
      const parsed = parseCurrencyInput(value)
      if (parsed !== null) onChange(parsed)
    }}
    onBlur={commit}
    onKeyDown={handleKeyDown}
    className={className}
  />
}
