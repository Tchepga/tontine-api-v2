import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { RolesGuard } from '../authentification/entities/roles/roles.guard';
import { Role } from '../authentification/entities/roles/roles.enum';
import { Roles } from '../authentification/entities/roles/roles.decorator';

@Controller('loan')
@UseGuards(RolesGuard)
@Roles(Role.TONTINARD)
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  create(@Body() createLoanDto: CreateLoanDto, @Req() req) {
    const user = req.user;
    return this.loanService.create(createLoanDto, user);
  }

  @Get()
  findAll(@Param('tontineId') tontineId: number, @Req() req: any) {
    const user = req.user;
    return this.loanService.findAll(tontineId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loanService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto) {
    return this.loanService.update(+id, updateLoanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.loanService.remove(+id, user);
  }

  @Patch(':id/vote')
  @Roles(Role.TONTINARD)
  vote(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.loanService.vote(+id, user);
  }

  @Patch(':id/approve')
  @Roles(Role.PRESIDENT)
  approve(@Param('id') id: string, @Req() req: any) {
    return this.loanService.approveLoan(+id, req.user);
  }

  @Patch(':id/reject')
  @Roles(Role.PRESIDENT)
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.loanService.rejectLoan(+id, body.reason, req.user);
  }

  @Get(':id/repayments')
  @Roles(Role.TONTINARD)
  getRepayments(@Param('id') id: string) {
    return this.loanService.getRepayments(+id);
  }

  @Post(':id/repayments')
  @Roles(Role.PRESIDENT, Role.ACCOUNT_MANAGER)
  recordRepayment(
    @Param('id') id: string,
    @Body() dto: any,
    @Req() req: any,
  ) {
    return this.loanService.recordRepayment(+id, dto, req.user);
  }
}
