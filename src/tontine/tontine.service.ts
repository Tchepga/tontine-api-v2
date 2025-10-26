import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Role } from '../authentification/entities/roles/roles.enum';
import { User } from '../authentification/entities/user.entity';
import { CreateMemberDto } from '../member/dto/create-member.dto';
import { Member } from '../member/entities/member.entity';
import { MemberService } from '../member/member.service';
import { TypeNotification } from '../notification/enum/type-notification';
import { NotificationService } from '../notification/notification.service';
import { Action } from '../notification/utility/message-notification';
import { ErrorCode } from '../shared/utilities/error-code';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateInvitationLinkDto } from './dto/create-invitation-link.dto';
import { CreateMeetingRapportDto } from './dto/create-meeting-rapport.dto';
import { CreateSanctionDto } from './dto/create-sanction.dto';
import {
  CreateConfigTontineDto,
  createToConfigTontineDtoToConfigTontine,
  CreateTontineDto,
  PartOrderDto,
} from './dto/create-tontine.dto';
import { UpdateDepositStatusDto } from './dto/update-deposit-status.dto';
import { UpdateTontineDto } from './dto/update-tontine.dto';
import { CashFlow } from './entities/cashflow.entity';
import { ConfigTontine } from './entities/config-tontine.entity';
import { Deposit } from './entities/deposit.entity';
import {
  InvitationLink,
  InvitationStatus,
} from './entities/invitation-link.entity';
import { MemberRole } from './entities/member-role.entity';
import { PartOrder } from './entities/part-order.entity';
import { RapportMeeting } from './entities/rapport-meeting.entity';
import { RateMap } from './entities/rate-map.entity';
import { Sanction } from './entities/sanction.entity';
import { Tontine } from './entities/tontine.entity';
import { StatusDeposit } from './enum/status-deposit';

