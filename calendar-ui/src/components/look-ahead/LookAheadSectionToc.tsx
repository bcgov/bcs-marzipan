import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ReportDataResponse } from '@corpcal/shared/api/types';
import { resolveLookAheadSectionRows } from '@corpcal/shared/reports/look-ahead';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TOC_WIDTH_CLASS = 'w-48';
const SCROLL_MARGIN_TOP = '7.5rem';

export interface LookAheadSectionTocProps {
  displayData: ReportDataResponse | undefined;
  isLoading: boolean;
  isFresh: boolean;
  className?: string;
}

function sectionActivityCount(
  sectionId: string,
  displayData: ReportDataResponse | undefined
): number {
  if (!displayData) return 0;
  const section = displayData.sections.find((s) => s.id === sectionId);
  return section?.activities.length ?? 0;
}

export function LookAheadSectionToc({
  displayData,
  isLoading,
  isFresh,
  className,
}: LookAheadSectionTocProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const skeletonRows = useMemo(() => {
    const config = displayData?.report?.config;
    if (!config) return [];
    return resolveLookAheadSectionRows(config);
  }, [displayData?.report?.config]);

  const tocEntries = useMemo(() => {
    if (!displayData || !isFresh) return [];
    const config = displayData.report?.config;
    const labelById = new Map<string, string>();
    if (config) {
      for (const row of resolveLookAheadSectionRows(config)) {
        labelById.set(row.sectionId, row.reportLegendLabel);
      }
    }
    return [...displayData.sections]
      .filter((section) => section.activities.length > 0)
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        id: section.id,
        label: labelById.get(section.id) ?? section.name,
      }));
  }, [displayData, isFresh]);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.style.scrollMarginTop = SCROLL_MARGIN_TOP;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (tocEntries.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: `-${SCROLL_MARGIN_TOP} 0px -60% 0px`, threshold: 0 }
    );

    for (const entry of tocEntries) {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [tocEntries]);

  const showSkeleton = isLoading && tocEntries.length === 0;
  const ariaBusy = isLoading && !isFresh;

  const navList = showSkeleton ? (
    <ul className="flex flex-col gap-2" aria-hidden="true">
      {(skeletonRows.length > 0 ? skeletonRows : [{ sectionId: 'a' }]).map(
        (row) => (
          <li key={'sectionId' in row ? row.sectionId : 'a'}>
            <Skeleton className="h-4 w-full" />
          </li>
        )
      )}
    </ul>
  ) : (
    <ul className="flex flex-col gap-1">
      {tocEntries.map((entry) => (
        <li key={entry.id}>
          <button
            type="button"
            disabled={!isFresh}
            onClick={() => scrollToSection(entry.id)}
            className={cn(
              'hover:bg-accent/60 w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              activeSectionId === entry.id && 'bg-accent font-medium'
            )}
          >
            {entry.label}
            <span className="text-muted-foreground ml-1 text-xs">
              ({sectionActivityCount(entry.id, displayData)})
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <nav
        aria-label="Report sections"
        aria-busy={ariaBusy}
        className={cn(
          'sticky top-24 hidden shrink-0 lg:block',
          TOC_WIDTH_CLASS,
          className
        )}
      >
        <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
          Sections
        </p>
        {navList}
      </nav>

      <div className="mb-3 lg:hidden">
        <Select
          disabled={!isFresh || tocEntries.length === 0}
          onValueChange={(value) => scrollToSection(value)}
        >
          <SelectTrigger aria-label="Jump to section" className="w-full">
            <SelectValue placeholder="Jump to section…" />
          </SelectTrigger>
          <SelectContent>
            {tocEntries.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
