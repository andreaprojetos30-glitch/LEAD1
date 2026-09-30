import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="text-center">
      <p className={`font-serif text-5xl tracking-[0.18em] ${light ? "text-gold-soft" : "text-eleva"}`}>
        ELEVA
      </p>
      <p className={`mt-1 text-sm font-semibold uppercase tracking-[0.22em] ${light ? "text-cream" : "text-gold"}`}>
        Captação de Leads
      </p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <header className="mb-5">
      {backHref ? (
        <Link href={backHref} className="mb-3 inline-flex text-sm font-semibold uppercase tracking-wide text-gold">
          Voltar
        </Link>
      ) : null}
      <h1 className="font-serif text-4xl leading-none text-eleva">{title}</h1>
      {subtitle ? <p className="mt-2 text-base text-ink/70">{subtitle}</p> : null}
    </header>
  );
}

const buttonClass = {
  primary: "bg-eleva text-cream",
  gold: "bg-gold text-eleva-deep",
  ghost: "bg-white text-eleva border border-eleva/15",
  danger: "bg-white text-red-800 border border-red-200",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonClass }) {
  return (
    <button
      {...props}
      className={`flex min-h-14 w-full items-center justify-center rounded-2xl px-4 text-center text-base font-semibold uppercase tracking-wide disabled:opacity-50 ${buttonClass[variant]} ${className}`}
    />
  );
}

export function ActionLink({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonClass;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-14 w-full items-center justify-center rounded-2xl px-4 text-center text-base font-semibold uppercase tracking-wide ${buttonClass[variant]}`}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-eleva">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-sm text-ink/60">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "min-h-14 w-full rounded-2xl border border-eleva/15 bg-white px-4 text-lg text-ink outline-none focus:border-gold";

export function TextInput({ className = "", autoComplete = "off", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} autoComplete={autoComplete} className={`${controlClass} ${className}`} />;
}

export function TextArea({
  className = "",
  autoComplete = "off",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} autoComplete={autoComplete} className={`${controlClass} min-h-28 py-3 ${className}`} />;
}

export function Choice({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-14 rounded-2xl border px-3 text-sm font-semibold uppercase tracking-wide ${
        selected ? "border-eleva bg-eleva text-cream" : "border-eleva/15 bg-white text-eleva"
      }`}
    >
      {children}
    </button>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "ok" }) {
  const toneClass = {
    info: "bg-white text-eleva",
    error: "bg-red-50 text-red-900",
    ok: "bg-eleva text-cream",
  }[tone];
  return <div className={`rounded-2xl px-4 py-3 text-base ${toneClass}`}>{children}</div>;
}

export function Loading({ label = "Carregando…" }: { label?: string }) {
  return <p className="py-16 text-center text-lg text-eleva">{label}</p>;
}
