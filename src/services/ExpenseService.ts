import { expenseRepository, IExpenseFilters } from '../repositories/ExpenseRepository';
import { IExpenseDocument } from '../models/Expense';
import { IUserIdentity } from '../types';

export class ExpenseService {
  public async createExpense(user: IUserIdentity, data: Partial<IExpenseDocument>): Promise<IExpenseDocument> {
    return await expenseRepository.create({ ...data, createdBy: user.id });
  }

  public async getExpenses(filters: IExpenseFilters, page: number, limit: number) {
    return await expenseRepository.findAll(filters, page, limit);
  }

  public async getExpenseById(id: string): Promise<IExpenseDocument | null> {
    return await expenseRepository.findById(id);
  }

  public async updateExpense(id: string, data: Partial<IExpenseDocument>): Promise<IExpenseDocument | null> {
    return await expenseRepository.update(id, data);
  }

  public async deleteExpense(id: string): Promise<IExpenseDocument | null> {
    return await expenseRepository.delete(id);
  }
}

export const expenseService = new ExpenseService();
