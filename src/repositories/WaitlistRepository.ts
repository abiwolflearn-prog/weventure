import { Waitlist, IWaitlistDocument } from '../models/Waitlist';
import { IWaitlist, WaitlistStatus } from '../types';

export class WaitlistRepository {
  public async create(data: Partial<IWaitlist>): Promise<IWaitlistDocument> {
    const waitlist = new Waitlist(data);
    return await waitlist.save();
  }

  public async findById(id: string, tenantId: string): Promise<IWaitlistDocument | null> {
    return await Waitlist.findOne({ _id: id, tenantId }).exec();
  }

  public async findByUserAndEvent(userId: string, eventId: string, tenantId: string): Promise<IWaitlistDocument | null> {
    return await Waitlist.findOne({ userId, eventId, tenantId }).exec();
  }

  public async findByEvent(eventId: string, tenantId: string): Promise<IWaitlistDocument[]> {
    return await Waitlist.find({ eventId, tenantId })
      .sort({ joinedAt: 1 })
      .exec();
  }

  public async getQueuePosition(joinedAt: Date, eventId: string, tenantId: string): Promise<number> {
    return await Waitlist.countDocuments({
      eventId,
      tenantId,
      status: WaitlistStatus.WAITLISTED,
      joinedAt: { $lt: joinedAt },
    }).exec() + 1;
  }

  public async updateStatus(id: string, tenantId: string, status: WaitlistStatus): Promise<IWaitlistDocument | null> {
    const update: any = { status };
    if (status === WaitlistStatus.PROMOTED) {
      update.promotedAt = new Date();
    }
    return await Waitlist.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: update },
      { new: true }
    ).exec();
  }

  public async leave(id: string, tenantId: string): Promise<IWaitlistDocument | null> {
    return await Waitlist.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { status: WaitlistStatus.LEFT } },
      { new: true }
    ).exec();
  }
}

export const waitlistRepository = new WaitlistRepository();
