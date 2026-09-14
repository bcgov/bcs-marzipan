import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type SettingsSectionId =
  | 'banner'
  | 'recurring-lockout-banner'
  | 'login-modal'
  | 'edit-lock-idle'
  | 'activity-completion'
  | 'look-ahead-reset'
  | 'activity-info-icons'
  | 'report-cover-contact'
  | 'review-exempt-fields'
  | 'ministry-groups'
  | 'categories'
  | 'cities'
  | 'comms'
  | 'representatives'
  | 'tags'
  | 'ministries'
  | 'statuses'
  | 'themes'
  | 'venue-presets'
  | 'permissions-visibility';

export function parseSettingsSectionHash(
  hash: string
): SettingsSectionId | null {
  const prefix = '#section-';
  if (!hash.startsWith(prefix)) return null;
  return hash.slice(prefix.length) as SettingsSectionId;
}

export function settingsSectionHash(sectionId: SettingsSectionId): string {
  return `#section-${sectionId}`;
}

interface SettingsSectionContextValue {
  openSectionIds: ReadonlySet<SettingsSectionId>;
  openSection: (sectionId: SettingsSectionId) => void;
  toggleSection: (sectionId: SettingsSectionId) => void;
  closeAllSections: () => void;
  isSectionOpen: (sectionId: SettingsSectionId) => boolean;
  hasOpenSections: boolean;
}

const SettingsSectionContext = createContext<
  SettingsSectionContextValue | undefined
>(undefined);

export function SettingsSectionProvider({ children }: { children: ReactNode }) {
  const [openSectionIds, setOpenSectionIds] = useState<Set<SettingsSectionId>>(
    () => new Set()
  );

  const openSection = useCallback((sectionId: SettingsSectionId) => {
    setOpenSectionIds((current) => {
      if (current.has(sectionId)) return current;
      const next = new Set(current);
      next.add(sectionId);
      return next;
    });
  }, []);

  const toggleSection = useCallback((sectionId: SettingsSectionId) => {
    setOpenSectionIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const closeAllSections = useCallback(() => {
    setOpenSectionIds(new Set());
  }, []);

  const isSectionOpen = useCallback(
    (sectionId: SettingsSectionId) => openSectionIds.has(sectionId),
    [openSectionIds]
  );

  const hasOpenSections = openSectionIds.size > 0;

  const value = useMemo(
    () => ({
      openSectionIds,
      openSection,
      toggleSection,
      closeAllSections,
      isSectionOpen,
      hasOpenSections,
    }),
    [
      openSectionIds,
      openSection,
      toggleSection,
      closeAllSections,
      isSectionOpen,
      hasOpenSections,
    ]
  );

  return (
    <SettingsSectionContext.Provider value={value}>
      {children}
    </SettingsSectionContext.Provider>
  );
}

export function useSettingsSection(): SettingsSectionContextValue {
  const context = useContext(SettingsSectionContext);
  if (!context) {
    throw new Error(
      'useSettingsSection must be used within SettingsSectionProvider'
    );
  }
  return context;
}

export function useSettingsSectionOptional():
  | SettingsSectionContextValue
  | undefined {
  return useContext(SettingsSectionContext);
}
