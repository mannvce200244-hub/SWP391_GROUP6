import { useEffect, useRef, useState } from 'react'
import Input from './Input.jsx'
import { formatMoneyInput, moneyCaretPosition, parseMoneyInput } from './moneyInput.js'

export default function MoneyInput({ value, onValueChange, error, helperText, ...props }) {
  const [message, setMessage] = useState('')
  const pasted = useRef(false)
  const caretFrame = useRef(null)
  useEffect(() => () => cancelAnimationFrame(caretFrame.current), [])

  const update = (input, raw, cursor) => {
    const next = parseMoneyInput(raw, pasted.current)
    pasted.current = false
    if (next === null) {
      setMessage('Nhập số tiền như 1.250.000; phần lẻ dùng dấu phẩy, tối đa 2 chữ số.')
      return
    }
    setMessage('')
    onValueChange(next)
    const position = moneyCaretPosition(raw, cursor, formatMoneyInput(next))
    cancelAnimationFrame(caretFrame.current)
    caretFrame.current = requestAnimationFrame(() => {
      if (input.isConnected && document.activeElement === input) input.setSelectionRange(position, position)
    })
  }

  return <Input {...props} type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
    value={formatMoneyInput(value)} error={message || error}
    helperText={message || error ? undefined : helperText ?? 'Dấu chấm tách hàng nghìn; phần lẻ dùng dấu phẩy.'}
    onPaste={() => { pasted.current = true }}
    onChange={(event) => update(event.target, event.target.value, event.target.selectionStart ?? event.target.value.length)}
    onKeyDown={(event) => {
      const input = event.currentTarget
      const cursor = input.selectionStart
      if (cursor !== input.selectionEnd) return
      if (event.key === 'Backspace' && cursor > 1 && input.value[cursor - 1] === '.') {
        event.preventDefault()
        update(input, input.value.slice(0, cursor - 2) + input.value.slice(cursor), cursor - 2)
      } else if (event.key === 'Delete' && input.value[cursor] === '.') {
        event.preventDefault()
        update(input, input.value.slice(0, cursor) + input.value.slice(cursor + 2), cursor)
      }
    }} />
}
