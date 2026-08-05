import { Request, Response, NextFunction } from 'express';
import { expenseService } from '../services/ExpenseService';
import { ApiResponse } from '../utils/response';
import { NotFoundError } from '../errors/AppError';
import { IUserIdentity } from '../types';

export class ExpenseController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as IUserIdentity;
      const expense = await expenseService.createExpense(user, req.body);
      ApiResponse.success(res, expense, 201);
    } catch (error) {
      next(error);
    }
  }

  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, vendor, search, page, limit } = req.query;
      const expenses = await expenseService.getExpenses(
        { category: category as string, status: status as string, vendor: vendor as string, search: search as string },
        Number(page) || 1,
        Number(limit) || 20
      );
      ApiResponse.success(res, expenses, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expenseService.getExpenseById(req.params.id);
      if (!expense) {
        throw new NotFoundError('Expense not found');
      }
      ApiResponse.success(res, expense, 200);
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expenseService.updateExpense(req.params.id, req.body);
      ApiResponse.success(res, expense, 200);
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await expenseService.deleteExpense(req.params.id);
      ApiResponse.success(res, { id: req.params.id }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
