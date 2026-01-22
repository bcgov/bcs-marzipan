import { Test, TestingModule } from '@nestjs/testing';
import type { LookupItem } from '@corpcal/shared/api/types';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

describe('LookupsController', () => {
  let controller: LookupsController;

  const mockLookupItems: LookupItem[] = [
    { id: 1, label: 'Category 1', value: 1 },
    { id: 2, label: 'Category 2', value: 2 },
  ];

  const mockLookupsService = {
    getCategories: jest.fn(),
    getOrganizations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupsController],
      providers: [
        {
          provide: LookupsService,
          useValue: mockLookupsService,
        },
      ],
    }).compile();

    controller = module.get<LookupsController>(LookupsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      mockLookupsService.getCategories.mockResolvedValue(mockLookupItems);

      const result = await controller.getCategories();

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('getOrganizations', () => {
    it('should return all organizations without filters', async () => {
      mockLookupsService.getOrganizations.mockResolvedValue(mockLookupItems);

      const result = await controller.getOrganizations();

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getOrganizations).toHaveBeenCalledWith({
        userId: undefined,
        role: undefined,
        organizationId: undefined,
      });
    });

    it('should return filtered organizations by userId', async () => {
      mockLookupsService.getOrganizations.mockResolvedValue(mockLookupItems);

      const result = await controller.getOrganizations(1);

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getOrganizations).toHaveBeenCalledWith({
        userId: 1,
        role: undefined,
        organizationId: undefined,
      });
    });

    it('should return filtered organizations by role', async () => {
      mockLookupsService.getOrganizations.mockResolvedValue(mockLookupItems);

      const result = await controller.getOrganizations(undefined, 'admin');

      expect(result).toEqual({
        success: true,
        data: mockLookupItems,
      });
      expect(mockLookupsService.getOrganizations).toHaveBeenCalledWith({
        userId: undefined,
        role: 'admin',
        organizationId: undefined,
      });
    });
  });
});
