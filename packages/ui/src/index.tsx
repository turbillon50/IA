import type { ReactNode } from 'react';
export function Avatar({ name, kind = 'ai' }: { name: string; kind?: 'ai' | 'human' }) { return <span className={`avatar ${kind}`} aria-label={`${kind === 'ai' ? 'IA' : 'Persona'}: ${name}`}>{name.slice(0,1)}{kind === 'ai' && <small>IA</small>}</span>; }
export function Badge({ children }: { children: ReactNode }) { return <span className="badge">{children}</span>; }
export function EmptyState({ title, children }: { title: string; children: ReactNode }) { return <div className="empty"><h2>{title}</h2><p>{children}</p></div>; }
export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className="button" {...props}>{children}</button>; }
