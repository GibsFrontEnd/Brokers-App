import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, CreditCard, FileText, Loader2, Paperclip, Save, Send, StickyNote, UserRound } from "lucide-react";
import { Field, Notice, btnPrimary, btnSecondary, inputCls } from "../../components/UI/PageKit";
import { FormSection, SummaryRow } from "../../shared/PolicyForm";


export default function AddProposal() {
  const navigate = useNavigate();
  const location = useLocation();
  // The proposal pages live under /admin/client (admin) and /client (sub agents).
  const basePrefix = location.pathname.startsWith("/admin") ? "/admin/client" : "/client";
  const [insuredType, setInsuredType] = useState("Individual");
  const [formData, setFormData] = useState({
    // Common fields
    address: "",
    email: "",
    phoneMobile: "",
    phoneNumber: "",
    transactionDate: "",
    classOfBusiness: "",
    startDate: "",
    endDate: "",
    locationId: "",
    premiumDue: "24000.00",
    notePayment: "",

    // Individual fields
    lastname: "",
    firstname: "",
    occupation: "",

    // Corporate fields
    companyName: "",
    registrationNumber: "",
    industry: "",
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error] = useState(null);
  const [scannedDocs, setScannedDocs] = useState({
    doc1: null,
    doc2: null,
    doc3: null,
    doc4: null,
  });
  const [showPaymentSection] = useState(true);
  const [paymentAmount] = useState("24,000.00");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, docName) => {
    setScannedDocs((prev) => ({ ...prev, [docName]: e.target.files[0] }));
  };

  const handleMakePayment = () => {
    navigate(`${basePrefix}/make-payment`, {
      state: { amount: paymentAmount },
    });
  };

  /* 
  BACKEND IMPLEMENTATION: Save as Draft
  const handleSaveProposal = async () => {
    try {
      setSaveLoading(true);
      const formDataToSend = new FormData();
      
      // Append all form data
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      }
      
      // Append scanned documents
      for (const key in scannedDocs) {
        if (scannedDocs[key]) {
          formDataToSend.append('documents', scannedDocs[key]);
        }
      }
      
      formDataToSend.append('status', 'draft');
      formDataToSend.append('insuredType', insuredType);

      const response = await axios.post('/api/proposals/save-draft', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        console.log('Draft saved successfully');
        navigate('/client-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft proposal');
      console.error('Error saving draft:', err);
    } finally {
      setSaveLoading(false);
    }
  };
  */

  // Mock save handler for frontend testing
  const handleSaveProposal = () => {
    setSaveLoading(true);
    setTimeout(() => {
      console.log("Proposal saved as draft (mock)", formData);
      setSaveLoading(false);
      navigate(`${basePrefix}/business-proposals`);
    }, 1000);
  };

  /* 
  BACKEND IMPLEMENTATION: Submit Proposal
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      // Append all form data
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      }
      
      // Append scanned documents
      for (const key in scannedDocs) {
        if (scannedDocs[key]) {
          formDataToSend.append('documents', scannedDocs[key]);
        }
      }
      
      formDataToSend.append('status', 'submitted');
      formDataToSend.append('insuredType', insuredType);

      const response = await axios.post('/api/proposals', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        navigate('/client-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Proposal submission failed');
      console.error('Error submitting proposal:', err);
    } finally {
      setLoading(false);
    }
  };
  */

  // Mock submit handler for frontend testing
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      console.log("Proposal submitted (mock)", { ...formData, scannedDocs });
      setLoading(false);
      navigate(`${basePrefix}/business-proposals`);
    }, 1500);
  };

  const individual = insuredType === "Individual";
  const insuredLabel = individual ? [formData.firstname, formData.lastname].filter(Boolean).join(" ") : formData.companyName;
  const attached = Object.values(scannedDocs).filter(Boolean).length;
  const full = "sm:col-span-2 xl:col-span-3";

  const actions = (stack) => (
    <div className={`flex gap-2 ${stack ? "flex-col" : "flex-wrap justify-end"}`}>
      <button type="submit" form="add-proposal-form" disabled={loading} className={`${btnPrimary} ${stack ? "w-full" : ""}`}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Submitting…" : "Submit proposal"}
      </button>
      <button type="button" onClick={handleSaveProposal} disabled={saveLoading} className={`${btnSecondary} ${stack ? "w-full" : ""}`}>
        {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saveLoading ? "Saving…" : "Save draft"}
      </button>
      {showPaymentSection && (
        <button type="button" onClick={handleMakePayment} className={`${btnSecondary} ${stack ? "w-full" : ""}`}>
          <CreditCard className="h-4 w-4" />
          Make payment
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div>
        <Link to={`${basePrefix}/business-proposals`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to proposals
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">New proposal</h1>
        <p className="mt-1 text-slate-600">Fill in the insured and the cover they want, attach their documents, then submit.</p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form id="add-proposal-form" onSubmit={handleSubmit} className="min-w-0 space-y-6">
          <FormSection icon={individual ? UserRound : Building2} title="Insured" text="A person or a company.">
            <div className={full}>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Insured type</span>
              <div role="radiogroup" aria-label="Insured type" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {["Individual", "Corporate"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={insuredType === t}
                    onClick={() => setInsuredType(t)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-medium transition ${
                      insuredType === t ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t === "Individual" ? <UserRound className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {individual ? (
              <>
                <Field label="First name" required>
                  <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} placeholder="First name" required className={inputCls} />
                </Field>
                <Field label="Last name" required>
                  <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Last name" required className={inputCls} />
                </Field>
                <Field label="Occupation" required>
                  <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Occupation" required className={inputCls} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Company name" required>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company name" required className={inputCls} />
                </Field>
                <Field label="Registration number" required>
                  <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="RC number" required className={inputCls} />
                </Field>
                <Field label="Industry" required>
                  <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="Industry" required className={inputCls} />
                </Field>
              </>
            )}

            <Field label="Email" required>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" required className={inputCls} />
            </Field>
            <Field label="Mobile phone" required>
              <input type="tel" name="phoneMobile" value={formData.phoneMobile} onChange={handleChange} placeholder="Mobile phone" required className={inputCls} />
            </Field>
            <Field label="Other phone" required>
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone number" required className={inputCls} />
            </Field>
            <div className={full}>
              <Field label="Address" required>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} placeholder="Full address" required className={`${inputCls} h-auto py-2`} />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={FileText} title="Proposal" text="The cover being proposed.">
            <Field label="Class of business" required>
              <select name="classOfBusiness" value={formData.classOfBusiness} onChange={handleChange} required className={inputCls}>
                <option value="">Select a class</option>
                <option value="General Insurance">General insurance</option>
                <option value="Life Insurance">Life insurance</option>
                <option value="Health Insurance">Health insurance</option>
              </select>
            </Field>
            <Field label="Transaction date" required>
              <input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleChange} required className={inputCls} />
            </Field>
            <Field label="Location ID" required>
              <input type="text" name="locationId" value={formData.locationId} onChange={handleChange} placeholder="Location ID" required className={inputCls} />
            </Field>
            <Field label="Start date" required>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className={inputCls} />
            </Field>
            <Field label="End date" required>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required min={formData.startDate || undefined} className={inputCls} />
            </Field>
          </FormSection>

          <FormSection icon={Paperclip} title="Documents" text="Scans of the insured's documents: PDF, image or Word." columns={2}>
            {["doc1", "doc2", "doc3", "doc4"].map((doc, index) => (
              <label
                key={doc}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition ${
                  scannedDocs[doc] ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300 hover:border-[#155dfd] hover:bg-blue-50/40"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${scannedDocs[doc] ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {scannedDocs[doc] ? <CheckCircle2 className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-800">Document {index + 1}</span>
                  <span className="block truncate text-xs text-slate-500">{scannedDocs[doc] ? scannedDocs[doc].name : "Choose a file"}</span>
                </span>
                <input type="file" onChange={(e) => handleFileChange(e, doc)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="sr-only" />
              </label>
            ))}
          </FormSection>

          <FormSection icon={StickyNote} title="Payment note" columns={2}>
            <div className="sm:col-span-2">
              <Field label="Notes about the payment">
                <textarea
                  name="notePayment"
                  value={formData.notePayment}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Anything the payment team should know"
                  className={`${inputCls} h-auto py-2`}
                />
              </Field>
            </div>
          </FormSection>
        </form>

        {/* Summary and actions */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
            <dl className="mt-2 divide-y divide-slate-100">
              <SummaryRow label="Insured" value={insuredLabel} />
              <SummaryRow label="Type" value={insuredType} />
              <SummaryRow label="Class" value={formData.classOfBusiness} />
              <SummaryRow label="Documents" value={`${attached} of 4`} />
              <SummaryRow label="Premium due" value={`₦${formData.premiumDue}`} strong />
            </dl>
            <div className="mt-5">{actions(true)}</div>
          </div>
        </aside>
      </div>

      {/* Actions stay in reach on phones and tablets */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">
            <span className="block text-xs text-slate-500">Premium due</span>
            <span className="font-bold text-slate-900">₦{formData.premiumDue}</span>
          </span>
          {actions(false)}
        </div>
      </div>
    </div>
  );
}
