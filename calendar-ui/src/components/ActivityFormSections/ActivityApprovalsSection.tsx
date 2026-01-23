import { UseFormReturn } from 'react-hook-form';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest;

type ActivityApprovalsSectionProps = {
  form: UseFormReturn<FormData>;
};

export const ActivityApprovalsSection: React.FC<
  ActivityApprovalsSectionProps
> = ({ form }) => {
  return (
    <ActivityFormSection title="Approvals">
      {/* Approvals content can be added here in the future */}
      <div className="text-muted-foreground text-sm">
        No approval fields yet.
      </div>
    </ActivityFormSection>
  );
};
