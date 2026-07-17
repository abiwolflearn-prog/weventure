import { Router } from 'express';
import { workspaceController } from '../controllers/WorkspaceController';
import { authGuard } from '../middleware/authGuard';
import { hasPermission } from '../middleware/roleGuard';
import { Permission } from '../types';

const workspaceRouter = Router();

// Retrieve all workspaces (isolated per tenant context)
workspaceRouter.get('/', authGuard, workspaceController.list);

// Retrieve a single workspace details
workspaceRouter.get('/:id', authGuard, workspaceController.getById);

// Create a new workspace (Admin or Staff)
workspaceRouter.post(
  '/',
  authGuard,
  hasPermission(Permission.WORKSPACES_CREATE),
  workspaceController.create
);

// Update workspace parameters
workspaceRouter.put(
  '/:id',
  authGuard,
  hasPermission(Permission.WORKSPACES_UPDATE),
  workspaceController.update
);

// Delete workspace (soft delete)
workspaceRouter.delete(
  '/:id',
  authGuard,
  hasPermission(Permission.WORKSPACES_DELETE),
  workspaceController.delete
);

export default workspaceRouter;
