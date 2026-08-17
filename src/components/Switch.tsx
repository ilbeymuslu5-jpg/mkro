interface SwitchProps {
  checked: boolean
  onChange: () => void
  label: string
}

/**
 * The visible track is 48×28, which is too small to hit reliably on a phone.
 * The button around it is a full 44px tall and the track is centred inside, so
 * the hit area meets the target size without the control looking bulky.
 */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      aria-label={label}
      className="grid h-11 w-12 shrink-0 place-items-center"
    >
      <span
        aria-hidden="true"
        className={`relative block h-7 w-12 rounded-full transition-colors duration-200 ${
          checked ? 'bg-accent' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
