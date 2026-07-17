import mongoose from 'mongoose';
import { Contact, IContactDocument } from '../models/Contact';
import { Company, ICompanyDocument } from '../models/Company';
import { Lead, ILeadDocument } from '../models/Lead';
import { CrmActivity, ICrmActivityDocument } from '../models/CrmActivity';
import { Registration } from '../models/Registration';
import { Booking } from '../models/Booking';
import { Order } from '../models/Order';
import { ValidationError, NotFoundError } from '../errors/AppError';

export class CrmService {
  // ==========================================
  // COMPANIES CRUD
  // ==========================================
  public async createCompany(tenantId: string, data: any): Promise<ICompanyDocument> {
    if (!data.name) {
      throw new ValidationError('Company name is required');
    }
    const company = new Company({
      ...data,
      tenantId,
    });
    return await company.save();
  }

  public async getCompanies(tenantId: string, search?: string): Promise<ICompanyDocument[]> {
    const query: any = { tenantId };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    return await Company.find(query).sort({ name: 1 }).exec();
  }

  public async getCompanyById(tenantId: string, id: string): Promise<ICompanyDocument> {
    const company = await Company.findOne({ _id: id, tenantId }).exec();
    if (!company) {
      throw new NotFoundError('Company not found');
    }
    return company;
  }

  public async updateCompany(tenantId: string, id: string, data: any): Promise<ICompanyDocument> {
    const company = await Company.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
    if (!company) {
      throw new NotFoundError('Company not found');
    }
    return company;
  }

