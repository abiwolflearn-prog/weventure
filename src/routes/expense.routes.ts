import { Router } from 'express';
import { expenseController } from '../controllers/ExpenseController';
import { authGuard } from '../middleware/authGuard';

const expenseRouter = Router();

expenseRouter.use(authGuard);

expenseRouter.get('/', expenseController.getAll);
expenseRouter.post('/', expenseController.create);
expenseRouter.get('/:id', expenseController.getById);
expenseRouter.put('/:id', expenseController.update);
expenseRouter.delete('/:id', expenseController.delete);

export default expenseRouter;
