import { DrawerProps } from '@fluentui/react-components';
import * as React from 'react';

import { Link, useLocation } from 'react-router-dom';
import {
  AppItem,
  Hamburger,
  NavCategory,
  NavCategoryItem,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  NavSubItem,
  NavSubItemGroup,
  Tooltip,
  makeStyles,
  tokens,
  useRestoreFocusTarget,
} from '@fluentui/react-components';
import {
  Board20Filled,
  Board20Regular,
  HeartPulse20Filled,
  HeartPulse20Regular,
  MegaphoneLoud20Filled,
  MegaphoneLoud20Regular,
  NotePin20Filled,
  NotePin20Regular,
  Person20Filled,
  PersonLightbulb20Filled,
  PersonLightbulb20Regular,
  Person20Regular,
  PersonSearch20Filled,
  PersonSearch20Regular,
  PreviewLink20Filled,
  PreviewLink20Regular,
  bundleIcon,
  PersonCircle32Regular,
  Calendar20Regular,
  Calendar20Filled,
} from '@fluentui/react-icons';

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

const Person = bundleIcon(Person20Filled, Person20Regular);
const Dashboard = bundleIcon(Board20Filled, Board20Regular);
const Calendar = bundleIcon(Calendar20Filled, Calendar20Regular);
const Announcements = bundleIcon(MegaphoneLoud20Filled, MegaphoneLoud20Regular);
const EmployeeSpotlight = bundleIcon(
  PersonLightbulb20Filled,
  PersonLightbulb20Regular
);
const Search = bundleIcon(PersonSearch20Filled, PersonSearch20Regular);
const PerformanceReviews = bundleIcon(
  PreviewLink20Filled,
  PreviewLink20Regular
);
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular);
const HealthPlans = bundleIcon(HeartPulse20Filled, HeartPulse20Regular);

type DrawerType = Required<DrawerProps>['type'];

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const styles = useStyles();
  const [enabledLinks, setEnabledLinks] = React.useState(true);
  const [type, setType] = React.useState<DrawerType>('inline');
  const [isMultiple, setIsMultiple] = React.useState(true);
  const location = useLocation();

  // Tabster prop used to restore focus to the navigation trigger for overlay nav drawers
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const linkDestination = enabledLinks ? 'https://www.bing.com' : '';

  // Map paths to NavItem values
  const pathToValue: Record<string, string> = {
    '/dashboard': '1',
    '/': '2',
    '/drafts': '3',
    '/pitch': '4',
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
          <AppItem
            icon={<PersonCircle32Regular />}
            as="a"
            href={linkDestination}
          >
            Marzipan HR
          </AppItem>
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
              <NavSubItem href={linkDestination} value="7">
                Analytics
              </NavSubItem>
              <NavSubItem href={linkDestination} value="8">
                Submissions
              </NavSubItem>
            </NavSubItemGroup>
          </NavCategory>

          <NavSectionHeader>Manage</NavSectionHeader>
          <NavItem icon={<HealthPlans />} value="10">
            Users
          </NavItem>
          <NavCategory value="11">
            <NavCategoryItem icon={<Person />} value="12">
              Settings
            </NavCategoryItem>
            <NavSubItemGroup>
              <NavSubItem href={linkDestination} value="13">
                Form Templates
              </NavSubItem>
              <NavSubItem href={linkDestination} value="14">
                Data Retention
              </NavSubItem>
            </NavSubItemGroup>
          </NavCategory>
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
