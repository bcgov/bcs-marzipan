import { Dropdown, Option, Button } from '@fluentui/react-components';

export const PaginationFooter = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '1rem',
    }}
  >
    <div>
      <Button size="small">‹ Prev</Button>
      <Button size="small" appearance="primary">
        1
      </Button>
      <Button size="small">2</Button>
      <Button size="small">3</Button>
      <span>...</span>
      <Button size="small">16</Button>
      <Button size="small">Next ›</Button>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>Show</span>
      <Dropdown defaultValue="50">
        <Option>25</Option>
        <Option>50</Option>
        <Option>100</Option>
      </Dropdown>
    </div>
  </div>
);
