import {
  Activity,
  Building2,
  FileText,
  FolderTree,
  MapPin,
  Palette,
  Tag,
  Users,
} from 'lucide-react';

import {
  ActivityStatusesAdmin,
  CategoriesAdmin,
  CitiesAdmin,
  CommsMaterialsAdmin,
  GovernmentRepresentativesAdmin,
  MinistriesAdmin,
  TagsAdmin,
  ThemesAdmin,
} from '@/components/admin/LookupAdmins';

type Section =
  | 'categories'
  | 'cities'
  | 'comms'
  | 'representatives'
  | 'tags'
  | 'ministries'
  | 'statuses'
  | 'themes';

const sections = [
  { id: 'categories' as Section, label: 'Categories', icon: FolderTree },
  { id: 'cities' as Section, label: 'Cities', icon: MapPin },
  { id: 'comms' as Section, label: 'Communications Materials', icon: FileText },
  {
    id: 'representatives' as Section,
    label: 'Government Representatives',
    icon: Users,
  },
  { id: 'tags' as Section, label: 'Tags', icon: Tag },
  { id: 'ministries' as Section, label: 'Ministries', icon: Building2 },
  { id: 'statuses' as Section, label: 'Activity Statuses', icon: Activity },
  { id: 'themes' as Section, label: 'Themes', icon: Palette },
];

/**
 * Modern Settings Page
 * Manages all lookup data with a clean, organized interface.
 * Features quick navigation and modular admin sections.
 */
export function Settings() {
  const scrollToSection = (sectionId: Section) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Settings & Configuration
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Manage lookup data and system configuration
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Quick Navigation */}
        <div
          id="quick-navigation"
          className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 p-4 sm:p-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Quick Navigation
            </h2>
            <p className="text-sm text-slate-600">Jump to any admin section</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#section-${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(section.id);
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
        </div>

        {/* Admin Sections */}
        <div className="space-y-8">
          <div id="section-categories">
            <CategoriesAdmin />
          </div>

          <div id="section-cities">
            <CitiesAdmin />
          </div>

          <div id="section-comms">
            <CommsMaterialsAdmin />
          </div>

          <div id="section-representatives">
            <GovernmentRepresentativesAdmin />
          </div>

          <div id="section-tags">
            <TagsAdmin />
          </div>

          <div id="section-ministries">
            <MinistriesAdmin />
          </div>

          <div id="section-statuses">
            <ActivityStatusesAdmin />
          </div>

          <div id="section-themes">
            <ThemesAdmin />
          </div>
        </div>
      </div>
    </div>
  );
}
