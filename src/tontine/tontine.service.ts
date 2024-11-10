import { Injectable } from '@nestjs/common';
import { CreateTontineDto } from './dto/create-tontine.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';

@Injectable()
export class TontineService {
  create(createTontineDto: CreateTontineDto) {
    return 'This action adds a new tontine';
  }

  findAll() {
    return `This action returns all tontine`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tontine`;
  }

  update(id: number, updateTontineDto: UpdateTontineDto) {
    return `This action updates a #${id} tontine`;
  }

  remove(id: number) {
    return `This action removes a #${id} tontine`;
  }
}
