import { Registration, IRegistrationDocument } from '../models/Registration';
import { IRegistration, RegistrationStatus } from '../types';

export class RegistrationRepository {
  public async create(data: Partial<IRegistration>): Promise<IRegistrationDocument> {
    const registration = new Registration(data);
    return await registration.save();
  }

  public async findById(id: string, tenantId: string): Promise<IRegistrationDocument | null> {
    return await Registration.findOne({ _id: id, tenantId }).exec();
  }

  public async findByTicketNumber(ticketNumber: string, tenantId: string): Promise<IRegistrationDocument | null> {
    return await Registration.findOne({ ticketNumber, tenantId }).exec();
  }

  public async findByQrCode(qrCode: string, tenantId: string): Promise<IRegistrationDocument | null> {
    return await Registration.findOne({ qrCode, tenantId }).exec();
  }

  public async findByUser(userId: string, tenantId: string): Promise<IRegistrationDocument[]> {
    return await Registration.find({ userId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  public async findByEvent(eventId: string, tenantId: string): Promise<IRegistrationDocument[]> {
    return await Registration.find({ eventId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  public async countByTicketType(ticketTypeId: string, tenantId: string): Promise<number> {
    return await Registration.countDocuments({
      ticketTypeId,
      tenantId,
      status: { $in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING_APPROVAL] },
    }).exec();
  }

  public async findAll(tenantId: string, page: number = 1, limit: number = 20): Promise<{ docs: IRegistrationDocument[]; total: number }> {
    const query = { tenantId };
    const total = await Registration.countDocuments(query).exec();
    const docs = await Registration.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { docs, total };
  }

  public async updateStatus(id: string, tenantId: string, status: RegistrationStatus): Promise<IRegistrationDocument | null> {
    return await Registration.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { status } },
      { new: true }
    ).exec();
  }

  public async checkIn(id: string, tenantId: string, checkedIn: boolean = true): Promise<IRegistrationDocument | null> {
    return await Registration.findOneAndUpdate(
      { _id: id, tenantId },
      {
        $set: {
          checkedIn,
          checkedInAt: checkedIn ? new Date() : undefined,
        },
      },
      { new: true }
    ).exec();
  }
}

export const registrationRepository = new RegistrationRepository();
