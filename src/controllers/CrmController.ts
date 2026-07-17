import { Request, Response, NextFunction } from 'express';
import { crmService } from '../services/CrmService';
import { ApiResponse } from '../utils/response';

export class CrmController {
  // ==========================================
  // COMPANIES CONTROLLER METHODS
  // ==========================================
  public async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const company = await crmService.createCompany(tenantId, req.body);
      ApiResponse.success(res, company, 201, { message: 'Company created successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { search } = req.query;
      const companies = await crmService.getCompanies(tenantId, search ? String(search) : undefined);
      ApiResponse.success(res, companies);
    } catch (error) {
      next(error);
    }
  }

  public async getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const company = await crmService.getCompanyById(tenantId, id);
      ApiResponse.success(res, company);
    } catch (error) {
      next(error);
    }
  }

  public async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const company = await crmService.updateCompany(tenantId, id, req.body);
      ApiResponse.success(res, company, 200, { message: 'Company updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      await crmService.deleteCompany(tenantId, id);
      ApiResponse.success(res, { deleted: true }, 200, { message: 'Company deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // CONTACTS CONTROLLER METHODS
  // ==========================================
  public async createContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const contact = await crmService.createContact(tenantId, req.body);
      ApiResponse.success(res, contact, 201, { message: 'Contact created successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { search, status } = req.query;
      const contacts = await crmService.getContacts(
        tenantId,
        search ? String(search) : undefined,
        status ? String(status) : undefined
      );
      ApiResponse.success(res, contacts);
    } catch (error) {
      next(error);
    }
  }

  public async getContactById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const contact = await crmService.getContactById(tenantId, id);
      ApiResponse.success(res, contact);
    } catch (error) {
      next(error);
    }
  }

  public async updateContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const contact = await crmService.updateContact(tenantId, id, req.body);
      ApiResponse.success(res, contact, 200, { message: 'Contact updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async deleteContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      await crmService.deleteContact(tenantId, id);
      ApiResponse.success(res, { deleted: true }, 200, { message: 'Contact deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async addContactNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const { author, content } = req.body;
      const authorName = author || req.user?.email || 'System Staff';
      const contact = await crmService.addContactNote(tenantId, id, authorName, content);
      ApiResponse.success(res, contact, 200, { message: 'Note added successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // LEADS CONTROLLER METHODS
  // ==========================================
  public async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const lead = await crmService.createLead(tenantId, req.body);
      ApiResponse.success(res, lead, 201, { message: 'Lead created successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { stage, status } = req.query;
      const leads = await crmService.getLeads(
        tenantId,
        stage ? String(stage) : undefined,
        status ? String(status) : undefined
      );
      ApiResponse.success(res, leads);
    } catch (error) {
      next(error);
    }
  }

  public async getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const lead = await crmService.getLeadById(tenantId, id);
      ApiResponse.success(res, lead);
    } catch (error) {
      next(error);
    }
  }

  public async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const lead = await crmService.updateLead(tenantId, id, req.body);
      ApiResponse.success(res, lead, 200, { message: 'Lead updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      await crmService.deleteLead(tenantId, id);
      ApiResponse.success(res, { deleted: true }, 200, { message: 'Lead deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async addLeadNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const { author, content } = req.body;
      const authorName = author || req.user?.email || 'System Staff';
      const lead = await crmService.addLeadNote(tenantId, id, authorName, content);
      ApiResponse.success(res, lead, 200, { message: 'Note added successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ACTIVITIES CONTROLLER METHODS
  // ==========================================
  public async createActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const activity = await crmService.createActivity(tenantId, req.body);
      ApiResponse.success(res, activity, 201, { message: 'Activity logged successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { contactId, leadId } = req.query;
      const activities = await crmService.getActivities(
        tenantId,
        contactId ? String(contactId) : undefined,
        leadId ? String(leadId) : undefined
      );
      ApiResponse.success(res, activities);
    } catch (error) {
      next(error);
    }
  }

  public async deleteActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      await crmService.deleteActivity(tenantId, id);
      ApiResponse.success(res, { deleted: true }, 200, { message: 'Activity deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // CRM ANALYTICS DASHBOARD
  // ==========================================
  public async getCrmAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const analytics = await crmService.getCrmAnalytics(tenantId);
      ApiResponse.success(res, analytics);
    } catch (error) {
      next(error);
    }
  }
}

export const crmController = new CrmController();
