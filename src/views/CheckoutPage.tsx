import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { paymentApi } from '../lib/paymentApi';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  DollarSign, 
  FileText, 
  ExternalLink,
  Cpu,
  Tag,
  Trash2,
  Building
} from 'lucide-react';
import { motion } from 'motion/react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract payment target context from location state
  const checkoutContext = location.state || {
    targetType: 'ORDER',
    targetId: 'WH-ORDER-MOCK-123',
    amount: 1500,
    currency: 'ETB',
    title: 'Executive Conference Room Pass',
    description: 'WeVentureHub All-day Premium Session',
  };

  const { targetType, targetId, amount, title, description } = checkoutContext;

  const [provider, setProvider] = useState<'ARIFPAY' | 'CHAPA' | 'STRIPE' | 'PAYPAL' | 'FLUTTERWAVE' | 'PAYSTACK' | 'TELEBIRR' | 'MANUAL'>('ARIFPAY');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Promo / Discount states
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [validatedPromo, setValidatedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Reactive price calculations (15% VAT, 2% service charge, promo discounts)
  const subtotal = Number(amount);
  const discount = validatedPromo 
    ? (validatedPromo.discountType === 'PERCENTAGE' 
        ? Number(((subtotal * validatedPromo.discountValue) / 100).toFixed(2)) 
        : Number(Math.min(validatedPromo.discountValue, subtotal).toFixed(2)))
    : 0;
  
  const netSubtotal = Math.max(0, subtotal - discount);
  const taxRate = 0.15; // 15% VAT
  const serviceFeeRate = 0.02; // 2% booking process fee
  const taxAmount = Number((netSubtotal * taxRate).toFixed(2));
  const serviceFee = Number((netSubtotal * serviceFeeRate).toFixed(2));
  const grandTotal = Number((netSubtotal + taxAmount + serviceFee).toFixed(2));

  // Initialize Payment Link mutation
  const initiatePaymentMutation = useMutation({
    mutationFn: () => paymentApi.createPayment({
      amount: subtotal, // sends the original subtotal; server recalculates based on promo code to enforce strict pricing rules!
      currency: ['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK'].includes(provider) ? 'USD' : 'ETB',
      provider,
      targetType,
      targetId,
      firstName,
      lastName,
      billingDetails: {
        name: `${firstName} ${lastName}`.trim() || 'Valued Hub Client',
        email: 'client@weventurehub.com',
        phone,
        company,
        address,
        taxId,
      },
      promoCode: validatedPromo ? validatedPromo.code : undefined,
    }),
    onSuccess: (data) => {
      setPaymentLink(data.paymentLink);
      setTxRef(data.payment.txRef);
      setErrorMessage(null);
      
      // Auto redirect to payment link if not on mock mode
      if (data.paymentLink && !data.paymentLink.includes('localhost') && !data.paymentLink.includes('127.0.0.1')) {
        window.open(data.paymentLink, '_blank');
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Payment link generation failed. Please verify configurations.');
    },
  });

  // Verify payment status mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: (reference: string) => paymentApi.verifyPayment(reference),
    onMutate: () => {
      setIsVerifying(true);
    },
    onSuccess: (data) => {
      setIsVerifying(false);
      if (data.status === 'SUCCESSFUL') {
        setVerificationSuccess(true);
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate(targetType === 'ORDER' ? '/dashboard/events' : '/dashboard/bookings');
        }, 3000);
      } else {
        setErrorMessage(`Payment is still ${data.status.toLowerCase()}. Please complete checkout first.`);
      }
    },
    onError: (err: any) => {
      setIsVerifying(false);
      setErrorMessage(err.message || 'Failed to verify transaction status.');
    },
  });

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    initiatePaymentMutation.mutate();
  };

  const handleVerifyNow = () => {
    if (txRef) {
      verifyPaymentMutation.mutate(txRef);
    }
  };

  const handleMockWebhookTrigger = async () => {
    if (!txRef) return;
    try {
      setIsVerifying(true);
      await verifyPaymentMutation.mutateAsync(txRef);
    } catch (e) {
      // errors handled by mutation
    }
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoError(null);
    try {
      const data = await paymentApi.validatePromoCode(promoCode, subtotal);
      setValidatedPromo(data.promo);
      setPromoError(null);
    } catch (err: any) {
      setPromoError(err.response?.data?.message || err.message || 'Invalid promo code');
      setValidatedPromo(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setValidatedPromo(null);
    setPromoError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-xl flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-gray-900">
            Secure Checkout Gateway
          </h1>
          <p className="text-xs text-neutral-slate-400 mt-0.5">Initialize multi-tenant payment protocols safely</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Forms */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section: Select Payment Method */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-base">1. Payment Provider</h2>
              <p className="text-xs text-neutral-slate-400">Select Chapa/Telebirr for local mobile banking or Stripe/PayPal for international cards.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ArifPay (Primary) */}
              <button
                type="button"
                onClick={() => setProvider('ARIFPAY')}
                className={`col-span-full p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'ARIFPAY'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary ring-2 ring-brand-primary/20'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <span>ArifPay Gateway</span>
                    <span className="text-[9px] bg-brand-primary text-white font-semibold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Primary</span>
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'ARIFPAY' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'ARIFPAY' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">
                  Supports Telebirr, Commercial Bank of Ethiopia (CBE), Awash Bank, Dashen Bank, Bank of Abyssinia, and others.
                </p>
              </button>

              {/* Chapa Pay */}
              <button
                type="button"
                onClick={() => setProvider('CHAPA')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'CHAPA'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Chapa Pay</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'CHAPA' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'CHAPA' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">Ethiopian Birr (ETB) CBE Birr, local wallets</p>
              </button>

              {/* Stripe */}
              <button
                type="button"
                onClick={() => setProvider('STRIPE')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'STRIPE'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Stripe</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'STRIPE' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'STRIPE' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">US Dollars (USD) Credit & Debit Cards</p>
              </button>

              {/* PayPal */}
              <button
                type="button"
                onClick={() => setProvider('PAYPAL')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'PAYPAL'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">PayPal</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'PAYPAL' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'PAYPAL' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">US Dollars (USD) Global Express checkout</p>
              </button>

              {/* Flutterwave */}
              <button
                type="button"
                onClick={() => setProvider('FLUTTERWAVE')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'FLUTTERWAVE'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Flutterwave</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'FLUTTERWAVE' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'FLUTTERWAVE' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">US Dollars (USD) West & East African portals</p>
              </button>

              {/* Paystack */}
              <button
                type="button"
                onClick={() => setProvider('PAYSTACK')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'PAYSTACK'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Paystack</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'PAYSTACK' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'PAYSTACK' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">US Dollars (USD) Modern card & direct bank nodes</p>
              </button>

              {/* Telebirr H5 */}
              <button
                type="button"
                onClick={() => setProvider('TELEBIRR')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'TELEBIRR'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <span>Telebirr</span>
                    <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-mono px-1 rounded-sm uppercase">H5 API</span>
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'TELEBIRR' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'TELEBIRR' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">Ethiopian Birr (ETB) Ethio Telecom digital node</p>
              </button>

              {/* Manual Bank Transfer */}
              <button
                type="button"
                onClick={() => setProvider('MANUAL')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  provider === 'MANUAL'
                    ? 'border-brand-primary bg-brand-primary/5 bg-brand-primary/10 font-semibold text-brand-primary'
                    : 'border-gray-200 hover:bg-neutral-slate-50 dark:hover:bg-neutral-slate-950'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <span>Manual Wire</span>
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${provider === 'MANUAL' ? 'border-brand-primary' : 'border-neutral-slate-400'}`}>
                    {provider === 'MANUAL' && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-slate-400 mt-1">Ethiopian Birr (ETB) Bank Deposit slip upload</p>
              </button>
            </div>
          </div>

          {/* Section: Billing Details */}
          {!paymentLink && (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handlePayNow}
              className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-5 shadow-xs"
            >
              <div className="space-y-1">
                <h2 className="font-display font-bold text-base">2. Billing Details</h2>
                <p className="text-xs text-neutral-slate-400">Required fields for proper compliance invoice generation</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Abel"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Bimrew"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+251-912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Input
                  label="Company Name"
                  placeholder="Enterprise Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Billing Address"
                  placeholder="Bole, Addis Ababa"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <Input
                  label="Tax Identification No (TIN)"
                  placeholder="0012345678"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </div>

              {errorMessage && (
                <div className="p-4 bg-rose-50 bg-rose-50/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm"
                isLoading={initiatePaymentMutation.isPending}
              >
                <CreditCard className="w-4 h-4" />
                <span>Initialize Gateway Link</span>
              </Button>
            </motion.form>
          )}

          {/* Section: Verify Checkout & Redirect Helper */}
          {paymentLink && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-brand-primary/30 rounded-3xl p-6 space-y-6 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary shrink-0">
                  <Sparkles className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base">Payment Gateway Active</h3>
                  <p className="text-[11px] text-neutral-slate-400">Checkout session initiated under ref: {txRef}</p>
                </div>
              </div>

              {paymentSuccess ? (
                <div className="p-4 bg-emerald-505/10 text-emerald-500 rounded-2xl border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-2 py-6">
                  <CheckCircle className="w-10 h-10 animate-bounce" />
                  <span className="font-bold text-sm">Payment Verified Successfully!</span>
                  <p className="text-xs text-neutral-slate-400">Provisioning digital entry passes. Redirecting you...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-slate-500">
                    Your secure payment window has been created. Click below to continue on the {provider} checkout terminal.
                  </p>

                  {provider === 'MANUAL' && (
                    <div className="p-4 bg-indigo-50 bg-indigo-50/20 border border-indigo-200/50 dark:border-indigo-900/40 rounded-2xl space-y-2">
                      <span className="text-[10px] uppercase font-mono font-extrabold text-indigo-500 tracking-wider flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        <span>Manual Bank Instructions</span>
                      </span>
                      <p className="text-[11px] leading-relaxed text-neutral-slate-500">
                        Please deposit <b>{grandTotal.toFixed(2)} ETB</b> to <b>Commercial Bank of Ethiopia (CBE)</b>, Account: <b>1000456123498 (WeVentureHub Digital)</b>. Once deposited, click the confirmation verification webhook helper below or provide the transaction reference to our staff.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-brand-primary text-white font-bold text-xs py-3 rounded-2xl text-center shadow-md hover:bg-brand-primary/90 flex items-center justify-center gap-1.5"
                    >
                      <span>Proceed to {provider} Terminal</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <Button
                      variant="secondary"
                      onClick={handleVerifyNow}
                      className="flex-1 text-xs py-3 rounded-2xl font-bold"
                      isLoading={isVerifying}
                    >
                      Check Payment Status
                    </Button>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Dev Sandbox Helper Widget */}
                  <div className="p-4.5 bg-[#F9FAFB] border border-dashed border-neutral-slate-300 border-gray-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-slate-400">
                      <Cpu className="w-4 h-4 text-brand-primary animate-pulse" />
                      <span className="font-bold uppercase tracking-wider">Developer Sandbox Helper</span>
                    </div>
                    <p className="text-[11px] text-neutral-slate-500">
                      Since you are in a preview/development sandbox with mock keys, click below to trigger a mock checkout confirmation webhook and bypass external gateways!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMockWebhookTrigger}
                      className="w-full text-[10px] font-mono border-brand-primary text-brand-primary hover:bg-brand-primary/10 rounded-xl"
                      isLoading={isVerifying}
                    >
                      🚀 Simulate Successful Webhook Confirmation
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>

        {/* Right Side: Order Summary & Coupon Engine */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Reservation Summary Card */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-display font-extrabold text-lg border-b pb-3 border-gray-200">
              Reservation Summary
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-slate-400 font-extrabold tracking-wider">Reservation Type</span>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-gray-900">
                    {targetType === 'ORDER' ? 'Event Ticket Purchase' : 'Workspace Booking Reservation'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-slate-400 font-extrabold tracking-wider">Resource Item</span>
                <span className="font-medium text-sm block text-gray-800">{title}</span>
                <p className="text-[11px] text-neutral-slate-400">{description}</p>
              </div>

              {/* Dynamic Cost breakdown */}
              <div className="space-y-2 border-t pt-4 border-dashed border-gray-200">
                <div className="flex justify-between items-center text-xs text-neutral-slate-400">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)} {['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK'].includes(provider) ? 'USD' : 'ETB'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-500 font-bold">
                    <span>Discount Applied ({validatedPromo.code})</span>
                    <span>-{discount.toFixed(2)} {['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK'].includes(provider) ? 'USD' : 'ETB'}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-neutral-slate-400">
                  <span>VAT Compliance Tax (15%)</span>
                  <span>{taxAmount.toFixed(2)} {['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK'].includes(provider) ? 'USD' : 'ETB'}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-neutral-slate-400">
                  <span>Service Surcharge (2%)</span>
                  <span>{serviceFee.toFixed(2)} {['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK'].includes(provider) ? 'USD' : 'ETB'}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2 border-t border-dashed border-neutral-slate-100 dark:border-neutral-slate-850 mt-1">
                  <span>Grand Total</span>
                  <span className="text-brand-primary font-extrabold text-base">{grandTotal.toFixed(2)} {['STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK'].includes(provider) ? 'USD' : 'ETB'}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#F9FAFB]/25 border border-neutral-slate-200/50 border-gray-200 rounded-2xl flex items-start gap-2 text-[11px] text-neutral-slate-400">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>Payments are encrypted end-to-end. WeVentureHub complies with PCI-DSS guidelines & CBE telebanking protocols.</span>
            </div>
          </div>

          {/* Section: Promo Code / Coupon Engine Panel */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-primary" />
              <h4 className="font-display font-bold text-sm">Promo Code / Discounts</h4>
            </div>

            {validatedPromo ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-950/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-emerald-600 block">CODE: {validatedPromo.code}</span>
                  <p className="text-[10px] text-neutral-slate-400">
                    {validatedPromo.discountType === 'PERCENTAGE' 
                      ? `${validatedPromo.discountValue}% Promo discount applied successfully!` 
                      : `${validatedPromo.discountValue} ETB Flat discount applied successfully!`}
                  </p>
                </div>
                <button 
                  onClick={handleRemovePromo}
                  className="p-1.5 hover:bg-neutral-slate-100 hover:bg-gray-150 text-rose-500 rounded-lg transition"
                  title="Remove coupon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. SUMMER20)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-brand-primary bg-white border-gray-200 uppercase"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleValidatePromo}
                    isLoading={isValidatingPromo}
                    className="text-xs font-bold px-3 py-2 rounded-xl shrink-0"
                  >
                    Apply Code
                  </Button>
                </div>
                {promoError && (
                  <p className="text-[10px] text-rose-500 font-semibold">{promoError}</p>
                )}
                <p className="text-[10px] text-neutral-slate-400">
                  Try entering <b>WELCOME10</b> or <b>SUMMER20</b> (ensure they are seeded inside the tenant workspace).
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
