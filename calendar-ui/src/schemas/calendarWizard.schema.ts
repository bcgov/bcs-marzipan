import { WizardSchema } from './types';

export const calendarWizardSchema: WizardSchema = [
  {
    key: 'details',
    title: 'Details',
    label: 'Details',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        validation: { required: true, minLength: 3 },
        colSpan: 6,
      },
      { name: 'summary', label: 'Summary', type: 'textarea', colSpan: 6 },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'event', label: 'Event' },
          { value: 'news', label: 'News Release' },
        ],
        validation: { required: true },
        colSpan: 6,
      },
      {
        name: 'ministry',
        label: 'Ministry',
        type: 'select',
        options: [
          { value: 'hlth', label: 'Ministry of Health' },
          { value: 'fin', label: 'Ministry of Finance' },
        ],
        colSpan: 6,
      },
    ],
  },
  // {
  //   key: "schedule",
  //   title: "Schedule",
  //   label: "Schedule",
  //   fields: [
  //     { name: "startDate", label: "Start Date", type: "date", validation: { required: true }, colSpan: 6 },
  //     { name: "startTime", label: "Start Time", type: "time", colSpan: 6 },
  //     { name: "endDate", label: "End Date", type: "date", colSpan: 6 },
  //     { name: "endTime", label: "End Time", type: "time", colSpan: 6 },
  //     { name: "timeframe", label: "Timeframe", type: "select", options: [
  //       { value: "estimated", label: "Estimated" },
  //       { value: "confirmed", label: "Confirmed" },
  //       { value: "flexible", label: "Flexible" },
  //     ], colSpan: 6 },
  //   ],
  // },
  // {
  //   key: "event",
  //   title: "Event",
  //   label: "Event",
  //   fields: [
  //     { name: "issue", label: "Issue", type: "text", colSpan: 12 },
  //     { name: "tags", label: "Event Tags", type: "multiselect", options: [
  //       { value: "briefing", label: "Press briefing" },
  //       { value: "policy", label: "Policy" },
  //     ], colSpan: 12 },
  //   ],
  // },
  // { key: "comms", title: "Comms", label: "Comms", fields: [
  //     { name: "channels", label: "Channels", type: "checkbox-group", options: [
  //       { value: "email", label: "Email" },
  //       { value: "sms", label: "SMS" },
  //       { value: "slack", label: "Slack" },
  //     ], colSpan: 12 },
  // ]},
  // { key: "sharing", title: "Sharing", label: "Sharing", fields: [
  //     { name: "sharedWith", label: "Share with", type: "multiselect", options: [
  //       { value: "ministry-001", label: "Ministry 001" },
  //       { value: "user-1234", label: "User 1234" },
  //     ], colSpan: 12 },
  // ]},
];
