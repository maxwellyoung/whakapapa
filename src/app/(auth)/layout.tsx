export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-shell min-h-screen px-4 py-10">
      <div className="auth-shell__grid" aria-hidden="true" />
      <div className="auth-shell__glow" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[28rem]">
        {children}
      </div>
    </div>
  )
}
