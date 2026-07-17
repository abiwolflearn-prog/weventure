import mongoose, { Schema, Document } from 'mongoose';

export enum ReportType {
  EVENT = 'EVENT',
  WORKSPACE = 'WORKSPACE',
  FINANCIAL = 'FINANCIAL',
  USER = 'USER',
  OPERATIONAL = 'OPERATIONAL',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface IReportDocument extends Document {
  id: string;
  tenantId: string;
  name: string;
  type: ReportType;
  description?: string;
  createdBy: string;
  filters: {
    startDate?: string;
    endDate?: string;
    preset?: string;
    eventId?: string;
    workspaceId?: string;
    paymentStatus?: string;
    registrationStatus?: string;
  };
  format: ReportFormat;
  scheduling: {
    enabled: boolean;
    frequency?: ScheduleFrequency;
    emailRecipients: string[];
    nextRunAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportHistoryDocument extends Document {
  id: string;
  reportId?: string;
  tenantId: string;
  name: string;
  type: ReportType;
  generatedBy: string;
  filters: any;
  format: ReportFormat;
  fileUrl: string; // Holds reference, dataURI, or static endpoint route
  summary: {
    totalRecords: number;
    totalRevenue?: number;
    [key: string]: any;
  };
  createdAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
      index: true,
    },
    description: { type: String, trim: true },
    createdBy: { type: String, required: true },
    filters: {
      startDate: { type: String },
      endDate: { type: String },
      preset: { type: String },
      eventId: { type: String },
      workspaceId: { type: String },
      paymentStatus: { type: String },
      registrationStatus: { type: String },
    },
    format: {
      type: String,
      enum: Object.values(ReportFormat),
      default: ReportFormat.CSV,
      required: true,
    },
    scheduling: {
      enabled: { type: Boolean, default: false, index: true },
      frequency: { type: String, enum: Object.values(ScheduleFrequency) },
      emailRecipients: [{ type: String, trim: true }],
      nextRunAt: { type: Date, index: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const ReportHistorySchema = new Schema<IReportHistoryDocument>(
  {
    reportId: { type: String, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
      index: true,
    },
    generatedBy: { type: String, required: true },
    filters: { type: Schema.Types.Mixed },
    format: {
      type: String,
      enum: Object.values(ReportFormat),
      required: true,
    },
    fileUrl: { type: String, required: true },
    summary: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ReportSchema.index({ tenantId: 1, type: 1 });
ReportHistorySchema.index({ tenantId: 1, type: 1 });

export const Report = mongoose.model<IReportDocument>('Report', ReportSchema);
export const ReportHistory = mongoose.model<IReportHistoryDocument>('ReportHistory', ReportHistorySchema);
