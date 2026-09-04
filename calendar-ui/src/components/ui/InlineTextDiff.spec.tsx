import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InlineTextDiff } from './InlineTextDiff';

describe('InlineTextDiff', () => {
  it('renders deletions on the old side', () => {
    render(
      <InlineTextDiff
        oldValue="Old title"
        newValue="New title"
        mode="words"
        side="old"
      />
    );

    expect(screen.getByText('Old')).toBeInTheDocument();
    expect(screen.getByText('Old').tagName).toBe('DEL');
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  it('renders insertions on the new side', () => {
    render(
      <InlineTextDiff
        oldValue="Old title"
        newValue="New title"
        mode="words"
        side="new"
      />
    );

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('New').tagName).toBe('INS');
    expect(screen.queryByText('Old')).not.toBeInTheDocument();
  });

  it('highlights all content as insertions when old is empty', () => {
    render(
      <InlineTextDiff
        oldValue="(empty)"
        newValue="Hello world"
        mode="words"
        side="new"
      />
    );

    expect(screen.getByText('Hello world').tagName).toBe('INS');
  });
});
