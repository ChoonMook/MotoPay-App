// GET /cars/me(목록), POST /cars/me(수기등록), PATCH /cars/me/:id(수정 — 신차매핑은 차량번호만),
// DELETE /cars/me/:id(삭제 — 수기등록건만), POST /cars/me/:id/default(대표차량 지정) — 로그인 필요
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { CarsService } from './cars.service';
import { CreateMyCarDto } from './dto/create-my-car.dto';
import { UpdateMyCarDto } from './dto/update-my-car.dto';

@ApiTags('cars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get('me')
  @ApiOperation({ summary: '내 차량 목록 조회' })
  listMyCars(@CurrentUser() user: SafeUser) {
    return this.carsService.listMyCars(user.id);
  }

  @Post('me')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '내 차량 수기등록' })
  createMyCar(@CurrentUser() user: SafeUser, @Body() dto: CreateMyCarDto) {
    return this.carsService.createManualCar(user.id, dto);
  }

  @Patch('me/:id')
  @ApiOperation({
    summary:
      '내 차량 수정 — 수기등록은 전체 수정, 신차매핑은 차량번호만 수정 가능',
  })
  updateMyCar(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMyCarDto,
  ) {
    return this.carsService.updateCar(user.id, id, dto);
  }

  @Delete('me/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '내 차량 삭제 — 수기등록(regType=MANUAL) 차량만 가능',
  })
  async deleteMyCar(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.carsService.deleteManualCar(user.id, id);
  }

  @Post('me/:id/default')
  @ApiOperation({ summary: '대표차량 지정 — 신차매핑/수기등록 구분 없이 가능' })
  setDefaultCar(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.carsService.setDefaultCar(user.id, id);
  }
}
