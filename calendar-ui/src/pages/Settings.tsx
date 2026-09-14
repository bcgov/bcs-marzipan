import {
  Activity,
  Bookmark,
  Building2,
  Eraser,
  FileText,
  FolderTree,
  Info,
  ListChecks,
  Lock,
  LogIn,
  MapPin,
  Megaphone,
  Palette,
  PencilOff,
  Share2,
  Tag,
  Timer,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLE_IDS } from '@corpcal/shared';
import {
  ActivityInfoIconSettingsAdmin,
  BannerSettingsAdmin,
  RecurringLockoutBannerSettingsAdmin,
} from '@/components/admin';
import { ActivityCompletionSettingsAdmin } from '@/components/admin/ActivityCompletionSettingsAdmin';
import { EditLockIdleSettingsAdmin } from '@/components/admin/EditLockIdleSettingsAdmin';
import { LoginModalSettingsAdmin } from '@/components/admin/LoginModalSettingsAdmin';
import { LookAheadResetSettingsAdmin } from '@/components/admin/LookAheadResetSettingsAdmin';
import {
  ActivityStatusesAdmin,
  CategoriesAdmin,
  CitiesAdmin,
  CommsMaterialsAdmin,
  GovernmentRepresentativesAdmin,
  MinistriesAdmin,
  MinistryGroupsAdmin,
  PermissionsVisibilityAdminSection,
  TagsAdmin,
  ThemesAdmin,
  VenuePresetsAdmin,
} from '@/components/admin/LookupAdmins';
import { ReportCoverContactSettingsAdmin } from '@/components/admin/ReportCoverContactSettingsAdmin';
import { ReviewExemptFieldsSettingsAdmin } from '@/components/admin/ReviewExemptFieldsSettingsAdmin';
import { PageHeader } from '@/components/layout';
import {
  parseSettingsSectionHash,
  settingsSectionHash,
  SettingsSectionProvider,
  useSettingsSection,
  type SettingsSectionId,
} from '@/contexts/SettingsSectionContext';
import { useAuth } from '@/hooks/useAuth';

type Section = SettingsSectionId;

/**
 * Modern Settings Page
 * Manages all lookup data with a clean, organized interface.
 * Features quick navigation and modular admin sections.
 */
export function Settings() {
  const { user } = useAuth();
  const isSystemAdmin = user?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;
  const canManageRecurringLockout = Boolean(
    user?.permissions?.includes(PERMISSIONS.SETTINGS.MANAGE_RECURRING_LOCKOUT)
  );

  const sections = [
    {
      id: 'banner' as Section,
      label: 'System banner',
      icon: Megaphone,
      show: isSystemAdmin,
    },
    {
      id: 'recurring-lockout-banner' as Section,
      label: 'Recurring edit lockout',
      icon: PencilOff,
      show: canManageRecurringLockout,
    },
    {
      id: 'login-modal' as Section,
      label: 'Login modal',
      icon: LogIn,
      show: isSystemAdmin,
    },
    {
      id: 'report-cover-contact' as Section,
      label: 'Report PDF cover contact',
      icon: FileText,
    },
    {
      id: 'edit-lock-idle' as Section,
      label: 'Edit lock idle',
      icon: Lock,
      show: isSystemAdmin,
    },
    {
      id: 'activity-completion' as Section,
      label: 'Activity completion',
      icon: Timer,
      show: isSystemAdmin,
    },
    {
      id: 'look-ahead-reset' as Section,
      label: 'Look Ahead reset',
      icon: Eraser,
      show: isSystemAdmin,
    },
    {
      id: 'activity-info-icons' as Section,
      label: 'Activity info icons',
      icon: Info,
      show: isSystemAdmin,
    },
    {
      id: 'review-exempt-fields' as Section,
      label: 'Review-exempt fields',
      icon: ListChecks,
      show: isSystemAdmin,
    },
    {
      id: 'ministry-groups' as Section,
      label: 'Ministry groups',
      icon: Share2,
    },
    { id: 'ministries' as Section, label: 'Ministries', icon: Building2 },
    {
      id: 'representatives' as Section,
      label: 'Government representatives',
      icon: Users,
    },
    { id: 'categories' as Section, label: 'Categories', icon: FolderTree },
    { id: 'cities' as Section, label: 'Cities', icon: MapPin },
    {
      id: 'comms' as Section,
      label: 'Communications materials',
      icon: FileText,
    },
    { id: 'tags' as Section, label: 'Tags', icon: Tag },
    { id: 'statuses' as Section, label: 'Activity statuses', icon: Activity },
    { id: 'themes' as Section, label: 'Themes', icon: Palette },
    { id: 'venue-presets' as Section, label: 'Venue Presets', icon: Bookmark },
    {
      id: 'permissions-visibility' as Section,
      label: 'Permission visibility',
      icon: ListChecks,
      show: Boolean(
        user?.permissions?.includes('system.manage_permissions') ||
        user?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN
      ),
    },
  ];

  const visibleSections = sections.filter((s) => s.show !== false);

  return (
    <>
      <PageHeader title="Settings and configuration" />

      <SettingsSectionProvider>
        <SettingsPageContent visibleSections={visibleSections} />
      </SettingsSectionProvider>
    </>
  );
}

