# UI customize log

Append-only notes for fork-level UI changes that diverge from stock Shadcn/Radix/Base UI behavior. See also [SHADCN_STANDARDIZATION_GUIDE.md](./SHADCN_STANDARDIZATION_GUIDE.md).

---

## Radix Select popover (scroll + height)

**Files:** [src/components/ui/select.tsx](../src/components/ui/select.tsx), [src/styles/globals.css](../src/styles/globals.css)

- Capped dropdown height with `min(var(--popover-list-max-height), var(--radix-select-content-available-height))`.
- Removed default Radix `ScrollUpButton` / `ScrollDownButton` chevron strips.
- Content uses flex column with `min-h-0`; viewport uses `min-h-0 flex-1 overflow-y-auto` so the list scrolls inside the panel instead of being clipped by the parent without a scrollbar.
- Radix injects CSS that hides the select viewport scrollbar; restored visible scrollbar via shared `.popover-list-scroll` rules targeting `[data-radix-select-viewport].popover-list-scroll` with `!important` where needed.

---

## Popover list scrollbar consistency

**Date:** 2026-03-18

**Token:** `--popover-list-max-height: 18rem` in `:root` and `.dark` ([globals.css](../src/styles/globals.css)).

**Shared class:** `.popover-list-scroll` — themed thin scrollbar (Firefox `scrollbar-color`, WebKit track/thumb). Select viewport uses an additional selector block so Radix’s injected hide is overridden.

**Components updated:**

| Component            | Change                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Select               | Viewport class `popover-list-scroll`; content max-height uses token                                                       |
| Combobox             | `ComboboxContent` and `ComboboxList` max-height tied to token; list has `popover-list-scroll`                             |
| Command              | `CommandList`: `popover-list-scroll`, `max-h` = token (replaces 300px)                                                    |
| DropdownMenu         | `DropdownMenuContent` / `SubContent`: token-capped max-height, `popover-list-scroll`, submenus scroll (`overflow-y-auto`) |
| freeform-combobox    | Popup and list use token + `popover-list-scroll`                                                                          |
| address-autocomplete | Suggestions panel: token + `popover-list-scroll`                                                                          |

**Rationale:** One visual and height story for scrollable overlay lists; long submenu panels can scroll instead of clipping.