  public async deleteCompany(tenantId: string, id: string): Promise<void> {
    const res = await Company.deleteOne({ _id: id, tenantId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundError('Company not found');
    }
    // Set companyId to null on associated contacts
    await Contact.updateMany({ companyId: id, tenantId }, { $unset: { companyId: 1 } }).exec();
    // Set companyId to null on associated leads
    await Lead.updateMany({ companyId: id, tenantId }, { $unset: { companyId: 1 } }).exec();
  }

  // ==========================================
  // CONTACTS CRUD
  // ==========================================
  public async createContact(tenantId: string, data: any): Promise<IContactDocument> {
    if (!data.firstName || !data.lastName || !data.email) {
      throw new ValidationError('First name, last name, and email are required');
    }
    const contact = new Contact({
      ...data,
      tenantId,
    });
    return await contact.save();
  }

  public async getContacts(tenantId: string, search?: string, status?: string): Promise<IContactDocument[]> {
    const query: any = { tenantId };
    if (status) {
      query.status = status;
    }
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ];
    }
    return await Contact.find(query)
      .populate('companyId', 'name domain industry')
      .sort({ createdAt: -1 })
      .exec();
  }

  public async getContactById(tenantId: string, id: string): Promise<any> {
    const contact = await Contact.findOne({ _id: id, tenantId })
      .populate('companyId')
      .exec();
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    const email = contact.email;

    // INTEGRATIONS: Dynamic lookups for registrations, workspace bookings, and tickets
    const [registrations, bookings, orders] = await Promise.all([
      Registration.find({ tenantId, attendeeEmail: { $regex: new RegExp(`^${email}$`, 'i') } })
        .populate({ path: 'eventId', model: 'Event', select: 'title schedule status' })
        .exec(),
      Booking.find({ tenantId, userEmail: { $regex: new RegExp(`^${email}$`, 'i') } })
        .populate({ path: 'spaceId', model: 'Workspace', select: 'name type hourlyRate' })
        .exec(),
      Order.find({ tenantId, userEmail: { $regex: new RegExp(`^${email}$`, 'i') } })
        .populate({ path: 'eventId', model: 'Event', select: 'title' })
        .exec(),
    ]);

    return {
      ...contact.toObject(),
      integrations: {
        registrations,
        bookings,
        orders,
      },
    };
  }

  public async updateContact(tenantId: string, id: string, data: any): Promise<IContactDocument> {
    const contact = await Contact.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }
    return contact;
  }

  public async deleteContact(tenantId: string, id: string): Promise<void> {
    const res = await Contact.deleteOne({ _id: id, tenantId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundError('Contact not found');
    }
    // Delete any CRM activities assigned to this contact
    await CrmActivity.deleteMany({ contactId: id, tenantId }).exec();
    // Delete any leads associated with this contact
    await Lead.deleteMany({ contactId: id, tenantId }).exec();
  }

  public async addContactNote(tenantId: string, id: string, author: string, content: string): Promise<IContactDocument> {
    if (!content) {
      throw new ValidationError('Note content cannot be empty');
    }
    const contact = await Contact.findOneAndUpdate(
      { _id: id, tenantId },
      { $push: { notes: { author, content, createdAt: new Date() } } },
      { new: true }
    ).exec();
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }
    return contact;
  }

  // ==========================================
  // LEADS CRUD & PIPELINES
  // ==========================================
  public async createLead(tenantId: string, data: any): Promise<ILeadDocument> {
    if (!data.title) {
      throw new ValidationError('Lead title is required');
    }
    const lead = new Lead({
      ...data,
      tenantId,
    });
    return await lead.save();
  }

  public async getLeads(tenantId: string, stage?: string, status?: string): Promise<ILeadDocument[]> {
    const query: any = { tenantId };
    if (stage) {
      query.pipelineStage = stage;
    }
    if (status) {
      query.status = status;
    }
    return await Lead.find(query)
      .populate('contactId', 'firstName lastName email phone')
      .populate('companyId', 'name domain')
      .sort({ updatedAt: -1 })
      .exec();
  }

  public async getLeadById(tenantId: string, id: string): Promise<ILeadDocument> {
    const lead = await Lead.findOne({ _id: id, tenantId })
      .populate('contactId')
      .populate('companyId')
      .exec();
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    return lead;
  }

  public async updateLead(tenantId: string, id: string, data: any): Promise<ILeadDocument> {
    const lead = await Lead.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    return lead;
  }

  public async deleteLead(tenantId: string, id: string): Promise<void> {
    const res = await Lead.deleteOne({ _id: id, tenantId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundError('Lead not found');
    }
    await CrmActivity.deleteMany({ leadId: id, tenantId }).exec();
  }

  public async addLeadNote(tenantId: string, id: string, author: string, content: string): Promise<ILeadDocument> {
    if (!content) {
      throw new ValidationError('Note content cannot be empty');
    }
    const lead = await Lead.findOneAndUpdate(
      { _id: id, tenantId },
      { $push: { notes: { author, content, createdAt: new Date() } } },
      { new: true }
    ).exec();
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }
    return lead;
  }

  // ==========================================
  // ACTIVITIES CRUD
  // ==========================================
  public async createActivity(tenantId: string, data: any): Promise<ICrmActivityDocument> {
    if (!data.title || !data.type) {
      throw new ValidationError('Activity title and type are required');
    }
    const activity = new CrmActivity({
      ...data,
      tenantId,
    });
    return await activity.save();
  }

  public async getActivities(tenantId: string, contactId?: string, leadId?: string): Promise<ICrmActivityDocument[]> {
    const query: any = { tenantId };
    if (contactId) {
      query.contactId = contactId;
    }
    if (leadId) {
      query.leadId = leadId;
    }
    return await CrmActivity.find(query)
      .populate('contactId', 'firstName lastName email')
      .populate('leadId', 'title')
      .sort({ date: -1 })
      .exec();
  }

  public async deleteActivity(tenantId: string, id: string): Promise<void> {
    const res = await CrmActivity.deleteOne({ _id: id, tenantId }).exec();
    if (res.deletedCount === 0) {
      throw new NotFoundError('Activity not found');
    }
  }

  // ==========================================
  // CRM ANALYTICS DASHBOARD
  // ==========================================
  public async getCrmAnalytics(tenantId: string): Promise<any> {
    // 1. Lead Pipeline aggregation
    const pipelineStats = await Lead.aggregate([
      { $match: { tenantId, status: 'ACTIVE' } },
      {
        $group: {
          _id: '$pipelineStage',
          count: { $sum: 1 },
          totalValue: { $sum: '$dealValue' },
        },
      },
    ]);

    // Format pipeline data with standard stages to ensure they all display gracefully in the chart
    const standardStages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    const formattedPipeline = standardStages.map((stage) => {
      const match = pipelineStats.find((s) => s._id === stage);
      return {
        stage,
        count: match ? match.count : 0,
        value: match ? match.totalValue : 0,
      };
    });

    // 2. Contact Growth timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contactGrowth = await Contact.aggregate([
      { $match: { tenantId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Overall Leads Metrics
    const [totalLeadsCount, wonLeadsCount, activeLeadsValue] = await Promise.all([
      Lead.countDocuments({ tenantId }),
      Lead.countDocuments({ tenantId, pipelineStage: 'WON' }),
      Lead.aggregate([
        { $match: { tenantId, status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: '$dealValue' } } },
      ]),
    ]);

    const conversionRate = totalLeadsCount > 0 ? (wonLeadsCount / totalLeadsCount) * 100 : 0;

    // 4. Activity Timeline
    const activities = await CrmActivity.find({ tenantId })
      .populate('contactId', 'firstName lastName')
      .populate('leadId', 'title')
      .sort({ date: -1 })
      .limit(10)
      .exec();

    // Dynamically retrieve registration or booking counts to represent cross-platform activity growth
    const [registrationsCount, bookingsCount] = await Promise.all([
      Registration.countDocuments({ tenantId }),
      Booking.countDocuments({ tenantId }),
    ]);

    return {
      pipeline: formattedPipeline,
      contactGrowth: contactGrowth.map((g) => ({ date: g._id, count: g.count })),
      metrics: {
        totalLeads: totalLeadsCount,
        wonLeads: wonLeadsCount,
        activeValue: activeLeadsValue[0]?.total || 0,
        conversionRate: Math.round(conversionRate * 10) / 10,
        registrationsCount,
        bookingsCount,
      },
      recentActivities: activities,
    };
  }
}

export const crmService = new CrmService();
