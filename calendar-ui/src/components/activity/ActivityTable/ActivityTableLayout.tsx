import type { ReactNode, RefObject } from 'react';

import { TableScrollContainer } from '@/components/table/TableScrollContainer';

export interface ActivityTableLayoutProps {
  /** Ref forwarded to the scroll container for scroll-to-top on pagination. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Content inside the scroll area (table, loading spinner, or empty state). */
  children: ReactNode;
}

/**
 * Shared layout shell for ActivityTable: scroll container only.
 * Filter and summary rows live in the parent above this layout.
 */
export function ActivityTableLayout({
  scrollRef,
  children,
}: ActivityTableLayoutProps) {
  return (
    <TableScrollContainer ref={scrollRef}>{children}</TableScrollContainer>
  );
}
