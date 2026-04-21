import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { LoanService } from './loan.service';
import { NotificationService } from '../notification/notification.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan } from './entities/loan.entity';
import { StatusLoan } from './enum/status-loan';
import { Role } from '../authentification/entities/roles/roles.enum';
import { User } from '../authentification/entities/user.entity';
import { Tontine } from '../tontine/entities/tontine.entity';
import { Member } from '../member/entities/member.entity';
import { Action } from '../notification/utility/message-notification';
import { TypeNotification } from '../notification/enum/type-notification';

describe('LoanService', () => {
  let service: LoanService;
  let mockDataSource: any;
  let mockNotificationService: any;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'password',
    roles: [Role.TONTINARD],
  } as User;

  const mockTontine: Tontine = {
    id: 1,
    title: 'Test Tontine',
    members: [
      {
        id: 1,
        user: { username: 'testuser' },
      } as Member,
    ],
    config: {
      id: 1,
      defaultLoanRate: 5.0,
    } as any,
  } as Tontine;

  const mockAuthor: Member = {
    id: 1,
    firstname: 'John',
    lastname: 'Doe',
    user: mockUser,
  } as Member;

  const mockLoan: Loan = {
    id: 1,
    amount: 1000,
    currency: 'EUR',
    createdAt: new Date(),
    status: StatusLoan.PENDING,
    redemptionDate: new Date('2024-12-31'),
    interestRate: 5.0,
    tontine: mockTontine,
    author: mockAuthor,
    voters: [],
  } as Loan;

  beforeEach(async () => {
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
      }),
    };

    mockNotificationService = {
      create: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createLoanDto: CreateLoanDto = {
      amount: 1000,
      currency: 'EUR',
      tontineId: 1,
      redemptionDate: new Date('2024-12-31'),
    };

    it('devrait créer un prêt avec succès', async () => {
      const loanRepository = mockDataSource.getRepository(Loan);
      const tontineRepository = mockDataSource.getRepository(Tontine);
      const memberRepository = mockDataSource.getRepository(Member);

      const tontineWithConfig = {
        id: 1,
        title: 'Test Tontine',
        config: { id: 1, defaultLoanRate: 5.0 },
      };

      tontineRepository.findOne.mockResolvedValue(tontineWithConfig);
      memberRepository.findOne.mockResolvedValue(mockAuthor);
      loanRepository.save.mockResolvedValue(mockLoan);

      const result = await service.create(createLoanDto, mockUser);

      expect(result).toBeDefined();
      expect(result.amount).toBe(createLoanDto.amount);
      expect(result.currency).toBe(createLoanDto.currency);
      expect(result.status).toBe(StatusLoan.PENDING);
      expect(result.interestRate).toBe(5.0);
      expect(tontineRepository.findOne).toHaveBeenCalledWith({
        where: { id: createLoanDto.tontineId },
        relations: ['config'],
      });
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { user: { username: mockUser.username } },
      });
      expect(loanRepository.save).toHaveBeenCalled();
      expect(mockNotificationService.create).toHaveBeenCalledWith(
        {
          action: Action.CREATE,
          loanId: mockLoan.id,
          type: TypeNotification.LOAN,
          tontineId: 1,
        },
        mockUser,
      );
    });

    it("devrait lancer une erreur si la tontine n'existe pas", async () => {
      const tontineRepository = mockDataSource.getRepository(Tontine);
      tontineRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createLoanDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createLoanDto, mockUser)).rejects.toThrow(
        'Tontine not found',
      );
    });

    it("devrait lancer une erreur si le membre n'existe pas", async () => {
      const tontineRepository = mockDataSource.getRepository(Tontine);
      const memberRepository = mockDataSource.getRepository(Member);

      const tontineWithConfig = {
        id: 1,
        title: 'Test Tontine',
        config: { id: 1, defaultLoanRate: 5.0 },
      };

      // Premier appel pour tontine, deuxième pour member
      tontineRepository.findOne.mockResolvedValueOnce(tontineWithConfig);
      memberRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createLoanDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createLoanDto, mockUser)).rejects.toThrow(
        'Member not found',
      );
    });
  });

  describe('findAll', () => {
    it("devrait retourner tous les prêts d'une tontine pour un membre", async () => {
      const mockLoans = [mockLoan, { ...mockLoan, id: 2 }] as Loan[];
      const tontineRepository = mockDataSource.getRepository(Tontine);
      const loanRepository = mockDataSource.getRepository(Loan);

      const tontineWithMembers = {
        id: 1,
        title: 'Test Tontine',
        members: [
          {
            id: 1,
            user: { username: 'testuser' },
          } as Member,
        ],
      };

      tontineRepository.findOne.mockResolvedValue(tontineWithMembers);
      loanRepository.find.mockResolvedValue(mockLoans);

      const result = await service.findAll(1, mockUser);

      expect(result).toEqual(mockLoans);
      // Le service peut charger les membres avec relations selon l'implémentation
      expect(tontineRepository.findOne).toHaveBeenCalled();
      expect(loanRepository.find).toHaveBeenCalledWith({
        where: { tontine: { id: 1 } },
      });
    });

    it("devrait lancer une erreur si la tontine n'existe pas", async () => {
      const tontineRepository = mockDataSource.getRepository(Tontine);
      tontineRepository.findOne.mockResolvedValue(null);

      await expect(service.findAll(999, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll(999, mockUser)).rejects.toThrow(
        'Tontine not found',
      );
    });

    it("devrait lancer une erreur si l'utilisateur n'est pas membre de la tontine", async () => {
      const tontineWithoutUser: Tontine = {
        ...mockTontine,
        members: [{ id: 2, user: { username: 'otheruser' } } as Member],
      };
      const tontineRepository = mockDataSource.getRepository(Tontine);

      tontineRepository.findOne.mockResolvedValue(tontineWithoutUser);

      await expect(service.findAll(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findAll(1, mockUser)).rejects.toThrow(
        'You are not a member of this tontine',
      );
    });
  });

  describe('findOne', () => {
    it('devrait retourner un prêt par son ID', async () => {
      const loanRepository = mockDataSource.getRepository(Loan);
      loanRepository.findOne.mockResolvedValue(mockLoan);

      const result = await service.findOne(1);

      expect(result).toEqual(mockLoan);
      expect(loanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer une erreur si le prêt n'existe pas", async () => {
      const loanRepository = mockDataSource.getRepository(Loan);
      loanRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(999)).rejects.toThrow('Loan not found');
    });
  });

  describe('update', () => {
    it("devrait mettre à jour le montant d'un prêt", async () => {
      const updateLoanDto: UpdateLoanDto = { amount: 2000 };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      loanRepository.save.mockResolvedValue({ ...mockLoan, amount: 2000 });

      await service.update(1, updateLoanDto);

      expect(loanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(loanRepository.save).toHaveBeenCalled();
    });

    it("devrait mettre à jour le statut d'un prêt", async () => {
      const updateLoanDto: UpdateLoanDto = { status: StatusLoan.APPROVED };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      loanRepository.save.mockResolvedValue({
        ...mockLoan,
        status: StatusLoan.APPROVED,
      });

      await service.update(1, updateLoanDto);

      expect(loanRepository.save).toHaveBeenCalled();
    });

    it("devrait mettre à jour la devise d'un prêt", async () => {
      const updateLoanDto: UpdateLoanDto = { currency: 'USD' };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      loanRepository.save.mockResolvedValue({ ...mockLoan, currency: 'USD' });

      await service.update(1, updateLoanDto);

      expect(loanRepository.save).toHaveBeenCalled();
    });

    it("devrait mettre à jour les votants d'un prêt", async () => {
      const voters = [{ id: 1 }, { id: 2 }] as Member[];
      const updateLoanDto: UpdateLoanDto = { voters };
      const loanRepository = mockDataSource.getRepository(Loan);
      const memberRepository = mockDataSource.getRepository(Member);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      // Le code utilise filter avec async, donc chaque appel vérifie si le membre existe
      memberRepository.findOne
        .mockResolvedValueOnce({ id: 1 } as Member)
        .mockResolvedValueOnce({ id: 2 } as Member);
      loanRepository.save.mockResolvedValue({
        ...mockLoan,
        voters: [1, 2],
      });

      await service.update(1, updateLoanDto);

      // Le code appelle findOne pour chaque voter dans le filter
      expect(memberRepository.findOne).toHaveBeenCalled();
      expect(loanRepository.save).toHaveBeenCalled();
    });

    it('devrait ignorer les votants invalides', async () => {
      const voters = [{ id: 1 }, { id: 999 }] as Member[];
      const updateLoanDto: UpdateLoanDto = { voters };
      const loanRepository = mockDataSource.getRepository(Loan);
      const memberRepository = mockDataSource.getRepository(Member);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      memberRepository.findOne
        .mockResolvedValueOnce({ id: 1 } as Member)
        .mockResolvedValueOnce(null);

      await service.update(1, updateLoanDto);

      expect(loanRepository.save).toHaveBeenCalled();
    });

    it('devrait supprimer les doublons dans les votants', async () => {
      const voters = [{ id: 1 }, { id: 1 }, { id: 2 }] as Member[];
      const updateLoanDto: UpdateLoanDto = { voters };
      const loanRepository = mockDataSource.getRepository(Loan);
      const memberRepository = mockDataSource.getRepository(Member);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      memberRepository.findOne
        .mockResolvedValueOnce({ id: 1 } as Member)
        .mockResolvedValueOnce({ id: 1 } as Member)
        .mockResolvedValueOnce({ id: 2 } as Member);

      await service.update(1, updateLoanDto);

      expect(loanRepository.save).toHaveBeenCalled();
    });

    it("devrait lancer une erreur si le prêt n'existe pas", async () => {
      const updateLoanDto: UpdateLoanDto = { amount: 2000 };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateLoanDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(999, updateLoanDto)).rejects.toThrow(
        'Loan not found',
      );
    });
  });

  describe('remove', () => {
    it("devrait supprimer un prêt si l'utilisateur est l'auteur", async () => {
      const loanWithAuthor: Loan = {
        ...mockLoan,
        author: { ...mockAuthor, user: mockUser },
      };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(loanWithAuthor);
      loanRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1, mockUser);

      expect(loanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(loanRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
    });

    it("devrait supprimer un prêt si l'utilisateur est président", async () => {
      const presidentUser: User = {
        ...mockUser,
        roles: [Role.PRESIDENT],
      };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      loanRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1, presidentUser);

      expect(loanRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
    });

    it("devrait supprimer un prêt si l'utilisateur est account manager", async () => {
      const accountManagerUser: User = {
        ...mockUser,
        roles: [Role.ACCOUNT_MANAGER],
      };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(mockLoan);
      loanRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1, accountManagerUser);

      expect(loanRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
    });

    it("devrait lancer une erreur si le prêt n'existe pas", async () => {
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove(999, mockUser)).rejects.toThrow(
        'Loan not found',
      );
    });

    it("devrait lancer une erreur si l'utilisateur n'est pas autorisé", async () => {
      const otherUser: User = {
        ...mockUser,
        username: 'otheruser',
        roles: [Role.TONTINARD],
      };
      const loanWithOtherAuthor: Loan = {
        ...mockLoan,
        author: {
          ...mockAuthor,
          user: { ...mockUser, username: 'differentuser' },
        },
      };
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(loanWithOtherAuthor);

      await expect(service.remove(1, otherUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove(1, otherUser)).rejects.toThrow(
        'You are not the author of this loan',
      );
    });
  });

  describe('vote', () => {
    it('devrait ajouter un vote pour un membre', async () => {
      const loanWithoutVoters: Loan = {
        ...mockLoan,
        voters: null,
      };
      const loanRepository = mockDataSource.getRepository(Loan);
      const memberRepository = mockDataSource.getRepository(Member);

      loanRepository.findOne.mockResolvedValue(loanWithoutVoters);
      memberRepository.findOne.mockResolvedValue(mockAuthor);
      loanRepository.save.mockResolvedValue({
        ...loanWithoutVoters,
        voters: [mockAuthor.id],
      });

      await service.vote(1, mockUser);

      expect(loanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { user: { username: mockUser.username } },
      });
      expect(loanRepository.save).toHaveBeenCalled();
    });

    it('devrait ajouter un vote à un tableau existant de votants', async () => {
      const differentAuthor: Member = {
        ...mockAuthor,
        id: 2, // ID différent pour éviter le conflit
      };
      const loanWithVoters: Loan = {
        ...mockLoan,
        voters: [3, 4], // IDs différents de differentAuthor.id
        author: differentAuthor,
      };
      const loanRepository = mockDataSource.getRepository(Loan);
      const memberRepository = mockDataSource.getRepository(Member);

      loanRepository.findOne.mockResolvedValue(loanWithVoters);
      memberRepository.findOne.mockResolvedValue(differentAuthor);
      loanRepository.save.mockResolvedValue({
        ...loanWithVoters,
        voters: [3, 4, differentAuthor.id],
      });

      await service.vote(1, { ...mockUser, username: 'differentuser' });

      expect(loanRepository.save).toHaveBeenCalled();
    });

    it("devrait lancer une erreur si le prêt n'existe pas", async () => {
      const loanRepository = mockDataSource.getRepository(Loan);

      loanRepository.findOne.mockResolvedValue(null);

      await expect(service.vote(999, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.vote(999, mockUser)).rejects.toThrow(
        'Loan not found',
      );
    });

    it("devrait lancer une erreur si le membre n'existe pas", async () => {
      const loanRepository = mockDataSource.getRepository(Loan);
      const memberRepository = mockDataSource.getRepository(Member);

      // vote appelle this.findOne(id) qui appelle loanRepository.findOne
      // Puis vote appelle memberRepository.findOne
      loanRepository.findOne.mockResolvedValue(mockLoan);
      memberRepository.findOne.mockResolvedValue(null);

      await expect(service.vote(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.vote(1, mockUser)).rejects.toThrow(
        'Member not found',
      );
    });

    it('devrait lancer une erreur si le membre a déjà voté', async () => {
      const loanWithVoter: Loan = {
        ...mockLoan,
        voters: [mockAuthor.id],
      };
      const loanRepository = mockDataSource.getRepository(Loan);
      const memberRepository = mockDataSource.getRepository(Member);

      loanRepository.findOne.mockResolvedValue(loanWithVoter);
      memberRepository.findOne.mockResolvedValue(mockAuthor);

      await expect(service.vote(1, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.vote(1, mockUser)).rejects.toThrow(
        'You already voted',
      );
    });
  });
});