function SettingsPageContent({
  visibleSections,
}: {
  visibleSections: Array<{
    id: Section;
    label: string;
    icon: typeof Megaphone;
  }>;
}) {
  const { closeAllSections, hasOpenSections, openSection } =
    useSettingsSection();
  const [showBackToNavigation, setShowBackToNavigation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const visibleSectionIds = useMemo(
    () => new Set(visibleSections.map((section) => section.id)),
    [visibleSections]
  );

  const scrollToSection = useCallback((sectionId: Section) => {
    document
      .getElementById(`section-${sectionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const navigateToSection = useCallback(
    (sectionId: Section) => {
      openSection(sectionId);
      window.history.replaceState(null, '', settingsSectionHash(sectionId));
      requestAnimationFrame(() => scrollToSection(sectionId));
    },
    [openSection, scrollToSection]
  );

  useEffect(() => {
    const applyHash = () => {
      const sectionId = parseSettingsSectionHash(window.location.hash);
      if (sectionId && visibleSectionIds.has(sectionId)) {
        openSection(sectionId);
        requestAnimationFrame(() => scrollToSection(sectionId));
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [openSection, scrollToSection, visibleSectionIds]);

  useEffect(() => {
    const content = contentRef.current;
    let scrollContainer: HTMLElement | null = null;

    for (
      let parent = content?.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        scrollContainer = parent;
        break;
      }
    }

    const scrollTarget: Window | HTMLElement = scrollContainer ?? window;
    const handleScroll = () =>
      setShowBackToNavigation(
        (scrollContainer?.scrollTop ?? window.scrollY) > 240
      );
    handleScroll();
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div ref={contentRef} className="pb-20">
        {/* Quick Navigation */}
        <nav
          id="quick-navigation"
          aria-label="Settings quick navigation"
          className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-6">
            <div>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">
                Quick navigation
              </h2>
              <p className="text-sm text-slate-600">
                Jump to any admin section
              </p>
            </div>
            <button
              type="button"
              onClick={closeAllSections}
              disabled={!hasOpenSections}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              Close all sections
            </button>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={settingsSectionHash(section.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToSection(section.id);
                    }}
                    className="flex items-center gap-2 rounded-lg p-2 text-sm text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Admin Sections */}
        <div className="space-y-8">
          <div id="section-banner">
            <BannerSettingsAdmin />
          </div>

          <div id="section-recurring-lockout-banner">
            <RecurringLockoutBannerSettingsAdmin />
          </div>

          <div id="section-login-modal">
            <LoginModalSettingsAdmin />
          </div>

          <div id="section-report-cover-contact">
            <ReportCoverContactSettingsAdmin />
          </div>

          <div id="section-edit-lock-idle">
            <EditLockIdleSettingsAdmin />
          </div>

          <div id="section-activity-completion">
            <ActivityCompletionSettingsAdmin />
          </div>

          <div id="section-look-ahead-reset">
            <LookAheadResetSettingsAdmin />
          </div>

          <div id="section-activity-info-icons">
            <ActivityInfoIconSettingsAdmin />
          </div>

          <div id="section-review-exempt-fields">
            <ReviewExemptFieldsSettingsAdmin />
          </div>

          <div id="section-ministry-groups">
            <MinistryGroupsAdmin />
          </div>

          <div id="section-ministries">
            <MinistriesAdmin />
          </div>

          <div id="section-representatives">
            <GovernmentRepresentativesAdmin />
          </div>

          <div id="section-categories">
            <CategoriesAdmin />
          </div>

          <div id="section-cities">
            <CitiesAdmin />
          </div>

          <div id="section-comms">
            <CommsMaterialsAdmin />
          </div>

          <div id="section-tags">
            <TagsAdmin />
          </div>

          <div id="section-statuses">
            <ActivityStatusesAdmin />
          </div>

          <div id="section-themes">
            <ThemesAdmin />
          </div>

          <div id="section-venue-presets">
            <VenuePresetsAdmin />
          </div>

          <div id="section-permissions-visibility">
            <PermissionsVisibilityAdminSection />
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-200 ${
          showBackToNavigation ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showBackToNavigation}
      >
        <div className="mx-auto flex max-w-7xl justify-end">
          <button
            type="button"
            tabIndex={showBackToNavigation ? 0 : -1}
            onClick={() =>
              document.getElementById('quick-navigation')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
            className="rounded-md px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            Back to quick navigation
          </button>
        </div>
      </div>
    </>
  );
}
