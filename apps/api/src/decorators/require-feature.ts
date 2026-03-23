import { SetMetadata } from '@nestjs/common';

export const RequireFeature = (feature: string) => SetMetadata('requiredFeature', feature);
