# @mymanager/ui

Shared React components for `apps/web`. Web-only — these render DOM elements and
cannot be used from `apps/mobile` (React Native has no `<div>`).

## Why this exists

The audit found no shared component library and 28 one-off components in
`apps/web/components`, with the real duplication living in copy-pasted Tailwind
strings (`docs/audit-2026-07-20.md` §5.2):

| Repeated class string | Uses | Now |
|---|---|---|
| `rounded-brand border bg-white p-6 shadow-sm` | 67 | `<Card>` |
| `... border border-gray-300 px-4 py-2 focus:outline-none` | 44 | `<Input>` |
| `rounded-lg border border-gray-300 px-6 py-2.5 ...` | 35 | `<Button variant="secondary">` |
| `rounded-lg bg-[var(--color-primary)] px-6 py-2.5 ...` | 34 | `<Button>` |
| `rounded-brand border bg-white p-5 shadow-sm` | 33 | `<Card padding="md">` |
| `rounded-brand bg-brand-primary px-4 py-2 ...` | 21 | `<Button>` — *a second, drifted "primary"* |
| `fixed inset-0 z-50 flex items-center ... bg-black/40` | 14 | `<Modal>` |
| `rounded-brand border bg-white py-16 text-center` | 11 | `<EmptyState>` |

Two of those are the *same* primary button with different radius, padding and
colour syntax. That is what drift looks like before it becomes a redesign.

## The two bugs these components fix by construction

**1. Dark mode.** The app ships a full dark theme (`[data-theme="dark"]`,
`--color-bg: #0F172A`) but the markup hardcodes light-mode colours:
`bg-white` ×274, `text-gray-500` ×306, `text-gray-700` ×193,
`border-gray-300` ×162. Where a hardcoded `bg-white` meets a themed
`text-text`, the text is **white on white**. Every component here uses theme
tokens only (`bg-bg-card`, `text-text`, `border-border`), so migrating a call
site fixes its dark mode as a side effect.

**2. Focus visibility.** The hand-written input style ended in
`focus:outline-none` with only a border-colour change to indicate focus — a
WCAG 2.4.7 failure. Every interactive component here has a real
`focus-visible` ring.

## Usage

```tsx
import { Button, Card, CardHeader, Field, Input, Modal, EmptyState, Badge } from '@mymanager/ui';

<Card>
  <CardHeader title="Scheduled posts" action={<Button size="sm">New post</Button>} />
  …
</Card>

// Field wires label + description + error to the control via useId, so the
// association can't be forgotten and errors are announced (role="alert").
<Field label="Workspace name" error={errors.name} required>
  {(ids) => <Input {...ids} value={name} onChange={(e) => setName(e.target.value)} />}
</Field>

// Modal handles focus trap, focus restore, Escape and scroll lock.
<Modal
  open={open}
  onClose={close}
  title="Delete campaign?"
  description="This cannot be undone."
  closeOnOverlayClick={false}
  footer={<><Button variant="secondary" onClick={close}>Cancel</Button>
           <Button variant="danger" loading={busy} onClick={confirm}>Delete</Button></>}
>
  …
</Modal>

<EmptyState title="No posts yet" description="Create your first post to get started."
            action={<Button>New post</Button>} />

<Badge tone="success">Published</Badge>
```

## Adding a component

1. Theme tokens only. If you type `bg-white`, `text-gray-*` or `border-gray-*`,
   you have created a dark-mode bug.
2. Interactive elements need `focus-visible:outline`.
3. `forwardRef` on anything a form library may need a ref to.
4. Export from `index.ts`.

## Gotcha: Tailwind v4

`apps/web/tailwind.config.ts` is **not loaded** — the project is Tailwind v4 and
configures via `@theme` in `app/globals.css`. Two consequences:

- New design tokens go in `@theme`, not the JS config. Radius tokens were
  declared outside `@theme` and 682 `rounded-*` usages silently rendered square
  until that was fixed.
- Classes in this package are only generated because `app/globals.css` carries
  `@source "../../../packages/ui"`. v4's auto-detection does not reach into the
  monorepo's `packages/`, so without that line every class used *only* here is
  never emitted and the components render partially unstyled. Verified by
  checking a package-only class (`min-h-24`) in the built CSS.

## Migration status

Wired up and proven on `app/(dashboard)/error.tsx`. The remaining ~200 call
sites are a mechanical but reviewable follow-up — migrate per screen and check
the result in both themes, rather than as one sweeping find/replace.
