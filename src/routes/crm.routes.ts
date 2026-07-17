import { Router } from 'express';
import { crmController } from '../controllers/CrmController';
import { authGuard } from '../middleware/authGuard';

const crmRouter = Router();

// Secure all CRM pathways with authentication guard
crmRouter.use(authGuard);

// --- CRM Dashboard / Analytics ---
crmRouter.get('/analytics', crmController.getCrmAnalytics);

// --- Companies Routes ---
crmRouter.get('/companies', crmController.getCompanies);
crmRouter.post('/companies', crmController.createCompany);
crmRouter.get('/companies/:id', crmController.getCompanyById);
crmRouter.put('/companies/:id', crmController.updateCompany);
crmRouter.delete('/companies/:id', crmController.deleteCompany);

// --- Contacts Routes ---
crmRouter.get('/contacts', crmController.getContacts);
crmRouter.post('/contacts', crmController.createContact);
crmRouter.get('/contacts/:id', crmController.getContactById);
crmRouter.put('/contacts/:id', crmController.updateContact);
crmRouter.delete('/contacts/:id', crmController.deleteContact);
crmRouter.post('/contacts/:id/notes', crmController.addContactNote);

// --- Leads Routes ---
crmRouter.get('/leads', crmController.getLeads);
crmRouter.post('/leads', crmController.createLead);
crmRouter.get('/leads/:id', crmController.getLeadById);
crmRouter.put('/leads/:id', crmController.updateLead);
crmRouter.delete('/leads/:id', crmController.deleteLead);
crmRouter.post('/leads/:id/notes', crmController.addLeadNote);

// --- Activities Routes ---
crmRouter.get('/activities', crmController.getActivities);
crmRouter.post('/activities', crmController.createActivity);
crmRouter.delete('/activities/:id', crmController.deleteActivity);

export default crmRouter;
