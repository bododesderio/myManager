import { SetMetadata } from '@nestjs/common';

export const RequirePlan = (...plans: string[]) => SetMetadata('requiredPlans', plans);
