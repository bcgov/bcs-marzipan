import {
  Button,
  Checkbox,
  Dropdown,
  Field,
  Input,
  Option,
  Textarea,
} from "@fluentui/react-components";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FormSection } from "../components/FormSection";

export const OverviewPage = () => {
  const [form, setForm] = useState({
    category: "Release",
    releaseType: "News release",
    title: "",
    summary: "",
    significance: "",
    strategy: "",
    issue: false,
    placeholder: false,
    jointRelease: "Yes",
    leadMinistry: "GCPEHQ",
    jointMinistry: "",
    sharedWith: [],
    commsContact: "Sharon Hsiao",
    tags: [],
  });

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ padding: "48px max(10%, 48px)"}}>
      <h2>Overview</h2>

      <FormSection title="Basic Info">
        <Field label="Category">
            <Dropdown
            value={form.category}
            onOptionSelect={(_, data) => handleChange("category", data.optionValue)}
            placeholder="Select a category"
            aria-label="Category"
            aria-required="true"
            >
            <Option value="Release">Release</Option>
            <Option value="Update">Update</Option>
            </Dropdown>
        </Field>

        <Field label="Release type">
            <Dropdown
            value={form.releaseType}
            onOptionSelect={(_, data) => handleChange("releaseType", data.optionValue)}
            aria-label="Release type"
            aria-required="true"
            >
            <Option value="News release">News release</Option>
            <Option value="Statement">Statement</Option>
            </Dropdown>
        </Field>

        <Field label="Title">
            <Input
            aria-label="Title"
            placeholder="Be clear and descriptive"
            value={form.title}
            onChange={(_, data) => handleChange("title", data.value)}
            />
        </Field>

        <Field label="Summary">
            <Textarea
            aria-label="Summary"
            value={form.summary}
            placeholder="Give key details..."
            onChange={(_, data) => handleChange("summary", data.value)}
            />
        </Field>

        <Field label="Significance">
            <Textarea
            aria-label="Significance"
            value={form.significance}
            placeholder="Describe how this will impact..."
            onChange={(_, data) => handleChange("significance", data.value)}
            />
        </Field>
        
        <Field label="Strategy">
            <Textarea
            aria-label="Strategy"
            value={form.strategy}
            placeholder="How will you promote..."
            onChange={(_, data) => handleChange("strategy", data.value)}
            />
        </Field>
      </FormSection>

      <FormSection title="Mark as">
        <Checkbox
          label="Issue"
          checked={form.issue}
          onChange={(_, data) => handleChange("issue", data.checked)}
        />
        <Checkbox
          label="Placeholder"
          checked={form.placeholder}
          onChange={(_, data) => handleChange("placeholder", data.checked)}
        />
      </FormSection>

      <FormSection title="Ministry">
        <Field label="Joint release?">
            <Dropdown
            aria-label="Joint release?"
            value={form.jointRelease}
            onOptionSelect={(_, data) => handleChange("jointRelease", data.optionValue)}
            >
            <Option value="Yes">Yes</Option>
            <Option value="No">No</Option>
            </Dropdown>
        </Field>

        <Field label="Lead ministry">
            <Input
            aria-label="Lead ministry"
            value={form.leadMinistry}
            onChange={(_, data) => handleChange("leadMinistry", data.value)}
            />
        </Field>

        <Field label="Joint ministry">
            <Dropdown
            aria-label="Joint ministry"
            placeholder="Select ministry"
            value={form.jointMinistry}
            onOptionSelect={(_, data) => handleChange("jointMinistry", data.optionValue)}
            >
            <Option value="Health">Health</Option>
            <Option value="Finance">Finance</Option>
            </Dropdown>
        </Field>

        <Field label="Shared with">
            <Dropdown
            aria-label="Shared with"
            multiselect
            selectedOptions={form.sharedWith}
            onOptionSelect={(_, data) => handleChange("sharedWith", data.selectedOptions)}
            >
            <Option value="Education">Education</Option>
            <Option value="Tech">Tech</Option>
            <Option value="Justice">Justice</Option>
            </Dropdown>
        </Field>
      </FormSection>

      <FormSection title="Comms contact">
        <Field label="Comms contact">
            <Input
            aria-label="Comms contact"
            value={form.commsContact}
            onChange={(_, data) => handleChange("commsContact", data.value)}
            />
        </Field>
      </FormSection>

      <FormSection title="HQ">
        <Field label="Tags">
            <Dropdown
            multiselect
            selectedOptions={form.tags}
            onOptionSelect={(_, data) => handleChange("tags", data.selectedOptions)}
            aria-label="Tags"
            placeholder="Add label"
            >
            <Option value="Urgent">Urgent</Option>
            <Option value="Media">Media</Option>
            <Option value="Draft">Draft</Option>
            </Dropdown>
        </Field>
      </FormSection>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link to="/" style={{ textDecoration: "none" }}>
            <Button appearance="secondary">Cancel</Button>
        </Link>
        <Button appearance="primary" onClick={() => console.log("Saving...", form)}>
          Save and continue
        </Button>
      </div>
    </div>
  );
};
