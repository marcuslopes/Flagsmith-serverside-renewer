import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from './store/appStore'
import { PackageList } from './components/PackageList'
import { PackageDetail } from './components/PackageDetail'
import { PackageForm } from './components/PackageForm'
import { AuthGate } from './components/AuthGate'

function AppInner() {
  const init = useAppStore(s => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <PackageList />
      <PackageDetail />
      <PackageForm />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
          },
          success: {
            iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-elevated)' },
          },
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthGate>
      <AppInner />
    </AuthGate>
  )
}
