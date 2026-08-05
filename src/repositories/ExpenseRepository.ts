import { Expense, IExpenseDocument } from '../models/Expense';

export interface IExpenseFilters {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  vendor?: string;
  search?: string;
}

export class ExpenseRepository {
  public async create(data: Partial<IExpenseDocument>): Promise<IExpenseDocument> {
    const expense = new Expense(data);
    return await expense.save();
  }

  public async findAll(filters: IExpenseFilters, page: number = 1, limit: number = 20): Promise<{ docs: IExpenseDocument[], total: number }> {
    const query: any = {};
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.vendor) query.vendor = filters.vendor;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { vendor: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const total = await Expense.countDocuments(query);
    const docs = await Expense.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
      
    return { docs, total };
  }

  public async findById(id: string): Promise<IExpenseDocument | null> {
    return await Expense.findById(id).exec();
  }

  public async update(id: string, data: Partial<IExpenseDocument>): Promise<IExpenseDocument | null> {
    return await Expense.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  public async delete(id: string): Promise<IExpenseDocument | null> {
    return await Expense.findByIdAndDelete(id).exec();
  }
}

export const expenseRepository = new ExpenseRepository();
