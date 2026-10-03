import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { OumaService } from './ouma.service';
import { UserAuthGuard } from '../../common/guards/user-auth.guard';
import { GetRoutineDto, CreateRoutineStepDto, StreakHistoryQueryDto, UpdateRoutineStepDto, ImportHistoryDto } from './dto/routine.dto';
import { UpdateNotificationPreferencesDto, SaveScanDto } from './dto/notification-preferences.dto';

type AuthedRequest = { userId: string };

@Controller('ouma')
export class OumaController {
  constructor(private readonly ouma: OumaService) {}

  @Get('routine')
  @UseGuards(UserAuthGuard)
  getRoutine(@Req() req: AuthedRequest, @Query() query: GetRoutineDto) {
    return this.ouma.getRoutine(req.userId, query.type);
  }

  @Post('routine/steps')
  @UseGuards(UserAuthGuard)
  createStep(@Req() req: AuthedRequest, @Body() dto: CreateRoutineStepDto) {
    return this.ouma.createStep(req.userId, dto);
  }

  @Patch('routine/steps/:id/toggle')
  @UseGuards(UserAuthGuard)
  toggleStep(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ouma.toggleStep(req.userId, id);
  }

  @Patch('routine/steps/:id')
  @UseGuards(UserAuthGuard)
  updateStep(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateRoutineStepDto) {
    return this.ouma.updateStep(req.userId, id, dto);
  }

  @Delete('routine/steps/:id')
  @UseGuards(UserAuthGuard)
  deleteStep(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.ouma.deleteStep(req.userId, id);
  }

  @Get('streak')
  @UseGuards(UserAuthGuard)
  getStreak(@Req() req: AuthedRequest) {
    return this.ouma.getStreak(req.userId);
  }

  /** Days completed on a phone before signing in, so the streak moves with the person. */
  @Post('streak/import')
  @UseGuards(UserAuthGuard)
  importHistory(@Req() req: AuthedRequest, @Body() dto: ImportHistoryDto) {
    return this.ouma.importHistory(req.userId, dto.days);
  }

  @Get('streak/history')
  @UseGuards(UserAuthGuard)
  getStreakHistory(@Req() req: AuthedRequest, @Query() query: StreakHistoryQueryDto) {
    return this.ouma.getStreakHistory(req.userId, query.month);
  }

  @Get('products')
  @UseGuards(UserAuthGuard)
  getProducts(@Req() req: AuthedRequest) {
    return this.ouma.getProducts(req.userId);
  }

  @Get('notification-preferences')
  @UseGuards(UserAuthGuard)
  getNotificationPreferences(@Req() req: AuthedRequest) {
    return this.ouma.getNotificationPreferences(req.userId);
  }

  @Put('notification-preferences')
  @UseGuards(UserAuthGuard)
  updateNotificationPreferences(@Req() req: AuthedRequest, @Body() dto: UpdateNotificationPreferencesDto) {
    return this.ouma.updateNotificationPreferences(req.userId, dto);
  }

  @Post('scans')
  @UseGuards(UserAuthGuard)
  saveScan(@Req() req: AuthedRequest, @Body() dto: SaveScanDto) {
    return this.ouma.saveScan(req.userId, dto);
  }

  @Get('scans/recent')
  @UseGuards(UserAuthGuard)
  getRecentScans(@Req() req: AuthedRequest) {
    return this.ouma.getRecentScans(req.userId);
  }

  /** Aggregate stats for insights / marketing. Not user-scoped — stays public like before. */
  @Get('insights-summary')
  insightsSummary() {
    return this.ouma.getInsightsSummary();
  }
}
