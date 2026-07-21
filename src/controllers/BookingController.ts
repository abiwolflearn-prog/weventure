import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/BookingService';
import { ApiResponse } from '../utils/response';
import { IUserIdentity } from '../types';

export class BookingController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const booking = await bookingService.createBooking(tenantId, req.body, user);
      ApiResponse.success(res, booking, 201, {
        message: 'Booking created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id, tenantId);
      ApiResponse.success(res, booking, 200);
    } catch (error) {
      next(error);
    }
  }

  public async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      const booking = await bookingService.cancelBooking(id, tenantId, user);
      ApiResponse.success(res, booking, 200, {
        message: 'Booking cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      const booking = await bookingService.approveBooking(id, tenantId, user);
      ApiResponse.success(res, booking, 200, {
        message: 'Booking reservation confirmed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      const booking = await bookingService.rejectBooking(id, tenantId, user);
      ApiResponse.success(res, booking, 200, {
        message: 'Booking reservation rejected successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async renew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      const booking = await bookingService.renewBooking(id, tenantId, req.body, user);
      ApiResponse.success(res, booking, 200, {
        message: 'Booking reservation renewed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      const isAdminOrStaff = ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(user.role);

      const filters = {
        spaceId: req.query.spaceId as string,
        userId: isAdminOrStaff ? (req.query.userId as string) : user.id,
        status: req.query.status as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await bookingService.listBookings(tenantId, filters, page, limit);
      ApiResponse.paginated(res, result.docs, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      });
    } catch (error) {
      next(error);
    }
  }

  public async generateAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params; // bookingId
      const user = req.user as IUserIdentity;
      const agreement = await bookingService.generateAgreement(id, tenantId, req.body, user);
      ApiResponse.success(res, agreement, 201, {
        message: 'Agreement drafted and dispatched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async signAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params; // bookingId
      const { customerName } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
      const agreement = await bookingService.signAgreement(id, tenantId, customerName, ipAddress);
      ApiResponse.success(res, agreement, 200, {
        message: 'Agreement digitally signed and executed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async generateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params; // bookingId
      const user = req.user as IUserIdentity;
      const invoice = await bookingService.generateBookingInvoice(id, tenantId, user);
      ApiResponse.success(res, invoice, 201, {
        message: 'Invoice generated and scheduled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAgreement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params; // bookingId
      const { Agreement } = require('../models/Agreement');
      const agreement = await Agreement.findOne({ bookingId: id, tenantId }).exec();
      ApiResponse.success(res, agreement, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
