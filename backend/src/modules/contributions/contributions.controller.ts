import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import { SubmitContributionDto } from './dto/submit-contribution.dto';
import { UserAuthGuard } from '../../common/guards/user-auth.guard';

type AuthedRequest = { userId: string };

@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributions: ContributionsService) {}

  /**
   * POST /api/contributions
   * Any logged-in user can submit a product name + brand + country + ingredient list.
   * Goes live within 24h automatically, or sooner if an admin approves it.
   */
  @Post()
  @UseGuards(UserAuthGuard)
  submit(@Req() req: AuthedRequest, @Body() dto: SubmitContributionDto) {
    return this.contributions.submit(req.userId, dto);
  }
}
