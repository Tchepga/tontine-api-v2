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
import { RolesGuard } from 'src/authentification/entities/roles/roles.guard';
import { Role } from 'src/authentification/entities/roles/roles.enum';
import { Roles } from 'src/authentification/entities/roles/roles.decorator';

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
  findAll(@Param('tontineId') tontineId: number) {
    return this.loanService.findAll(tontineId);
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
  remove(@Param('id') id: string) {
    return this.loanService.remove(+id);
  }

  @Patch(':id/vote')
  @Roles(Role.TONTINARD)
  vote(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.loanService.vote(+id, user);
  }
}
