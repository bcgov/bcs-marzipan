import { describe, expect, it } from 'vitest';

import {
  buildReviewDiffLookups,
  type NameIdRow,
  type TranslationLanguageRow,
} from './build-review-diff-lookups';

const categories: NameIdRow[] = [
  { id: 1, name: 'announcements', displayName: 'Announcements' },
  { id: 2, name: 'events', displayName: 'Events' },
];

const commsMaterials: NameIdRow[] = [
  { id: 10, name: 'backgrounder', displayName: 'Backgrounder' },
  { id: 11, name: 'media-advisory', displayName: 'Media Advisory' },
];

const translationLanguages: TranslationLanguageRow[] = [
  { id: 20, name: 'French', displayName: 'French', shortcode: 'fr' },
  { id: 21, name: 'Spanish', displayName: 'Spanish', shortcode: 'es' },
  { id: 22, name: 'Cree', displayName: 'Cree', shortcode: null },
];

const sharedWithTeams: NameIdRow[] = [
  { id: 30, name: 'Team Alpha', displayName: 'Team Alpha' },
  { id: 31, name: 'team-beta', displayName: 'Team Beta' },
];

describe('buildReviewDiffLookups', () => {
  const lookups = buildReviewDiffLookups({
    categories,
    commsMaterials,
    translationLanguages,
    sharedWithTeams,
  });

  describe('categoryNameToId', () => {
    it('resolves by displayName (case-insensitive)', () => {
      expect(lookups.categoryNameToId!('announcements')).toBe(1);
      expect(lookups.categoryNameToId!('EVENTS')).toBe(2);
    });

    it('resolves by name', () => {
      expect(lookups.categoryNameToId!('events')).toBe(2);
    });

    it('trims whitespace', () => {
      expect(lookups.categoryNameToId!('  Announcements  ')).toBe(1);
    });

    it('returns undefined for unknown names', () => {
      expect(lookups.categoryNameToId!('nonexistent')).toBeUndefined();
    });
  });

  describe('commsMaterialNameToId', () => {
    it('resolves by displayName', () => {
      expect(lookups.commsMaterialNameToId!('Backgrounder')).toBe(10);
    });

    it('resolves by name (case-insensitive)', () => {
      expect(lookups.commsMaterialNameToId!('MEDIA-ADVISORY')).toBe(11);
    });
  });

  describe('translationLanguageNameToId', () => {
    it('resolves by shortcode', () => {
      expect(lookups.translationLanguageNameToId!('fr')).toBe(20);
      expect(lookups.translationLanguageNameToId!('ES')).toBe(21);
    });

    it('resolves by name when shortcode is null', () => {
      expect(lookups.translationLanguageNameToId!('Cree')).toBe(22);
    });

    it('resolves by displayName', () => {
      expect(lookups.translationLanguageNameToId!('spanish')).toBe(21);
    });

    it('prefers shortcode over name/displayName when both match different rows', () => {
      expect(lookups.translationLanguageNameToId!('fr')).toBe(20);
    });
  });

  describe('sharedWithTeamNameToId', () => {
    it('resolves by displayName', () => {
      expect(lookups.sharedWithTeamNameToId!('Team Alpha')).toBe(30);
    });

    it('resolves by name', () => {
      expect(lookups.sharedWithTeamNameToId!('team-beta')).toBe(31);
    });
  });

  it('omits sharedWithTeamNameToId when no teams provided', () => {
    const noTeams = buildReviewDiffLookups({
      categories,
      commsMaterials,
      translationLanguages,
    });
    expect(noTeams.sharedWithTeamNameToId).toBeUndefined();
  });

  it('omits sharedWithTeamNameToId when teams array is empty', () => {
    const empty = buildReviewDiffLookups({
      categories,
      commsMaterials,
      translationLanguages,
      sharedWithTeams: [],
    });
    expect(empty.sharedWithTeamNameToId).toBeUndefined();
  });
});
