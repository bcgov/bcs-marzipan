import {
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MenuItemCheckbox,
  MenuProps,
  MenuCheckedValueChangeData,
  SearchBox,
} from '@fluentui/react-components';
import { FilterRegular } from '@fluentui/react-icons';

import { ColumnFiltersState } from '@tanstack/react-table';
import React, { useEffect } from 'react';
import { set } from 'zod';
import { eventData } from './EventTable';
import { useCookies } from 'react-cookie';
import {
  fetchCategories,
  fetchSchedulingStatuses,
  fetchTags,
  fetchGovernmentRepresentatives,
  LookupItem,
} from '../api/lookupsApi';
import { fetchActivities } from '../api/activitiesApi';

interface FilterProps {
  onFiltersChanged: (filters: ColumnFiltersState) => void;
  onKeywordFilterChanged: (keyword: string) => void;
}

export const CalendarFilters: React.FC<FilterProps> = ({
  onFiltersChanged,
  onKeywordFilterChanged,
}) => {
  const [keywordFilter, setKeywordFilter] = React.useState<string>();
  const [tabFilterValue, setTabFilterValue] = React.useState<string>('all');

  const [checkedStatusValues, setCheckedStatusValues] = React.useState<
    Record<string, string[]>
  >({ status: [] });
  // ({ status: ["new", "reviewed", "changed", "deleted"] });
  const [checkedCategoryValues, setCheckedCategoryValues] = React.useState<
    Record<string, string[]>
  >({ category: [] });
  // ({ category: ["release", "issue", "event"] });
  const [dateRange, setDateRange] = React.useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });
  const [updatedDateRange, setUpdatedDateRange] = React.useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });
  const [checkedReportsValues, setCheckedReportsValues] = React.useState<
    Record<string, string[]>
  >({ reports: [] });
  const [checkedRepresentativesValues, setCheckedRepresentativesValues] =
    React.useState<Record<string, string[]>>({ representative: [] });

  const [checkedTagsValues, setCheckedTagsValues] = React.useState<
    Record<string, string[]>
  >({ tag: [] });
  const [checkedLeadsValues, setCheckedLeadsValues] = React.useState<
    Record<string, string[]>
  >({ leads: [] });

  const onStatusChange: MenuProps['onCheckedValueChange'] = (
    _,
    { name, checkedItems }: MenuCheckedValueChangeData
  ) => {
    setCheckedStatusValues((s) => {
      return s ? { ...s, [name]: checkedItems } : { [name]: checkedItems };
    });
  };

  const onCategoryChange: MenuProps['onCheckedValueChange'] = (
    _, // e: MenuCheckedValueChangeEvent,
    { name, checkedItems }: MenuCheckedValueChangeData
  ) => {
    setCheckedCategoryValues((s) => {
      return s ? { ...s, [name]: checkedItems } : { [name]: checkedItems };
    });
  };

  const onLeadsChange: MenuProps['onCheckedValueChange'] = (
    _,
    { name, checkedItems }: MenuCheckedValueChangeData
  ) => {
    setCheckedLeadsValues((s) => {
      return s ? { ...s, [name]: checkedItems } : { [name]: checkedItems };
    });
  };

  const filterData = {
    category: { id: 'category', value: [''] },
    status: { id: 'status', value: [''] },
    // keyword: { id: 'keyword', value: '' },
    tabListFilter: { id: 'tabListFilter', value: tabFilterValue },
    reports: { id: 'reports', value: checkedReportsValues.reports || [] },
    representatives: {
      id: 'representatives',
      value: checkedRepresentativesValues.representative || [],
    },
    tags: { id: 'tags', value: checkedTagsValues.tag || [] },
    leads: { id: 'leads', value: checkedLeadsValues.leads || [] },
  };

  // Helper to handle date range change and apply filter
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange((prev) => {
      const updated = { ...prev, [field]: value };
      // Only apply filter if both dates are set
      if (updated.start && updated.end) {
        applyFilters(undefined, updated.start, updated.end);
      } else {
        applyFilters();
      }
      return updated;
    });
  };

  const handleUpdatedDateRangeChange = (field: 'start' | 'end', value: string) => {
    setUpdatedDateRange((prev) => {
      const updated = { ...prev, [field]: value };
      // Apply filter whenever either date changes
      applyFilters();
      return updated;
    });
  };

  // Cookie handling: "C" is for "Cookie", and that's good enough for me
  const [cookies, setCookie, removeCookie] = useCookies(['filtersCookie']);

  const handleSetCookie = () => {
    const filterCookieValue = {
      status: checkedStatusValues,
      category: checkedCategoryValues,
      keyword: keywordFilter,
      tab: tabFilterValue,
      reports: checkedReportsValues,
      representatives: checkedRepresentativesValues,
      tags: checkedTagsValues,
      leads: checkedLeadsValues,
      dateRange: dateRange,
      updatedDateRange: updatedDateRange,
    };
    setCookie('filtersCookie', filterCookieValue, { path: '/' });
  };

  const handleRemoveCookie = () => {
    removeCookie('filtersCookie', { path: '/' });
  };

  const applyFilters = (
    tabValue?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const currentTabValue = tabValue || tabFilterValue; // Use passed value if provided, else fall back to state
    filterData.category = {
      id: 'category',
      value: checkedCategoryValues.category || [],
    };
    filterData.status = {
      id: 'status',
      value: checkedStatusValues.status || [],
    };
    // filterData.keyword = { id: 'keyword', value: keywordFilter || '' };
    filterData.tabListFilter = { id: 'mine', value: currentTabValue };
    filterData.reports = {
      id: 'reports',
      value: checkedReportsValues.reports || [],
    };
    filterData.representatives = {
      id: 'representatives',
      value: checkedRepresentativesValues.representative || [],
    };
    filterData.tags = { id: 'tags', value: checkedTagsValues.tag || [] };
    filterData.leads = { id: 'leads', value: checkedLeadsValues.leads || [] };
    const filterArr: ColumnFiltersState = [
      filterData.category,
      filterData.status,
      // filterData.keyword,
      filterData.tabListFilter,
      filterData.reports,
      filterData.representatives,
      filterData.tags,
      filterData.leads,
    ];
    // Add dateRange filter if both dates are set
    if ((startDate && endDate) || (dateRange.start && dateRange.end)) {
      filterArr.unshift({
        id: 'dateRange',
        value: {
          start: startDate || dateRange.start,
          end: endDate || dateRange.end,
        },
      });
    }
    // Add updatedDateRange filter if both dates are set
    if (updatedDateRange.start && updatedDateRange.end) {
      filterArr.push({
        id: 'updatedDateRange',
        value: {
          start: updatedDateRange.start,
          end: updatedDateRange.end,
        },
      });
    }
    onFiltersChanged(filterArr);
    handleSetCookie();
  };

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    const newValue = data.value as string;
    setTabFilterValue(newValue);
    applyFilters(newValue); // Pass the new value directly to avoid stale state
  };

  const handleClearFilters = () => {
    setCheckedCategoryValues({ category: [] });
    setCheckedStatusValues({ status: [] });
    setKeywordFilter('');
    setTabFilterValue('all');
    setCheckedRepresentativesValues({ representative: [] });
    setCheckedReportsValues({ reports: [] });
    setCheckedTagsValues({ tag: [] });
    setCheckedLeadsValues({ leads: [] });
    setDateRange({ start: '', end: '' });
    setUpdatedDateRange({ start: '', end: '' });
    onFiltersChanged([]);
  };

  useEffect(() => {
    applyFilters();
  }, [
    checkedStatusValues,
    checkedCategoryValues,
    checkedReportsValues,
    checkedRepresentativesValues,
    checkedTagsValues,
    checkedLeadsValues,
    updatedDateRange,
  ]);

  useEffect(() => {
    onKeywordFilterChanged(keywordFilter || '');
  }, [keywordFilter]);

  // get Categories, Tags, etc. from API
  const [categories, setCategories] = React.useState<LookupItem[]>([]);
  const [tags, setTags] = React.useState<LookupItem[]>([]);
  const [representatives, setRepresentatives] = React.useState<LookupItem[]>(
    []
  );
  const [locations, setLocations] = React.useState<LookupItem[]>([]);
  const [leads, setLeads] = React.useState<LookupItem[]>([]);
  const [statuses, setStatuses] = React.useState<LookupItem[]>([]);
  const [lookAheadStatuses, setLookAheadStatuses] = React.useState<
    LookupItem[]
  >([]);
  const [cities, setCities] = React.useState<LookupItem[]>([]);
  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });

    fetchTags()
      .then((data) => {
        setTags(data);
      })
      .catch((error) => {
        console.error('Error fetching tags:', error);
      });

    fetchSchedulingStatuses()
      .then((data) => {
        setStatuses(data);
      })
      .catch((error) => {
        console.error('Error fetching statuses:', error);
      });
    fetchGovernmentRepresentatives()
      .then((data) => {
        setRepresentatives(data);
      })
      .catch((error) => {
        console.error('Error fetching representatives:', error);
      });

    // Fetch unique leads from activities
    fetchActivities()
      .then((activities) => {
        const uniqueLeads = new Set<string>();
        activities.forEach((activity) => {
          if (activity.commsLead) uniqueLeads.add(activity.commsLead);
          if (activity.eventLead) uniqueLeads.add(activity.eventLead);
        });
        const leadsArray = Array.from(uniqueLeads)
          .sort()
          .map((lead) => ({ id: lead, name: lead, label: lead, value: lead }));
        setLeads(leadsArray);
      })
      .catch((error) => {
        console.error('Error fetching leads:', error);
      });
  }, []); // Empty dependency array - only run once on mount

  const setFiltersFromCookie = () => {
    const filterCookie = cookies['filtersCookie'];
    if (filterCookie) {
      try {
        // Parse the JSON string back to an object
        const parsed = filterCookie;
        if (parsed.status) setCheckedStatusValues(parsed.status);
        if (parsed.category) setCheckedCategoryValues(parsed.category);
        if (parsed.keyword !== undefined) setKeywordFilter(parsed.keyword); // Handle null/undefined
        if (parsed.tab) setTabFilterValue(parsed.tab);
        if (parsed.reports) setCheckedReportsValues(parsed.reports);
        if (parsed.representatives)
          setCheckedRepresentativesValues(parsed.representatives);
        if (parsed.tags) setCheckedTagsValues(parsed.tags);
        if (parsed.leads) setCheckedLeadsValues(parsed.leads);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.updatedDateRange) setUpdatedDateRange(parsed.updatedDateRange);
        // No applyFilters() here—let the useEffect handle it
      } catch (error) {
        // Optional: Clear the bad cookie and reset to defaults
        handleRemoveCookie();
        handleClearFilters();
      }
    }
  };

  useEffect(() => {
    setFiltersFromCookie();
  }, []);

  return (
    <div>
      <TabList selectedValue={tabFilterValue} onTabSelect={onTabSelect}>
        <Tab value="all">All</Tab>
        <Tab value="mine">My entries</Tab>
        <Tab value="recent">Recent</Tab>
        <Tab value="ministry" disabled>
          HLTH
        </Tab>{' '}
        {/* I assume this becomes user's ministry, whatever it is */}
        <Tab value="shared">Shared</Tab>
      </TabList>

      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton className="dropdownItem">Date</MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <label>
                  Start Date:
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      handleDateRangeChange('start', e.target.value)
                    }
                    style={{ marginLeft: 8 }}
                  />
                </label>
                <label>
                  End Date:
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      handleDateRangeChange('end', e.target.value)
                    }
                    style={{ marginLeft: 8 }}
                  />
                </label>
              </div>
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu
        checkedValues={checkedCategoryValues}
        onCheckedValueChange={onCategoryChange}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              checkedCategoryValues['category']?.length > 0
                ? 'primary'
                : 'secondary'
            }
          >
            {`Category${
              checkedCategoryValues['category']?.length > 0
                ? ' (' + checkedCategoryValues['category'].length + ')'
                : ''
            } `}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {categories.map((category) => (
              <MenuItemCheckbox
                key={category.id}
                name="category"
                value={category.label}
              >
                {category.label}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu
        checkedValues={checkedStatusValues}
        onCheckedValueChange={onStatusChange}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              checkedStatusValues['status']?.length > 0
                ? 'primary'
                : 'secondary'
            }
          >{`Status${
            checkedStatusValues['status']?.length > 0
              ? ' (' + checkedStatusValues['status'].length + ')'
              : ''
          } `}</MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {statuses.map((status) => (
              <MenuItemCheckbox
                key={status.id}
                name="status"
                value={status.label}
              >
                {status.label}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton disabled>Look ahead</MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Item a</MenuItem>
            <MenuItem>Item b</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu
        checkedValues={checkedReportsValues}
        onCheckedValueChange={(_, { name, checkedItems }) => {
          setCheckedReportsValues((prev) => ({
            ...prev,
            [name]: checkedItems,
          }));
        }}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              checkedReportsValues['reports']?.length > 0
                ? 'primary'
                : 'secondary'
            }
          >
            {`Reports${
              checkedReportsValues['reports']?.length > 0
                ? ' (' + checkedReportsValues['reports'].length + ')'
                : ''
            } `}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {/* todo: we will need to map this to something concrete one day soon, 
            like from people in a contacts who are "reports", whatever that means. */}
            <MenuItemCheckbox name="reports" value="Report One">
              Report One
            </MenuItemCheckbox>
            <MenuItemCheckbox name="reports" value="Report Two">
              Report Two
            </MenuItemCheckbox>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton>Location</MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {/* same thing, will need actual location data one day */}
            <MenuItemCheckbox
              name="location"
              value="BC Legislature, Victoria BC"
            >
              BC Legislature, Victoria BC
            </MenuItemCheckbox>
            <MenuItemCheckbox name="location" value="Main Office, Vancouver BC">
              Main Office, Vancouver BC
            </MenuItemCheckbox>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu
        checkedValues={checkedRepresentativesValues}
        onCheckedValueChange={(_, { name, checkedItems }) => {
          setCheckedRepresentativesValues((prev) => ({
            ...prev,
            [name]: checkedItems,
          }));
        }}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              checkedRepresentativesValues['representative']?.length > 0
                ? 'primary'
                : 'secondary'
            }
          >
            {`Representatives${
              checkedRepresentativesValues['representative']?.length > 0
                ? ' (' +
                  checkedRepresentativesValues['representative'].length +
                  ')'
                : ''
            } `}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {representatives.map((rep) => (
              <MenuItemCheckbox
                key={rep.id}
                name="representative"
                value={rep.label}
              >
                {rep.label}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu
        checkedValues={checkedLeadsValues}
        onCheckedValueChange={onLeadsChange}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              checkedLeadsValues['leads']?.length > 0 ? 'primary' : 'secondary'
            }
          >
            {`Leads${
              checkedLeadsValues['leads']?.length > 0
                ? ' (' + checkedLeadsValues['leads'].length + ')'
                : ''
            } `}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {leads.map((lead) => (
              <MenuItemCheckbox
                key={lead.id}
                name="leads"
                value={lead.id.toString()}
              >
                {lead.name}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              updatedDateRange.start && updatedDateRange.end
                ? 'primary'
                : 'secondary'
            }
          >
            {`Updated${
              updatedDateRange.start && updatedDateRange.end
                ? ' (✓)'
                : ''
            } `}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <label>
                  Start Date:
                  <input
                    type="date"
                    value={updatedDateRange.start}
                    onChange={(e) =>
                      handleUpdatedDateRangeChange('start', e.target.value)
                    }
                    style={{ marginLeft: 8 }}
                  />
                </label>
                <label>
                  End Date:
                  <input
                    type="date"
                    value={updatedDateRange.end}
                    onChange={(e) =>
                      handleUpdatedDateRangeChange('end', e.target.value)
                    }
                    style={{ marginLeft: 8 }}
                  />
                </label>
              </div>
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu
        checkedValues={checkedTagsValues}
        onCheckedValueChange={(_, { name, checkedItems }) => {
          setCheckedTagsValues((prev) => ({
            ...prev,
            [name]: checkedItems,
          }));
        }}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              checkedTagsValues['tag']?.length > 0 ? 'primary' : 'secondary'
            }
          >
            {`Tags${
              checkedTagsValues['tag']?.length > 0
                ? ' (' + checkedTagsValues['tag'].length + ')'
                : ''
            } `}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {tags.map((tag) => (
              <MenuItemCheckbox key={tag.id} name="tag" value={tag.label}>
                {tag.label}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton appearance="subtle" icon={<FilterRegular />}>
            Filter
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={handleClearFilters}>Reset all</MenuItem>
            <MenuItem disabled>Save</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <SearchBox
        placeholder="Search"
        onChange={(_, data) => {
          setKeywordFilter(data.value);
        }}
      />
    </div>
  );
};
