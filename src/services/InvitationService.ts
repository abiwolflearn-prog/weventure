import crypto from 'crypto';
import { Invitation, IInvitationDocument } from '../models/Invitation';
import { Tenant } from '../models/Tenant';
import { TenantAuditLog } from '../models/TenantAuditLog';
import { UserRole, IUserIdentity } from '../types';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class InvitationService {
  /**
   * Create an email invitation for a team member
   */
  public async createInvitation(
    tenantId: string,
    email: string,
    role: UserRole,
    user: IUserIdentity
  ): Promise<IInvitationDocument> {
    if (!email || !role) {
      throw new ValidationError('Email and role are required for team invitation');
    }

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new NotFoundError(`Tenant with ID '${tenantId}' not found`);
    }

    // Check if there is already a pending invitation for this email in this tenant
    const existing = await Invitation.findOne({ tenantId, email, status: 'PENDING' });
    if (existing) {
      // Extend expiration and reuse it
      existing.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      existing.role = role;
      await existing.save();
      return existing;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const invitation = await Invitation.create({
      tenantId,
      email: email.toLowerCase(),
      role,
      token,
      status: 'PENDING',
      invitedBy: user.email,
      expiresAt,
    });

    // Write to audit log
    try {
      await TenantAuditLog.create({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'INVITATION_SENT',
        details: { invitedEmail: email, role },
      });
    } catch (err) {
      logger.error('Failed to write audit log for invitation', err);
    }

    return invitation;
  }

  /**
   * Get invitation by token
   */
  public async getInvitationByToken(token: string): Promise<IInvitationDocument> {
    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      throw new NotFoundError('Invalid invitation token');
    }

    // Check expiration
    if (invitation.expiresAt < new Date()) {
      if (invitation.status === 'PENDING') {
        invitation.status = 'EXPIRED';
        await invitation.save();
      }
      throw new ValidationError('This invitation link has expired. Please request a new one.');
    }

    return invitation;
  }

  /**
   * Accept an invitation
   */
  public async acceptInvitation(token: string): Promise<IInvitationDocument> {
    const invitation = await this.getInvitationByToken(token);

    if (invitation.status !== 'PENDING') {
      throw new ValidationError(`This invitation has already been ${invitation.status.toLowerCase()}`);
    }

    invitation.status = 'ACCEPTED';
    await invitation.save();

    // Write to audit log
    try {
      await TenantAuditLog.create({
        tenantId: invitation.tenantId,
        userId: `usr_invited_${Math.random().toString(36).substring(2, 8)}`,
        userEmail: invitation.email,
        action: 'INVITATION_ACCEPTED',
        details: { email: invitation.email, role: invitation.role },
      });
    } catch (err) {
      logger.error('Failed to log invitation acceptance', err);
    }

    return invitation;
  }

  /**
   * List invitations for a tenant
   */
  public async listTenantInvitations(tenantId: string): Promise<IInvitationDocument[]> {
    return await Invitation.find({ tenantId }).sort({ createdAt: -1 });
  }

  /**
   * Revoke/Delete invitation
   */
  public async revokeInvitation(id: string, tenantId: string, user: IUserIdentity): Promise<boolean> {
    const result = await Invitation.findOneAndDelete({ _id: id, tenantId });
    if (!result) {
      throw new NotFoundError('Invitation not found');
    }

    // Audit Log
    try {
      await TenantAuditLog.create({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'INVITATION_REVOKED',
        details: { email: result.email },
      });
    } catch (err) {
      logger.error('Failed to log invitation revoke', err);
    }

    return true;
  }
}

export const invitationService = new InvitationService();
