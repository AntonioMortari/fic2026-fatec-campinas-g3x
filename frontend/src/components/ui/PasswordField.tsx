import { useState } from 'react'
import { TextField, type TextFieldProps } from './TextField'

export function PasswordField(props: Omit<TextFieldProps, 'type' | 'addon'>) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      addon={
        <button
          type="button"
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((value) => !value)}
          className="mr-1 inline-flex min-h-11 cursor-pointer items-center px-3 text-small font-semibold text-blue-deep"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      }
    />
  )
}
