import { expenseRepository, IExpenseFilters } from '../repositories/ExpenseRepository';
import { IExpenseDocument } from '../models/Expense';
import { IUserIdentity } from '../types';
import { emailNotificationManager } from './EmailNotificationManager';

export class ExpenseService {
  public async createExpense(user: IUserIdentity, data: Partial<IExpenseDocument>): Promise<IExpenseDocument> {
    const expense = await expenseRepository.create({ ...data, createdBy: user.id });

    // Trigger expense creation email asynchronously
    emailNotificationManager.sendExpenseCreatedConfirmation(user, expense).catch((err) => {
      console.error('Failed to trigger expense creation notification email:', err);
    });

    return expense;
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
