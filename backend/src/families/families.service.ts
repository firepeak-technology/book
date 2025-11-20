import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';

@Injectable()
export class FamiliesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createFamilyDto: CreateFamilyDto) {
    return this.prisma.family.create({
      data: {
        ...createFamilyDto,
        users: {
          connect: { id: userId },
        },
      },
      include: {
        users: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.family.findUnique({
      where: { id },
      include: {
        users: true,
        ownedBooks: {
          include: {
            book: {
              include: {
                authors: {
                  include: {
                    author: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async joinFamily(userId: string, familyId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        familyId,
      },
      include: {
        family: true,
      },
    });
  }

  async leaveFamily(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        familyId: null,
      },
    });
  }
}
