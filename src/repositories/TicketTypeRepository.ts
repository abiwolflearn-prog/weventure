import { TicketType, ITicketTypeDocument } from '../models/TicketType';
import { ITicketType, TicketStatus } from '../types';

export class TicketTypeRepository {
  public async create(data: Partial<ITicketType>): Promise<ITicketTypeDocument> {
    const ticketType = new TicketType(data);
    return await ticketType.save();
  }

  public async findById(id: string, tenantId: string): Promise<ITicketTypeDocument | null> {
    return await TicketType.findOne({ _id: id, tenantId }).exec();
  }

  public async findByEvent(eventId: string, tenantId: string): Promise<ITicketTypeDocument[]> {
    return await TicketType.find({ eventId, tenantId, status: TicketStatus.ACTIVE }).exec();
  }

  public async findAllByEventAdmin(eventId: string, tenantId: string): Promise<ITicketTypeDocument[]> {
    return await TicketType.find({ eventId, tenantId }).exec();
  }

  public async update(
    id: string,
    tenantId: string,
    updateData: Partial<ITicketType>
  ): Promise<ITicketTypeDocument | null> {
    return await TicketType.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  public async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await TicketType.updateOne(
      { _id: id, tenantId },
      { $set: { status: TicketStatus.ARCHIVED } }
    ).exec();
    return result.modifiedCount > 0;
  }
}

export const ticketTypeRepository = new TicketTypeRepository();
