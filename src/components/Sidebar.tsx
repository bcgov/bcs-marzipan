import { DrawerProps } from "@fluentui/react-components";
import * as React from "react";
import {
  AppItem,
  Hamburger,
  NavCategory,
  NavCategoryItem,
  // NavDivider,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  NavSubItem,
  NavSubItemGroup,
} from "@fluentui/react-nav-preview";

import {
  Tooltip,
  makeStyles,
  tokens,
  // useId,
  useRestoreFocusTarget,
} from "@fluentui/react-components";
import {
  Board20Filled,
  Board20Regular,
  // BoxMultiple20Filled,
  // BoxMultiple20Regular,
  // DataArea20Filled,
  // DataArea20Regular,
  // DocumentBulletListMultiple20Filled,
  // DocumentBulletListMultiple20Regular,
  HeartPulse20Filled,
  HeartPulse20Regular,
  MegaphoneLoud20Filled,
  MegaphoneLoud20Regular,
  NotePin20Filled,
  NotePin20Regular,
  // People20Filled,
  // People20Regular,
  // PeopleStar20Filled,
  // PeopleStar20Regular,
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
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    overflow: "hidden",
    display: "flex",
    height: "600px",
  },
  nav: {
    minWidth: "260px",
  },
  content: {
    flex: "1",
    padding: "2px",
    display: "grid",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  field: {
    display: "flex",
    marginTop: "4px",
    marginLeft: "8px",
    flexDirection: "column",
    gridRowGap: tokens.spacingVerticalS,
  },
});

const Person = bundleIcon(Person20Filled, Person20Regular);
const Dashboard = bundleIcon(Board20Filled, Board20Regular);
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
// const Interviews = bundleIcon(People20Filled, People20Regular);
const HealthPlans = bundleIcon(HeartPulse20Filled, HeartPulse20Regular);
// const TrainingPrograms = bundleIcon(BoxMultiple20Filled, BoxMultiple20Regular);
// const CareerDevelopment = bundleIcon(PeopleStar20Filled, PeopleStar20Regular);
// const Analytics = bundleIcon(DataArea20Filled, DataArea20Regular);
// const Reports = bundleIcon(
//   DocumentBulletListMultiple20Filled,
//   DocumentBulletListMultiple20Regular
// );

type DrawerType = Required<DrawerProps>["type"];

export const Basic = () => {
  const styles = useStyles();

  // const typeLableId = useId("type-label");
  // const linkLabelId = useId("link-label");
  // const multipleLabelId = useId("multiple-label");

  const [isOpen, setIsOpen] = React.useState(true);
  const [enabledLinks, setEnabledLinks] = React.useState(true);
  const [type, setType] = React.useState<DrawerType>("inline");
  const [isMultiple, setIsMultiple] = React.useState(true);

  // Tabster prop used to restore focus to the navigation trigger for overlay nav drawers
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const linkDestination = enabledLinks ? "https://www.bing.com" : "";

  return (
    <div className={styles.root}>
      <NavDrawer
        defaultSelectedValue="2"
        defaultSelectedCategoryValue=""
        open={isOpen}
        type={type}
        multiple={isMultiple}
        className={styles.nav}
      >
        <NavDrawerHeader>
          <Tooltip content="Close Navigation" relationship="label">
            <Hamburger onClick={() => setIsOpen(!isOpen)} />
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
          <NavItem href={linkDestination} icon={<Dashboard />} value="1">
            Entries
          </NavItem>
          <NavItem href={linkDestination} icon={<Announcements />} value="2">
            My Entries
          </NavItem>
          <NavItem
            href={linkDestination}
            icon={<EmployeeSpotlight />}
            value="3"
          >
            My Ministry Only
          </NavItem>
          <NavItem icon={<Search />} href={linkDestination} value="4">
            Shared with me
          </NavItem>
          <NavItem
            icon={<PerformanceReviews />}
            href={linkDestination}
            value="5"
          >
            Pinned
          </NavItem>
          <NavSectionHeader>Reporting</NavSectionHeader>
          <NavCategory value="6">
            <NavCategoryItem icon={<JobPostings />}>
              Reports
            </NavCategoryItem>
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
              Data
            </NavCategoryItem>
            <NavSubItemGroup>
              <NavSubItem href={linkDestination} value="13">
                Plan Information
              </NavSubItem>
              <NavSubItem href={linkDestination} value="14">
                Fund Performance
              </NavSubItem>
            </NavSubItemGroup>
          </NavCategory>
        </NavDrawerBody>
      </NavDrawer>
      <div className={styles.content}>
        {!isOpen && (
          <Tooltip content="Toggle navigation pane" relationship="label">
            <Hamburger
              onClick={() => setIsOpen(!isOpen)}
              {...restoreFocusTargetAttributes}
              aria-expanded={isOpen}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};