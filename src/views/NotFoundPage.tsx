import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl inline-block border border-rose-100">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl">404 - Area Restricted</h1>
        <p className="text-sm text-neutral-slate-400 max-w-md mx-auto">
          The requested system fragment is either restricted under your current tenant scope, or the URL address contains a typing error.
        </p>
      </div>

      <Link to="/">
        <Button variant="secondary" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to safety</span>
        </Button>
      </Link>
    </div>
  );
}
