import { Module } from '@nestjs/common';
import { ShopsModule } from '../shops/shops.module';
import { BidRequestsController } from './bid-requests.controller';
import { PartnerBidRequestsController } from './partner-bid-requests.controller';
import { AdminBidRequestsController } from './admin-bid-requests.controller';
import { BidRequestsService } from './bid-requests.service';

@Module({
  imports: [ShopsModule],
  controllers: [
    BidRequestsController,
    PartnerBidRequestsController,
    AdminBidRequestsController,
  ],
  providers: [BidRequestsService],
})
export class BidRequestsModule {}
