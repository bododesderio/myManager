import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ExchangeRatesService } from './exchange-rates.service';

@ApiTags('Exchange Rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get(':currency')
  @Public()
  @ApiOperation({ summary: 'Get the latest USD to target currency exchange rate' })
  async getRate(@Param('currency') currency: string) {
    return this.exchangeRatesService.getLatestRate(currency);
  }
}
