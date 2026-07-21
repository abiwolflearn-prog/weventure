import { Booking, IBookingDocument } from '../models/Booking';

export interface IBookingFilters {
  spaceId?: string;
  userId?: string;
  status?: 'PENDING_APPROVAL' | 'CONFIRMED' | 'CANCELLED';
  startDate?: string; // Date range filter
  endDate?: string;
}

export interface IPaginatedBookings {
  docs: IBookingDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BookingRepository {
  public async create(data: Partial<any>): Promise<IBookingDocument> {
    const booking = new Booking(data);
    return await booking.save();
  }

  public async findById(id: string, tenantId: string): Promise<IBookingDocument | null> {
    return await Booking.findOne({ _id: id, tenantId }).exec();
  }

  public async update(
    id: string,
    tenantId: string,
    updateData: any
  ): Promise<IBookingDocument | null> {
    const isDirectQuery = Object.keys(updateData).some(key => key.startsWith('$'));
    const updatePayload = isDirectQuery ? updateData : { $set: updateData };
    return await Booking.findOneAndUpdate(
      { _id: id, tenantId },
      updatePayload,
      { new: true, runValidators: true }
    ).exec();
  }

  public async findOverlappingBookings(
    tenantId: string,
    spaceId: string,
    start: Date,
    end: Date,
    excludeBookingId?: string
  ): Promise<IBookingDocument[]> {
    const query: any = {
      tenantId,
      spaceId,
      status: { $ne: 'CANCELLED' },
      // Overlap logic: (StartA < EndB) AND (EndA > StartB)
      startTime: { $lt: end },
      endTime: { $gt: start },
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    return await Booking.find(query).exec();
  }

  public async findAll(
    tenantId: string,
    filters: IBookingFilters,
    page: number = 1,
    limit: number = 100
  ): Promise<IPaginatedBookings> {
    const query: any = { tenantId };

    if (filters.spaceId) {
      query.spaceId = filters.spaceId;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.startTime.$lte = new Date(filters.endDate);
      }
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Booking.find(query).sort({ startTime: 1 }).skip(skip).limit(limit).exec(),
      Booking.countDocuments(query).exec(),
    ]);

    return {
      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const bookingRepository = new BookingRepository();
