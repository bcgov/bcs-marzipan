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
import { useState, useEffect, useCallback } from 'react';

import { useCookies } from 'react-cookie';
import {
  fetchCategories,
  fetchTags,
  fetchGovernmentRepresentatives,
  fetchUsers,
  fetchActivityStatuses,
  LookupItem,
  UserLookupItem,
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
  const [keywordFilter, setKeywordFilter] = useState<string>();
  const [tabFilterValue, setTabFilterValue] = useState<string>('all');

  const [checkedStatusValues, setCheckedStatusValues] = useState<
    Record<string, string[]>
  >({ status: [] });
  // ({ status: ["new", "reviewed", "changed", "deleted"] });
  const [checkedCategoryValues, setCheckedCategoryValues] = useState<
    Record<string, string[]>
  >({ category: [] });
  // ({ category: ["release", "issue", "event"] });
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });
  const [updatedDateRange, setUpdatedDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });
  const [createdDateRange, setCreatedDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: '', end: '' });
  const [checkedReportsValues, setCheckedReportsValues] = useState<
    Record<string, string[]>
  >({ reports: [] });
  const [checkedRepresentativesValues, setCheckedRepresentativesValues] =
    useState<Record<string, string[]>>({ representative: [] });

  const [checkedTagsValues, setCheckedTagsValues] = useState<
    Record<string, string[]>
  >({ tag: [] });
  const [checkedLeadsValues, setCheckedLeadsValues] = useState<
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

  const handleUpdatedDateRangeChange = (
    field: 'start' | 'end',
    value: string
  ) => {
    setUpdatedDateRange((prev) => {
      const updated = { ...prev, [field]: value };
      // Apply filter whenever either date changes
      applyFilters();
      return updated;
    });
  };

  const handleCreatedDateRangeChange = (
    field: 'start' | 'end',
    value: string
  ) => {
    setCreatedDateRange((prev) => {
      const updated = { ...prev, [field]: value };
      // Apply filter whenever either date changes
      applyFilters();
      return updated;
    });
  };

  // Cookie handling: "C" is for "Cookie", and that's good enough for me
  const [cookies, setCookie, removeCookie] = useCookies(['filtersCookie']);

  const handleSetCookie = useCallback(() => {
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
      createdDateRange: createdDateRange,
    };
    setCookie('filtersCookie', filterCookieValue, { path: '/' });
  }, [
    checkedStatusValues,
    checkedCategoryValues,
    keywordFilter,
    tabFilterValue,
    checkedReportsValues,
    checkedRepresentativesValues,
    checkedTagsValues,
    checkedLeadsValues,
    dateRange,
    updatedDateRange,
    createdDateRange,
    setCookie,
  ]);

  const handleRemoveCookie = () => {
    removeCookie('filtersCookie', { path: '/' });
  };

  const applyFilters = useCallback(
    (tabValue?: string, startDate?: string, endDate?: string) => {
      const currentTabValue = tabValue || tabFilterValue; // Use passed value if provided, else fall back to state
      const filterData = {
        category: {
          id: 'category',
          value: checkedCategoryValues.category || [],
        },
        status: {
          id: 'status',
          value: checkedStatusValues.status || [],
        },
        // keyword: { id: 'keyword', value: keywordFilter || '' },
        tabListFilter: { id: 'mine', value: currentTabValue },
        reports: {
          id: 'reports',
          value: checkedReportsValues.reports || [],
        },
        representatives: {
          id: 'representatives',
          value: checkedRepresentativesValues.representative || [],
        },
        tags: { id: 'tags', value: checkedTagsValues.tag || [] },
        leads: { id: 'leads', value: checkedLeadsValues.leads || [] },
      };
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
      // Add createdDateRange filter if both dates are set
      if (createdDateRange.start && createdDateRange.end) {
        filterArr.push({
          id: 'createdDateRange',
          value: {
            start: createdDateRange.start,
            end: createdDateRange.end,
          },
        });
      }
      onFiltersChanged(filterArr);
      handleSetCookie();
    },
    [
      tabFilterValue,
      checkedCategoryValues,
      checkedStatusValues,
      checkedReportsValues,
      checkedRepresentativesValues,
      checkedTagsValues,
      checkedLeadsValues,
      dateRange,
      updatedDateRange,
      createdDateRange,
      onFiltersChanged,
      handleSetCookie,
    ]
  );

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
    setCreatedDateRange({ start: '', end: '' });
    onFiltersChanged([]);
  };

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    onKeywordFilterChanged(keywordFilter || '');
  }, [keywordFilter, onKeywordFilterChanged]);

  // get Categories, Tags, etc. from API
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [tags, setTags] = useState<LookupItem[]>([]);
  const [representatives, setRepresentatives] = useState<LookupItem[]>([]);
  const [leads, setLeads] = useState<UserLookupItem[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  // TODO: when schema for these is finalized
  // const [locations, setLocations] = useState<LookupItem[]>([]);
  // const [lookAheadStatuses, setLookAheadStatuses] = useState<
  //   LookupItem[]
  // >([]);
  // const [cities, setCities] = useState<LookupItem[]>([]);
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

    fetchActivityStatuses()
      .then((data) => {
        setStatuses(data);
      })
      .catch((error) => {
        console.error('Error fetching activity statuses:', error);
      });

    fetchGovernmentRepresentatives()
      .then((data) => {
        setRepresentatives(data);
      })
      .catch((error) => {
        console.error('Error fetching representatives:', error);
      });

    // Extract unique owner IDs and event lead IDs from activities, then fetch only those users
    fetchActivities()
      .then((activities) => {
        // Get unique owner IDs and event lead IDs from activities
        const uniqueLeadIds = new Set<number>();
        activities.forEach((activity) => {
          if (activity.ownerId) {
            uniqueLeadIds.add(parseInt(activity.ownerId.toString(), 10));
          }
          if (activity.eventPlannerId) {
            uniqueLeadIds.add(parseInt(activity.eventPlannerId.toString(), 10));
          }
        });

        // If no leads found, set empty array
        if (uniqueLeadIds.size === 0) {
          setLeads([]);
          return;
        }

        // Fetch users filtered by IDs (API now supports userIds parameter)
        fetchUsers({ userIds: Array.from(uniqueLeadIds) })
          .then((users) => {
            // Sort by name
            const sortedUsers = users.sort((a, b) => {
              const nameA = a.name || a.label || '';
              const nameB = b.name || b.label || '';
              return nameA.localeCompare(nameB);
            });
            setLeads(sortedUsers);
          })
          .catch((error) => {
            console.error('Error fetching users:', error);
          });
      })
      .catch((error) => {
        console.error('Error fetching activities:', error);
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
        if (parsed.updatedDateRange)
          setUpdatedDateRange(parsed.updatedDateRange);
        if (parsed.createdDateRange)
          setCreatedDateRange(parsed.createdDateRange);
        // No applyFilters() here—let the useEffect handle it
      } catch (error) {
        // Optional: Clear the bad cookie and reset to defaults
        handleRemoveCookie();
        handleClearFilters();
        // TODO: handle error
        console.error('Error parsing filters cookie:', error);
      }
    }
  };

  useEffect(() => {
    setFiltersFromCookie();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                {lead.name || lead.label}
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
              updatedDateRange.start && updatedDateRange.end ? ' (✓)' : ''
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
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance={
              createdDateRange.start && createdDateRange.end
                ? 'primary'
                : 'secondary'
            }
          >
            {`Created${createdDateRange.start && createdDateRange.end ? ' (✓)' : ''} `}
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
                    value={createdDateRange.start}
                    onChange={(e) =>
                      handleCreatedDateRangeChange('start', e.target.value)
                    }
                    style={{ marginLeft: 8 }}
                  />
                </label>
                <label>
                  End Date:
                  <input
                    type="date"
                    value={createdDateRange.end}
                    onChange={(e) =>
                      handleCreatedDateRangeChange('end', e.target.value)
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
