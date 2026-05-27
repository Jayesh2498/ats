import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '1rem',
          fontFamily: 'inherit',
        },
      }}
    />
  )
}
