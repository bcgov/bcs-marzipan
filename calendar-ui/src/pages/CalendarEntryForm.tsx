import * as React from 'react';
import {
  Button,
  Checkbox,
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Label,
  makeStyles,
  shorthands,
  Title3,
  Title1,
} from '@fluentui/react-components';

import { createActivity } from '../api/activitiesApi';
import { ComboBox } from '@fluentui/react';
import { Stepper } from '../components/Stepper';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '40px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
    width: '100%',
    maxWidth: '700px',
    background: '#fff',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    ...shorthands.padding('24px'),
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: '8px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
});

export const CalendarEntryForm: React.FC = () => {
  const styles = useStyles();

  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    entryType: '',
    title: '',
    summary: '',
    timeframe: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    issue: '',
    ministry: '',
    sharedWith: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void (async () => {
      try {
        const res = await createActivity(formData);
        if (!res) throw new Error('Failed to save entry');
        console.log('Entry saved:', res);
        alert('✅ Entry saved successfully!');
      } catch (err) {
        console.error(err);
        alert('❌ Failed to save entry');
      }
    })();
  };

  return (
    <div className={styles.container}>
      <Title1>New Calendar entry</Title1>
      <div>
        <Stepper currentStep={step} />
        {/* render form sections conditionally */}
        {step === 1 && <div>Details Form</div>}
        {step === 2 && <div>Schedule Form</div>}
        {step === 3 && <div>Event Form</div>}
        {step === 4 && <div>Comms Form</div>}
        {step === 5 && <div>Sharing Form</div>}
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Step 1 */}
        {step === 1 && (
          <>
            <Field label="Entry Type" required>
              <Dropdown
                placeholder="Select entry type"
                value={formData.entryType}
                onOptionSelect={(_, data) =>
                  handleChange('type', data.optionValue || '')
                }
              >
                <Option value="meeting">Meeting</Option>
                <Option value="event">Event</Option>
                <Option value="reminder">Reminder</Option>
              </Dropdown>
            </Field>

            <Field label="Title" required>
              <Input
                value={formData.title}
                onChange={(_, data) => handleChange('title', data.value)}
                required
              />
            </Field>

            <Field label="Summary">
              <Textarea
                value={formData.summary}
                onChange={(_, data) => handleChange('summary', data.value)}
                resize="vertical"
              />
            </Field>
            <Field label="Significance">
              <Textarea
                // value={formData.summary}
                onChange={(_, data) => handleChange('significance', data.value)}
                resize="vertical"
              />
            </Field>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <Field label="Timeframe" required>
              <Dropdown
                placeholder="Select timeframe"
                value={formData.timeframe}
                onOptionSelect={(_, data) =>
                  handleChange('timeframe', data.optionValue || '')
                }
              >
                <Option value="Tentative">Tentative</Option>
                <Option value="Estimated">Estimated</Option>
                <Option value="Confirmed">Confirmed</Option>
              </Dropdown>
            </Field>

            <Field
              label="Start"
              required={['estimated', 'confirmed'].includes(
                formData.timeframe.toLowerCase()
              )}
            >
              <Input
                type="date"
                value={formData.startDate}
                onChange={(_, data) => handleChange('startDate', data.value)}
                required
              />
              <Input
                type="time"
                value={formData.startTime}
                onChange={(_, data) => handleChange('startTime', data.value)}
                required
              />
            </Field>

            <Field
              label="End"
              required={['estimated', 'confirmed'].includes(formData.timeframe)}
            >
              <Input
                type="date"
                value={formData.endDate}
                onChange={(_, data) => handleChange('endDate', data.value)}
                required
              />
              <Input
                type="time"
                value={formData.endTime}
                onChange={(_, data) => handleChange('endTime', data.value)}
                required
              />
            </Field>
            <Field label="Scheduling Notes">
              <Textarea
                // value={formData.summary}
                onChange={(_, data) =>
                  handleChange('schedulingNotes', data.value)
                }
                resize="vertical"
              ></Textarea>
            </Field>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <Field label="Event Lead Organization">
              <Dropdown
                placeholder="Select Lead Organization"
                onOptionSelect={(_, data) =>
                  handleChange('ministry', data.optionValue || '')
                }
              >
                <Option value="Finance">Finance</Option>
                <Option value="Health">Health</Option>
                <Option value="Education">Education</Option>
              </Dropdown>
            </Field>
            <Field label="Event Planner">
              <Dropdown
                placeholder="Select planner"
                // onOptionSelect={(_, data) => handleChange("planner", data.optionValue || "")}
              >
                <Option value="Alice Johnson">Alice Johnson</Option>
                <Option value="Bob Smith">Bob Smith</Option>
                <Option value="Charlie Brown">Charlie Brown</Option>
                <Option value="Diana Prince">Diana Prince</Option>
              </Dropdown>
            </Field>
            <Title3>Attendees</Title3>
            <Field label="Representatives Attending ">
              <ComboBox
                placeholder="Select representatives"
                multiSelect
                // onOptionSelect={(_, data) => handleChange("representatives", data.optionValue || "")}
                options={[
                  { key: 'rep1', text: 'John Doe' },
                  { key: 'rep2', text: 'Jane Smith' },
                  { key: 'rep3', text: 'Sam Wilson' },
                  { key: 'rep4', text: 'Lucy Liu' },
                ]}
              />
            </Field>
            <Title3>Venue</Title3>
            <Field label="Street">
              <Input
                // value={formData.location}
                onChange={(_, data) => handleChange('location', data.value)}
              />
            </Field>
            <Field label="City">
              <Input
                // value={formData.city}
                onChange={(_, data) => handleChange('city', data.value)}
              />
            </Field>
            <Field label="Province/State">
              <Dropdown
                placeholder="Select province/state"
                // onOptionSelect={(_, data) => handleChange("province", data.optionValue || "")}
              >
                <Option value="Province1">Province1</Option>
                <Option value="Province2">Province2</Option>
                <Option value="State1">State1</Option>
                <Option value="State2">State2</Option>
              </Dropdown>
            </Field>
            <Field label="Country">
              <Dropdown
                placeholder="Select country"
                // onOptionSelect={(_, data) => handleChange("country", data.optionValue || "")}
              >
                <Option value="Country1">Country1</Option>
                <Option value="Country2">Country2</Option>
              </Dropdown>
            </Field>
            <Field label="Postal Code">
              <Input
                // value={formData.postalCode}
                onChange={(_, data) => handleChange('postalCode', data.value)}
              />
            </Field>
            <Title3>Media</Title3>
            <Field label="Media Invitees">
              <ComboBox
                placeholder="Select media invitees"
                multiSelect
                // onOptionSelect={(_, data) => handleChange("mediaInvitees", data.optionValue || "")}
                options={[
                  { key: 'media1', text: 'Media Outlet 1' },
                  { key: 'media2', text: 'Media Outlet 2' },
                  { key: 'media3', text: 'Media Outlet 3' },
                ]}
              />
            </Field>
            <Label>Issue</Label>
            <Input
              value={formData.issue}
              onChange={(_, data) => handleChange('issue', data.value)}
            />
          </>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <>
            <Field label="Comms Lead Oranization">
              <Dropdown
                placeholder="Select Comms Lead Organization"
                onOptionSelect={(_, data) =>
                  handleChange('commsMinistry', data.optionValue || '')
                }
              >
                <Option value="Finance">Finance</Option>
              </Dropdown>
            </Field>
            <Field label="News Release">
              <Input
                placeholder=""
                value={formData.sharedWith}
                onChange={(_, data) => handleChange('sharedWith', data.value)}
              />
            </Field>
            <Field label="Comms Materials">
              <Dropdown
                placeholder="Select materials"
                // onOptionSelect={(_, data) => handleChange("commsMaterials", data.optionValue || "")}
              >
                <Option value="Media Advisory">Media Advisory</Option>
                <Option value="News Release">News Release</Option>
                <Option value="Social Media Posts">Social Media Posts</Option>
                <Option value="Speech Notes">Speech Notes</Option>
                <Option value="Backgrounder">Backgrounder</Option>
              </Dropdown>
            </Field>
            <Field label="Translations">
              <ComboBox
                placeholder="Select languages"
                multiSelect
                // onOptionSelect={(_, data) => handleChange("translations", data.optionValue || "")}
                options={[
                  { key: 'en', text: 'English' },
                  { key: 'fr', text: 'French' },
                  { key: 'es', text: 'Spanish' },
                  { key: 'de', text: 'German' },
                  { key: 'zh', text: 'Chinese' },
                  { key: 'ar', text: 'Arabic' },
                  { key: 'ru', text: 'Russian' },
                  { key: 'pb', text: 'Punjabi' },
                ]}
              ></ComboBox>
            </Field>
          </>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <>
            <Field label="Owner">
              <Input
                placeholder="Comma-separated emails"
                value={formData.sharedWith}
                onChange={(_, data) => handleChange('sharedWith', data.value)}
              />
            </Field>
            <Field label="Can edit">
              <ComboBox
                placeholder="Select users who can edit"
                multiSelect
                // onOptionSelect={(_, data) => handleChange("canEdit", data.optionValue || "")}
                options={[
                  { key: 'user1', text: 'User One' },
                  { key: 'user2', text: 'User Two' },
                  { key: 'user3', text: 'User Three' },
                ]}
              ></ComboBox>
            </Field>
            <Field label="Shared With">
              <ComboBox
                placeholder="Select users to share with"
                multiSelect
                // onOptionSelect={(_, data) => handleChange("sharedWith", data.optionValue || "")}
                options={[
                  { key: 'userA', text: 'User A' },
                  { key: 'userB', text: 'User B' },
                  { key: 'userC', text: 'User C' },
                ]}
              ></ComboBox>
            </Field>
            <Checkbox label="Confidential"></Checkbox>
            <Field label="Calendar Visibility">
              <Dropdown
                placeholder="Select visibility"
                // onOptionSelect={(_, data) => handleChange("visibility", data.optionValue || "")}
              >
                <Option value="Private">Private</Option>
                <Option value="Internal">Internal</Option>
                <Option value="Public">Public</Option>
              </Dropdown>
            </Field>
          </>
        )}

        {/* Step 6 */}
        {step === 6 && (
          <>
            <h3>Review Your Entry</h3>
            <pre>{JSON.stringify(formData, null, 2)}</pre>
          </>
        )}

        <div className={styles.footer}>
          {step > 1 && <Button onClick={prevStep}>Back</Button>}
          <Button appearance="secondary">Save as draft</Button>
          {step < 6 ? (
            <Button appearance="primary" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button appearance="primary" type="submit">
              Submit
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
