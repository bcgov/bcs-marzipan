import {
  DrawerProps,
  Hamburger,
  makeStyles,
  NavCategory,
  NavCategoryItem,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  NavSubItem,
  NavSubItemGroup,
  tokens,
  Tooltip,
  useRestoreFocusTarget,
} from '@fluentui/react-components';
import {
  Board20Filled,
  Board20Regular,
  bundleIcon,
  Calendar20Filled,
  Calendar20Regular,
  HeartPulse20Filled,
  HeartPulse20Regular,
  NotePin20Filled,
  NotePin20Regular,
  PersonLightbulb20Filled,
  PersonLightbulb20Regular,
  PersonSearch20Filled,
  PersonSearch20Regular,
  Settings20Filled,
  Settings20Regular,
} from '@fluentui/react-icons';
import { useLocation } from 'react-router-dom';
import * as React from 'react';

import { PERMISSIONS } from '@corpcal/shared';

import { useAuth } from '../hooks/useAuth';

const useStyles = makeStyles({
  root: {
    overflow: 'visible',
    display: 'flex',
    height: '100vh',
    position: 'relative',
    zIndex: 2000,
  },
  nav: {
    minWidth: '260px',
    position: 'relative',
    zIndex: 2000,
  },
  content: {
    flex: '1',
    padding: '2px',
    display: 'grid',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  field: {
    display: 'flex',
    marginTop: '4px',
    marginLeft: '8px',
    flexDirection: 'column',
    gridRowGap: tokens.spacingVerticalS,
  },
});

const Settings = bundleIcon(Settings20Filled, Settings20Regular);
const Dashboard = bundleIcon(Board20Filled, Board20Regular);
const Calendar = bundleIcon(Calendar20Filled, Calendar20Regular);
// const Announcements = bundleIcon(MegaphoneLoud20Filled, MegaphoneLoud20Regular);
const EmployeeSpotlight = bundleIcon(
  PersonLightbulb20Filled,
  PersonLightbulb20Regular
);
const Search = bundleIcon(PersonSearch20Filled, PersonSearch20Regular);
// const PerformanceReviews = bundleIcon(
//   PreviewLink20Filled,
//   PreviewLink20Regular
// );
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular);
const HealthPlans = bundleIcon(HeartPulse20Filled, HeartPulse20Regular);

type DrawerType = Required<DrawerProps>['type'];

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const styles = useStyles();
  const [enabledLinks] = React.useState(true);
  const [type] = React.useState<DrawerType>('inline');
  const [isMultiple] = React.useState(true);
  const location = useLocation();
  const { hasPermission } = useAuth();

  // Check if user has permission to view settings (admin-level access)
  const canManageSettings = hasPermission(PERMISSIONS.SETTINGS.VIEW);

  // Tabster prop used to restore focus to the navigation trigger for overlay nav drawers
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const linkDestination = enabledLinks ? 'https://www.bing.com' : '';

  // Map paths to NavItem values
  const pathToValue: Record<string, string> = {
    '/dashboard': '1',
    '/': '2',
    '/drafts': '3',
    '/pitch': '4',
    '/reports/look-ahead': '7',
    // Add more mappings as needed
  };

  const selectedValue = pathToValue[location.pathname] || '2';

  return (
    <div className={styles.root}>
      <NavDrawer
        selectedValue={selectedValue}
        open={isOpen}
        type={type}
        multiple={isMultiple}
        className={styles.nav}
      >
        <NavDrawerHeader>
          <Tooltip content="Close Navigation" relationship="label">
            <Hamburger onClick={() => onToggle()} />
          </Tooltip>
        </NavDrawerHeader>

        <NavDrawerBody>
          {/* <AppItem
            icon={<PersonCircle32Regular />}
            as="a"
            href={linkDestination}
          > I kept this in case we want something here with the cool Person Icon -Alex C
            Marzipan HR
          </AppItem> */}
          <NavItem icon={<Dashboard />} as="a" href="/dashboard" value="1">
            Dashboard
          </NavItem>
          <NavItem icon={<Calendar />} as="a" href="/" value="2">
            Calendar
          </NavItem>
          <NavItem as="a" href="/drafts" icon={<EmployeeSpotlight />} value="3">
            Drafts
          </NavItem>
          <NavItem icon={<Search />} as="a" href="/pitch" value="4">
            Pitch
          </NavItem>
          <NavSectionHeader>Reporting</NavSectionHeader>
          <NavCategory value="6">
            <NavCategoryItem icon={<JobPostings />}>Reports</NavCategoryItem>
            <NavSubItemGroup>
              <NavSubItem href="/reports/look-ahead" value="7">
                Look Ahead
              </NavSubItem>
              <NavSubItem href={linkDestination} value="8">
                Analytics
              </NavSubItem>
              <NavSubItem href={linkDestination} value="9">
                Submissions
              </NavSubItem>
            </NavSubItemGroup>
          </NavCategory>

          {canManageSettings && (
            <>
              <NavSectionHeader>Manage</NavSectionHeader>
              <NavItem icon={<HealthPlans />} value="10">
                Users
              </NavItem>
              <NavCategory value="11">
                <NavItem icon={<Settings />} href="/settings" value="12">
                  Settings
                </NavItem>
                <NavSubItemGroup>
                  <NavSubItem href={linkDestination} value="13">
                    Form Templates
                  </NavSubItem>
                  <NavSubItem href={linkDestination} value="14">
                    Data Retention
                  </NavSubItem>
                </NavSubItemGroup>
              </NavCategory>
            </>
          )}
        </NavDrawerBody>
      </NavDrawer>
      <div className={styles.content}>
        {!isOpen && (
          <Tooltip content="Toggle navigation pane" relationship="label">
            <Hamburger
              onClick={() => onToggle()}
              {...restoreFocusTargetAttributes}
              aria-expanded={isOpen}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};
