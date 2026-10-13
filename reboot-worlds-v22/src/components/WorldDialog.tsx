import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function WorldDialog({ title, children, onClose, busy = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} onClose={() => {
    const dialog = ref.current
    // Ignore queued close events from StrictMode cleanup or an already reopened dialog.
    if (!dialog?.isConnected || dialog.open) return
    if (busy) dialog.showModal()
    else onClose()
  }} className="world-dialog" aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) onClose() }}>
    <div className="dialog-heading"><div><p className="label-mono">REBOOT / BUILD YOUR WORLD</p><h2>{title}</h2></div><button type="button" aria-label="Close dialog" onClick={onClose} disabled={busy}><X size={20} /></button></div>
    {children}
  </dialog>
}
