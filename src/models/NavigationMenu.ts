import mongoose, { Schema, Document } from 'mongoose';

export interface INavigationItem {
  id?: string;
  label: string;
  path: string;
  icon?: string;
  isExternal?: boolean;
  sortOrder: number;
  isVisible: boolean;
  children?: { label: string; path: string; isVisible: boolean }[];
}

export interface INavigationMenuDocument extends Document {
  id: string;
  tenantId: string;
  menuLocation: 'header' | 'footer' | 'sidebar';
  items: INavigationItem[];
  createdAt: Date;
  updatedAt: Date;
}

const NavigationMenuSchema = new Schema<INavigationMenuDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    menuLocation: { type: String, enum: ['header', 'footer', 'sidebar'], required: true, index: true },
    items: [
      {
        label: { type: String, required: true },
        path: { type: String, required: true },
        icon: { type: String },
        isExternal: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
        isVisible: { type: Boolean, default: true },
        children: [
          {
            label: { type: String, required: true },
            path: { type: String, required: true },
            isVisible: { type: Boolean, default: true },
          }
        ]
      }
    ]
  },
  {
    timestamps: true,
    collection: 'navigation_menus',
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

export const NavigationMenu = mongoose.models.NavigationMenu || mongoose.model<INavigationMenuDocument>('NavigationMenu', NavigationMenuSchema);
