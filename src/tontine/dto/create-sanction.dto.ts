import { IsDate, IsIn, IsNumber, IsString } from 'class-validator';
import { TypeSanction } from '../enum/type-sanction';

export class CreateSanctionDto {
  @IsIn(Object.values(TypeSanction), {
    message: `Le type de sanction doit être parmi les valeurs suivantes: ${Object.values(TypeSanction)}`,
  })
  type: TypeSanction;

  @IsString({
    message: 'La description de la sanction doit être une chaîne de caractères',
  })
  description: string;

  @IsDate({ message: 'La date de début de la sanction doit être une date' })
  startDate?: Date | undefined;

  @IsDate({ message: 'La date de fin de la sanction doit être une date' })
  endDate?: Date | undefined;

  @IsNumber({}, { message: "L'identifiant du membre doit être un nombre" })
  memberId: number;
}