@Injectable()
export class TontineService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly memberService: MemberService,
    private readonly notificationService: NotificationService,
  ) {}

  async findByMember(username: string): Promise<Tontine[]> {
    const member = await this.memberService.findByUsername(username);
    if (!member) {
      return [];
    }
    return await this.findTontineByMember(member);
  }

  async create(createTontineDto: CreateTontineDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const config = createToConfigTontineDtoToConfigTontine(
        createTontineDto.config,
      );
      const configTontine = await queryRunner.manager.save(config);

      const cashflow = new CashFlow();
      cashflow.amount = 0;
      cashflow.currency = createTontineDto.currency;
      cashflow.dividendes = 0;
      const cashflowSaved = await queryRunner.manager.save(cashflow);

      const members = await Promise.all(
        createTontineDto.members.map(async (memberDto) => {
          const memberFind = await this.memberService.findByUsername(
            memberDto.username,
          );
          if (!memberFind) {
            return await this.memberService.create({
              ...memberDto,
            });
          }
          return memberFind;
        }),
      );

      const tontine = new Tontine();
      tontine.title = createTontineDto.title;
      tontine.legacy = createTontineDto.legacy;
      tontine.cashFlow = cashflowSaved;
      tontine.config = configTontine;
      tontine.members = members;
      await queryRunner.manager.save(tontine);

      // just the first member is the president
      const roleMember = new MemberRole();
      roleMember.role = Role.PRESIDENT;
      roleMember.user = members[0].user;
      roleMember.tontine = tontine;
      await queryRunner.manager.save(roleMember);

      await queryRunner.commitTransaction();
      return {
        ...tontine,
        members: tontine.members.map((member) => ({
          ...member,
          user: { username: member.user.username, roles: member.user.roles },
        })),
      };
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.error(err);
      throw new HttpException(err, 500);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }
  }

  findTontineByMember(member: Member): Promise<Tontine[]> {
    const tontines = this.dataSource.getRepository(Tontine).find({
      relations: [
        'members',
        'members.user',
        'config',
        'config.partOrders',
        'config.rateMaps',
        'config.partOrders.member',
        'cashFlow',
      ],
    });
    return tontines.then((tontines) =>
      tontines.filter((tontine) =>
        tontine.members.find((m) => m.id === member.id),
      ),
    );
  }

  findOne(id: number): Promise<Tontine> {
    return this.getTontineQueryBuilder()
      .innerJoinAndSelect('members.user', 'user')
      .where('tontine.id = :id', { id })
      .getOne();
  }

  async addMember(id: number, memberId: number): Promise<Tontine> {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

    const member = await this.memberService.findOne(memberId);
    if (!member) {
      throw new HttpException(ErrorCode.NOT_FOUND, 404);
    }

    if (tontine.members.find((m) => m.id === member.id)) {
      throw new HttpException(ErrorCode.ALREADY_EXISTS, 400);
    }

    tontine.members.push(member);
    return this.dataSource.getRepository(Tontine).save(tontine);
  }

  async update(id: number, updateTontineDto: UpdateTontineDto) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

    return this.dataSource.getRepository(Tontine).save({
      ...tontine,
      ...updateTontineDto,
      members: tontine.members,
    });
  }

  remove(id: number) {
    return this.dataSource.getRepository(Tontine).delete(id);
  }

  getRapports(id: number) {
    return this.dataSource.getRepository(RapportMeeting).find({
      where: { tontine: { id } },
      relations: ['author', 'author.user'],
    });
  }

  async createRapport(
    id: number,
    username: string,
    rapport: CreateMeetingRapportDto,
  ): Promise<any> {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new HttpException('Tontine not found', 404);
    }

    const member = tontine.members.find((m) => m.user.username === username);
    if (!member) {
      throw new HttpException('Member not found', 404);
    }

    const rapportMeeting = new RapportMeeting();
    rapportMeeting.content = rapport.content;
    rapportMeeting.title = rapport.title;
    rapportMeeting.author = member;
    rapportMeeting.tontine = tontine;
    rapportMeeting.createdAt = new Date();
    rapportMeeting.attachmentFilename = rapport.attachmentFilename;

    return this.dataSource.getRepository(RapportMeeting).save(rapportMeeting);
  }

  async updateRapport(id: number, rapport: CreateMeetingRapportDto) {
    const rapportMeeting = await this.dataSource
      .getRepository(RapportMeeting)
      .findOne({ where: { id } });
    if (!rapportMeeting) {
      throw new HttpException('Rapport not found', 404);
    }

    return this.dataSource.getRepository(RapportMeeting).save({
      ...rapportMeeting,
      ...rapport,
      updatedAt: new Date(),
    });
  }

  async removeRapport(tontineId: number, rapportId: number) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const rapportMeeting = await this.dataSource
      .getRepository(RapportMeeting)
      .findOne({ where: { id: rapportId } });
    if (!rapportMeeting) {
      throw new HttpException('Rapport not found', 404);
    }

    return this.dataSource.getRepository(RapportMeeting).remove(rapportMeeting);
  }

  getRapport(rapportId: number) {
    return this.dataSource.getRepository(RapportMeeting).findOne({
      where: { id: rapportId },
      relations: ['author', 'author.user'],
    });
  }

  async createSanction(tontineId: number, sanctionDto: CreateSanctionDto) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const member = await this.memberService.findOne(sanctionDto.memberId);
    if (!member) {
      throw new NotFoundException('Member associated not found');
    }

    const sanction = new Sanction();
    sanction.type = sanctionDto.type;
    sanction.description = sanctionDto.description;
    sanction.startDate = sanctionDto?.startDate ?? new Date();
    if (sanctionDto.endDate) {
      sanction.endDate = sanctionDto.endDate;
    }
    sanction.gulty = member;
    sanction.tontine = tontine;

    return this.dataSource.getRepository(Sanction).save(sanction);
  }

  async updateSanction(
    id: number,
    sanctionId: number,
    sanctionDto: CreateSanctionDto,
  ) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const sanction = await this.dataSource
      .getRepository(Sanction)
      .findOne({ where: { id: sanctionId } });
    if (!sanction) {
      throw new NotFoundException('Sanction not found');
    }

    return this.dataSource.getRepository(Sanction).save({
      ...sanction,
      ...sanctionDto,
    });
  }

  async removeSanction(id: number, sanctionId: number) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const sanction = await this.dataSource
      .getRepository(Sanction)
      .findOne({ where: { id: sanctionId } });
    if (!sanction) {
      throw new NotFoundException('Sanction not found');
    }

    return this.dataSource.getRepository(Sanction).remove(sanction);
  }

  async getSanctions(tontineId: number) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    return this.dataSource.getRepository(Sanction).find({
      where: { tontine: { id: tontineId } },
      relations: ['gulty', 'gulty.user'],
      order: { id: 'DESC' },
    });
  }

  private getTontineQueryBuilder() {
    return this.dataSource
      .getRepository(Tontine)
      .createQueryBuilder('tontine')
      .innerJoinAndSelect('tontine.members', 'members')
      .innerJoinAndSelect('tontine.config', 'config')
      .innerJoinAndSelect('tontine.cashFlow', 'cashFlow');
  }

  // deposit part
  async createDeposit(
    tontineId: number,
    createDepositDto: CreateDepositDto,
    status: StatusDeposit,
    user: User,
  ) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const member = await this.memberService.findOne(createDepositDto.memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const deposit = new Deposit();
    deposit.amount = createDepositDto.amount;
    const author = await this.dataSource
      .getRepository(Member)
      .findOne({ where: { id: createDepositDto.memberId } });
    if (!author) {
      throw new NotFoundException(
        'Author not found with this member id: ' + createDepositDto.memberId,
      );
    }
    deposit.author = author;
    deposit.creationDate = new Date();
    deposit.reasons = createDepositDto.reasons;
    deposit.comment = createDepositDto.comment;
    deposit.status = status;
    deposit.cashFlow = tontine.cashFlow;
    deposit.currency = createDepositDto.currency;

    // update cashflow
    const cashflow = await this.dataSource.getRepository(CashFlow).findOne({
      where: { id: tontine.cashFlow.id },
      relations: ['deposits'],
    });
    if (!cashflow) {
      throw new NotFoundException('Cashflow not found');
    }
    // Initialize deposits array if it doesn't exist
    if (!cashflow.deposits) {
      cashflow.deposits = [];
    }

    await this.updateCashflow(createDepositDto.cashFlowId, deposit.amount);

    const depositSaved = await this.dataSource
      .getRepository(Deposit)
      .save(deposit);

    this.notificationService.create(
      {
        action: Action.CREATE,
        depositId: depositSaved.id,
        memberId: depositSaved.author.id,
        tontineId: tontine.id,
        type: TypeNotification.DEPOSIT,
      },
      user,
    );

    return depositSaved;
  }

  private async updateCashflow(cashFlowId: number, amount: number) {
    const cashflow = await this.dataSource.getRepository(CashFlow).findOne({
      where: { id: cashFlowId },
      relations: ['deposits'],
    });
    if (!cashflow) {
      throw new NotFoundException('Cashflow not found');
    }

    // Initialize deposits array if it doesn't exist
    if (!cashflow.deposits) {
      cashflow.deposits = [];
    }

    // add all deposit attached to this tontine
    const deposits = await this.dataSource.getRepository(Deposit).find({
      where: { cashFlow: { id: cashFlowId } },
      relations: ['cashFlow'],
    });
    const totalDeposit = deposits
      .filter((deposit) => deposit.status === StatusDeposit.APPROVED)
      .reduce((acc, deposit) => acc + deposit.amount, 0);
    cashflow.amount = totalDeposit + amount;
    await this.dataSource.getRepository(CashFlow).save(cashflow);
  }

  async updateDeposit(
    id: number,
    depositId: number,
    deposit: CreateDepositDto,
    user: User,
  ) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const depositFind = await this.dataSource
      .getRepository(Deposit)
      .findOne({ where: { id: depositId } });
    if (!depositFind) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.amount && depositFind.amount !== deposit.amount) {
      depositFind.status = StatusDeposit.PENDING;
      deposit.status = StatusDeposit.PENDING;
    }

    const depositSaved = await this.dataSource.getRepository(Deposit).save({
      ...depositFind,
      ...deposit,
    });

    this.notificationService.create(
      {
        action: Action.UPDATE,
        depositId: depositSaved.id,
        memberId: depositSaved.author.id,
        tontineId: tontine.id,
        type: TypeNotification.DEPOSIT,
      },
      user,
    );

    return depositSaved;
  }

  async removeDeposit(id: number, depositId: number, user: User) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const deposit = await this.dataSource
      .getRepository(Deposit)
      .findOne({ where: { id: depositId } });
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    const member = await this.memberService.findByUsername(user.username);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const depositRemoved = await this.dataSource
      .getRepository(Deposit)
      .remove(deposit);

    this.notificationService.create(
      {
        action: Action.DELETE,
        depositId: depositRemoved.id,
        memberId: depositRemoved.author.id,
        tontineId: tontine.id,
        type: TypeNotification.DEPOSIT,
      },
      user,
    );

    return depositRemoved;
  }

  async updateDepositStatus(
    tontineId: number,
    depositId: number,
    updateStatusDto: UpdateDepositStatusDto,
  ) {
    // Vérifier que la tontine existe
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    // Vérifier que le dépôt existe
    const deposit = await this.dataSource.getRepository(Deposit).findOne({
      where: { id: depositId },
      relations: ['author', 'cashFlow'],
    });
    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    // Vérifier que le dépôt appartient à cette tontine
    if (deposit.cashFlow.id !== tontine.cashFlow.id) {
      throw new HttpException("Ce dépôt n'appartient pas à cette tontine", 400);
    }

    // Sauvegarder l'ancien statut pour les logs
    const oldStatus = deposit.status;

    // Mettre à jour le statut
    deposit.status = updateStatusDto.status;

    // Ajouter la raison si fournie
    if (updateStatusDto.reason) {
      deposit.reasons = updateStatusDto.reason;
    }

    // Sauvegarder les modifications
    const updatedDeposit = await this.dataSource
      .getRepository(Deposit)
      .save(deposit);

    // Créer une notification pour informer du changement de statut
    this.notificationService.create(
      {
        action: Action.UPDATE,
        depositId: updatedDeposit.id,
        memberId: updatedDeposit.author.id,
        tontineId: tontine.id,
        type: TypeNotification.DEPOSIT,
      },
      updatedDeposit.author.user,
    );

    return {
      deposit: updatedDeposit,
      message: `Statut du dépôt mis à jour de ${oldStatus} à ${updateStatusDto.status}`,
    };
  }

  async createInvitationLink(
    tontineId: number,
    createInvitationDto: CreateInvitationLinkDto,
    user: User,
  ) {
    // Vérifier que l'utilisateur est président
    const hasPermission = user.roles.some((role) => role === Role.PRESIDENT);
    if (!hasPermission) {
      throw new HttpException(
        "Seuls les présidents peuvent créer des liens d'invitation",
        403,
      );
    }

    // Vérifier que la tontine existe
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    // Vérifier que le username n'existe pas déjà
    const existingUser = await this.dataSource
      .getRepository(User)
      .findOne({ where: { username: createInvitationDto.username } });

    if (existingUser) {
      // Vérifier si l'utilisateur est déjà membre de cette tontine
      const existingMember = await this.dataSource
        .getRepository(Member)
        .findOne({
          where: { user: { username: existingUser.username } },
          relations: ['tontines'],
        });

      if (existingMember) {
        const isAlreadyMember = existingMember.tontines.some(
          (tontineMember) => tontineMember.id === tontineId,
        );
        if (isAlreadyMember) {
          throw new HttpException(
            'Ce membre fait déjà partie de cette tontine',
            400,
          );
        }
      }
    }

    // Vérifier qu'il n'y a pas déjà un lien d'invitation actif pour ce username
    const existingInvitation = await this.dataSource
      .getRepository(InvitationLink)
      .findOne({
        where: {
          username: createInvitationDto.username,
          tontine: { id: tontineId },
          status: InvitationStatus.ACTIVE,
        },
      });

    if (existingInvitation) {
      throw new HttpException(
        "Un lien d'invitation actif existe déjà pour ce nom d'utilisateur",
        400,
      );
    }

    // Générer un token unique
    const token = this.generateInvitationToken();

    // Créer le lien d'invitation
    const invitationLink = new InvitationLink();
    invitationLink.token = token;
    invitationLink.username = createInvitationDto.username;
    invitationLink.firstName = null;
    invitationLink.lastName = null;
    invitationLink.phone = null;
    invitationLink.tontine = tontine;
    invitationLink.createdBy = await this.memberService.findByUsername(
      user.username,
    );
    invitationLink.status = InvitationStatus.ACTIVE;

    // Définir la date d'expiration (1 jour par défaut)
    const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    invitationLink.expiresAt = expiresAt;

    const savedInvitation = await this.dataSource
      .getRepository(InvitationLink)
      .save(invitationLink);

    return {
      invitationLink: savedInvitation,
      invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/${token}`,
      message: "Lien d'invitation créé avec succès",
    };
  }

  async acceptInvitation(acceptInvitationDto: AcceptInvitationDto) {
    const { token, username, password, firstName, lastName, phone } =
      acceptInvitationDto;

    // Trouver le lien d'invitation
    const invitationLink = await this.dataSource
      .getRepository(InvitationLink)
      .findOne({
        where: { token },
        relations: ['tontine', 'createdBy'],
      });

    if (!invitationLink) {
      throw new NotFoundException("Lien d'invitation non trouvé");
    }

    // Vérifier le statut
    if (invitationLink.status !== InvitationStatus.ACTIVE) {
      throw new HttpException("Ce lien d'invitation n'est plus valide", 400);
    }

    // Vérifier l'expiration
    if (invitationLink.expiresAt && new Date() > invitationLink.expiresAt) {
      invitationLink.status = InvitationStatus.EXPIRED;
      await this.dataSource.getRepository(InvitationLink).save(invitationLink);
      throw new HttpException("Ce lien d'invitation a expiré", 400);
    }

    // Vérifier que le nom d'utilisateur n'existe pas déjà
    const existingUser = await this.dataSource
      .getRepository(User)
      .findOne({ where: { username } });

    if (existingUser) {
      throw new HttpException("Ce nom d'utilisateur est déjà utilisé", 400);
    }

    // Créer le membre
    const member = new Member();
    member.firstname = firstName || '';
    member.lastname = lastName || '';
    member.email = null; // Email n'est plus requis
    member.phone = phone || '';
    member.country = 'Cameroon'; // Valeur par défaut

    const savedMember = await this.dataSource
      .getRepository(Member)
      .save(member);

    // Créer l'utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User();
    user.username = username;
    user.password = hashedPassword;
    user.roles = [Role.TONTINARD];

    const savedUser = await this.dataSource.getRepository(User).save(user);

    // Lier l'utilisateur au membre
    savedMember.user = savedUser;
    await this.dataSource.getRepository(Member).save(savedMember);

    // Ajouter le membre à la tontine
    invitationLink.tontine.members.push(savedMember);
    await this.dataSource.getRepository(Tontine).save(invitationLink.tontine);

    // Marquer le lien comme utilisé
    invitationLink.status = InvitationStatus.USED;
    invitationLink.usedAt = new Date();
    invitationLink.usedBy = savedMember;
    await this.dataSource.getRepository(InvitationLink).save(invitationLink);

    return {
      member: savedMember,
      message:
        'Invitation acceptée avec succès. Vous êtes maintenant membre de la tontine.',
    };
  }

  async getInvitationLinks(tontineId: number, user: User) {
    // Vérifier que l'utilisateur est président
    const hasPermission = user.roles.some((role) => role === Role.PRESIDENT);
    if (!hasPermission) {
      throw new HttpException(
        "Seuls les présidents peuvent voir les liens d'invitation",
        403,
      );
    }

    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    return this.dataSource.getRepository(InvitationLink).find({
      where: { tontine: { id: tontineId } },
      relations: ['createdBy', 'usedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeInvitationLink(
    tontineId: number,
    invitationId: number,
    user: User,
  ) {
    // Vérifier que l'utilisateur est président
    const hasPermission = user.roles.some((role) => role === Role.PRESIDENT);
    if (!hasPermission) {
      throw new HttpException(
        "Seuls les présidents peuvent révoquer les liens d'invitation",
        403,
      );
    }

    const invitationLink = await this.dataSource
      .getRepository(InvitationLink)
      .findOne({
        where: { id: invitationId, tontine: { id: tontineId } },
      });

    if (!invitationLink) {
      throw new NotFoundException("Lien d'invitation non trouvé");
    }

    if (invitationLink.status !== InvitationStatus.ACTIVE) {
      throw new HttpException(
        "Ce lien d'invitation ne peut pas être révoqué",
        400,
      );
    }

    invitationLink.status = InvitationStatus.REVOKED;
    invitationLink.revokedAt = new Date();

    await this.dataSource.getRepository(InvitationLink).save(invitationLink);

    return {
      message: "Lien d'invitation révoqué avec succès",
    };
  }

  private generateInvitationToken(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async setSelectedTontine(id: number, username: string) {
    const member = await this.memberService.findByUsername(username);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    tontine.isSelected = true;
    return this.dataSource.getRepository(Tontine).save(tontine);
  }

  async getDeposits(id: number) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }

    const deposits = await this.dataSource.getRepository(Deposit).find({
      where: { cashFlow: { id: tontine.cashFlow.id } },
      relations: ['author', 'cashFlow', 'author.user'],
    });
    return deposits;
  }

  async updateConfig(id: number, updateConfigDto: CreateConfigTontineDto) {
    const tontine = await this.findOne(id);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const config = await this.dataSource
      .getRepository(ConfigTontine)
      .findOne({ where: { id: tontine.config.id } });
    if (!config) {
      throw new NotFoundException('Config not found');
    }

    if (updateConfigDto.defaultLoanRate !== undefined)
      config.defaultLoanRate = updateConfigDto.defaultLoanRate;
    if (updateConfigDto.defaultLoanDuration !== undefined)
      config.defaultLoanDuration = updateConfigDto.defaultLoanDuration;
    if (updateConfigDto.loopPeriod !== undefined)
      config.loopPeriod = updateConfigDto.loopPeriod;
    if (updateConfigDto.minLoanAmount !== undefined)
      config.minLoanAmount = updateConfigDto.minLoanAmount;
    if (updateConfigDto.countPersonPerMovement !== undefined)
      config.countPersonPerMovement = updateConfigDto.countPersonPerMovement;
    if (updateConfigDto.movementType !== undefined)
      config.movementType = updateConfigDto.movementType;
    if (updateConfigDto.countMaxMember !== undefined)
      config.countMaxMember = updateConfigDto.countMaxMember;
    if (updateConfigDto.systemType) {
      config.systemType = updateConfigDto.systemType;
    }

    const rateMaps = updateConfigDto.rateMaps?.map((rateMap) => {
      const rateMapEntity = new RateMap();
      rateMapEntity.rate = rateMap.rate;
      rateMapEntity.maxAmount = rateMap.maxAmount;
      rateMapEntity.minAmount = rateMap.minAmount;
      return rateMapEntity;
    });
    config.rateMaps = rateMaps;

    return this.dataSource.getRepository(ConfigTontine).save(config);
  }

  async getMemberRole(
    username: string,
    tontineId: number,
  ): Promise<MemberRole> {
    return this.dataSource.getRepository(MemberRole).findOne({
      where: {
        user: { username },
        tontine: { id: tontineId },
      },
    });
  }

  async addMemberWithRole(
    tontineId: number,
    username: string,
    role: Role,
  ): Promise<MemberRole> {
    const memberRole = new MemberRole();
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    memberRole.tontine = tontine;
    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    memberRole.user = user;
    memberRole.role = role;

    return this.dataSource.getRepository(MemberRole).save(memberRole);
  }

  async removeMember(tontineId: number, memberId: number) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const member = await this.dataSource.getRepository(Member).findOne({
      where: { id: memberId },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const memberRole = await this.getMemberRole(
      member.user.username,
      tontineId,
    );
    if (memberRole) {
      await this.dataSource.getRepository(MemberRole).delete(memberRole.id);
    }
    tontine.members = tontine.members.filter((m) => m.id !== memberId);
    return this.dataSource.getRepository(Tontine).save(tontine);
  }

  async createPartOrder(tontineId: number, data: PartOrderDto) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const member = await this.memberService.findOne(data.memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const partOrder = new PartOrder();
    partOrder.member = member;
    partOrder.order = data.order;
    partOrder.period = data.period;
    partOrder.config = tontine.config;
    return this.dataSource.getRepository(PartOrder).save(partOrder);
  }

  async updatePartOrder(
    tontineId: number,
    partOrderId: number,
    data: PartOrderDto,
  ) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const partOrder = await this.dataSource.getRepository(PartOrder).findOne({
      where: { id: partOrderId },
    });
    if (!partOrder) {
      throw new NotFoundException('Part order not found');
    }
    const member = await this.memberService.findOne(data.memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    partOrder.member = member;
    partOrder.order = data.order;
    partOrder.period = data.period;
    return this.dataSource.getRepository(PartOrder).save(partOrder);
  }

  async deletePartOrder(tontineId: number, partOrderId: number) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const partOrder = await this.dataSource.getRepository(PartOrder).findOne({
      where: { id: partOrderId },
    });
    if (!partOrder) {
      throw new NotFoundException('Part order not found');
    }
    return this.dataSource.getRepository(PartOrder).delete(partOrderId);
  }

  async getPartOrder(tontineId: number) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    return this.dataSource.getRepository(PartOrder).findOne({
      where: {
        config: { id: tontine.config.id },
      },
      relations: ['member', 'member.user'],
    });
  }

  async addMemberFromScratch(tontineId: number, data: CreateMemberDto) {
    const tontine = await this.findOne(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine not found');
    }
    const member =
      (await this.memberService.findByUsername(data.username)) ??
      (await this.memberService.create(data));

    return this.addMember(tontineId, member.id);
  }
}
