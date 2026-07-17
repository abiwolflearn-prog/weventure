import { Order, IOrderDocument } from '../models/Order';
import { IOrder, OrderStatus } from '../types';

export class OrderRepository {
  public async create(data: Partial<IOrder>): Promise<IOrderDocument> {
    const order = new Order(data);
    return await order.save();
  }

  public async findById(id: string, tenantId: string): Promise<IOrderDocument | null> {
    return await Order.findOne({ _id: id, tenantId }).exec();
  }

  public async findByUser(userId: string, tenantId: string): Promise<IOrderDocument[]> {
    return await Order.find({ userId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  public async findByEvent(eventId: string, tenantId: string): Promise<IOrderDocument[]> {
    return await Order.find({ eventId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  public async findAll(tenantId: string, page: number = 1, limit: number = 20): Promise<{ docs: IOrderDocument[]; total: number }> {
    const query = { tenantId };
    const total = await Order.countDocuments(query).exec();
    const docs = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { docs, total };
  }

  public async updateStatus(id: string, tenantId: string, status: OrderStatus): Promise<IOrderDocument | null> {
    return await Order.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { status } },
      { new: true }
    ).exec();
  }
}

export const orderRepository = new OrderRepository();
