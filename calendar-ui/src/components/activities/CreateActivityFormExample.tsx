import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAutoSave } from '../../hooks/useAutoSave';
import { createActivity } from '../../api/activitiesApi';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';

/* We'll probably delete this file when it's implemented in a few actual forms */
/**
 * Example: CreateActivityForm with Autosave Integration
 *
 * This demonstrates how to integrate the useAutoSave hook into a form component.
 * Features:
 * - Automatic draft saving while user types
 * - Load existing draft on mount
 * - Delete draft after successful submission
 * - Show save status to user
 */
export function CreateActivityFormWithAutosave() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<CreateActivityRequest>>({});

  // TODO: Replace with actual user from auth context
  const userId = 1;

  // Autosave hook
  const {
    existingDraft,
    isDraftLoading,
    isSaving,
    lastSaved,
    saveNow,
    deleteDraft,
  } = useAutoSave(
    userId,
    'activity', // formType
    formData as Record<string, any>,
    undefined, // entityId (undefined for new items)
    {
      debounceMs: 2000, // Save 2 seconds after user stops typing
      onSaveSuccess: () => {
        console.log('Draft saved successfully');
      },
      onSaveError: (error) => {
        console.error('Failed to save draft:', error);
      },
    }
  );

  // Load existing draft on mount
  useEffect(() => {
    if (existingDraft?.draftData && Object.keys(formData).length === 0) {
      console.log('Loading existing draft');
      setFormData(existingDraft.draftData as Partial<CreateActivityRequest>);
    }
  }, [existingDraft, formData]);

  // Create activity mutation
  const { mutate: submitActivity, isPending: isSubmitting } = useMutation({
    mutationFn: createActivity,
    onSuccess: (newActivity) => {
      console.log('Activity created successfully:', newActivity);

      // Delete the draft after successful submission
      deleteDraft();

      // Navigate to the new activity
      void navigate(`/activities/${newActivity.id}`);
    },
    onError: (error) => {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.startDate) {
      alert('Please fill in required fields');
      return;
    }

    // Submit the activity
    submitActivity(formData as CreateActivityRequest);
  };

  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard this draft?')) {
      deleteDraft();
      setFormData({});
    }
  };

  if (isDraftLoading) {
    return <div>Loading draft...</div>;
  }

  return (
    <div className="create-activity-form">
      <div className="form-header">
        <h1>Create New Activity</h1>

        {/* Autosave status indicator */}
        <div className="autosave-status">
          {isSaving && <span className="saving">💾 Saving draft...</span>}
          {lastSaved && !isSaving && (
            <span className="saved">
              ✓ Draft saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={formData.title || ''}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Activity title"
            required
          />
        </div>

        {/* Summary */}
        <div className="form-group">
          <label htmlFor="summary">Summary</label>
          <textarea
            id="summary"
            value={formData.summary || ''}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            placeholder="Brief description"
            rows={4}
          />
        </div>

        {/* Start Date */}
        <div className="form-group">
          <label htmlFor="startDate">Start Date *</label>
          <input
            id="startDate"
            type="date"
            value={formData.startDate || ''}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
          />
        </div>

        {/* Start Time */}
        <div className="form-group">
          <label htmlFor="startTime">Start Time</label>
          <input
            id="startTime"
            type="time"
            value={formData.startTime || ''}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
          />
        </div>

        {/* End Date */}
        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            id="endDate"
            type="date"
            value={formData.endDate || ''}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
          />
        </div>

        {/* End Time */}
        <div className="form-group">
          <label htmlFor="endTime">End Time</label>
          <input
            id="endTime"
            type="time"
            value={formData.endTime || ''}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
          />
        </div>

        {/* All Day */}
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.isAllDay || false}
              onChange={(e) =>
                setFormData({ ...formData, isAllDay: e.target.checked })
              }
            />
            All Day Event
          </label>
        </div>

        {/* Confidential */}
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.isConfidential || false}
              onChange={(e) =>
                setFormData({ ...formData, isConfidential: e.target.checked })
              }
            />
            Confidential
          </label>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating...' : 'Create Activity'}
          </button>

          <button
            type="button"
            onClick={saveNow}
            disabled={isSaving}
            className="btn-secondary"
          >
            Save Draft Now
          </button>

          <button type="button" onClick={handleDiscard} className="btn-danger">
            Discard Draft
          </button>

          <button
            type="button"
            onClick={() => void navigate('/activities')}
            className="btn-text"
          >
            Cancel
          </button>
        </div>

        {/* Helper text */}
        <p className="help-text">
          * Required fields. Your progress is automatically saved.
        </p>
      </form>

      <style>{`
        .create-activity-form {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .autosave-status {
          font-size: 0.875rem;
        }

        .autosave-status .saving {
          color: #f59e0b;
        }

        .autosave-status .saved {
          color: #10b981;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }

        .form-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-group.checkbox input {
          width: auto;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-primary {
          padding: 0.5rem 1rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 0.5rem 1rem;
          background-color: #6b7280;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .btn-danger {
          padding: 0.5rem 1rem;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
        }

        .btn-text {
          padding: 0.5rem 1rem;
          background-color: transparent;
          border: none;
          cursor: pointer;
          text-decoration: underline;
        }

        .help-text {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
