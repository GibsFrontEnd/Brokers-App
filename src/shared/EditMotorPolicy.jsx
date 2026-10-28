import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Car, FileText, UserRound, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../utils/config";
import { Field, LoadingState, StatusPill, inputCls } from "../components/UI/PageKit";
import { FormSection, PolicyFormPage, ReadOnlyField, SummaryRow } from "./PolicyForm";
import { naira, shortDate } from "./policyFormat";

const EditMotorPolicy = ({ userRole = "broker" }) => {
  const navigate = useNavigate();
  const { certNo } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(false);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [loadingVehicleClasses, setLoadingVehicleClasses] = useState(false);

  const [formData, setFormData] = useState({
    insuredName: "",
    address: "",
    vehicleMake: "",
    vehicleBrand: "",
    startDate: "",
    vehicleType: "",
    vehicleCategory: "",
    mobileNo: "",
    email: "",
    vehicleColor: "",
    engineNum: "",
    chassisNum: "",
    vehicleYear: "",
    rate: "",
    insuredValue: "",
    grossPremium: "",
    expiryDate: "",
    vehicleRegNum: "",
    transDate: "",
    refDNCNNo: "",
    engineCapacity: "",
  });

  // Convert ISO date string to YYYY-MM-DD for <input type="date">
  const toDateInput = (isoStr) => {
    if (!isoStr) return "";
    try {
      return new Date(isoStr).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // Fetch existing certificate data
  useEffect(() => {
    const fetchCertificate = async () => {
      setFetchLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Certificate/motor/${certNo}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data;
        setFormData({
          insuredName: data.insuredName || "",
          address: data.address || "",
          vehicleMake: data.vehicleMake || "",
          vehicleBrand: data.vehicleBrand || "",
          startDate: toDateInput(data.startDate),
          vehicleType: data.vehicleType || "",
          vehicleCategory: data.vehicleCategory || data.vehicleClass || "",
          mobileNo: data.mobileNo || "",
          email: data.email || "",
          vehicleColor: data.vehicleColor || "",
          engineNum: data.engineNum || "",
          chassisNum: data.chassisNum || "",
          vehicleYear: data.vehicleYear || "",
          rate: data.rate ?? "",
          insuredValue: data.insuredValue ?? "",
          grossPremium: data.grossPremium ?? "",
          expiryDate: toDateInput(data.expiryDate),
          vehicleRegNum: data.vehicleRegNum || "",
          transDate: toDateInput(data.transDate),
          refDNCNNo: data.refDNCNNo || "",
          engineCapacity: data.engineCapacity || "",
        });
      } catch (err) {
        console.error("Fetch certificate error:", err);
        setMessage(
          err.response?.data?.message || "Failed to load certificate data."
        );
        setIsError(true);
      } finally {
        setFetchLoading(false);
      }
    };

    if (certNo) fetchCertificate();
  }, [certNo]);

  // Fetch vehicle types & classes
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      setLoadingVehicleTypes(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Certificate/vehicle-types`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVehicleTypes(response.data);
      } catch (error) {
        console.error("Error fetching vehicle types:", error);
      } finally {
        setLoadingVehicleTypes(false);
      }
    };

    const fetchVehicleClasses = async () => {
      setLoadingVehicleClasses(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Certificate/vehicle-class`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVehicleClasses(response.data);
      } catch (error) {
        console.error("Error fetching vehicle classes:", error);
      } finally {
        setLoadingVehicleClasses(false);
      }
    };

    fetchVehicleTypes();
    fetchVehicleClasses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    let expiryDate = "";
    if (startDate) {
      const start = new Date(startDate);
      const expiry = new Date(start);
      expiry.setFullYear(expiry.getFullYear() + 1);
      expiryDate = expiry.toISOString().split("T")[0];
    }
    setFormData((prev) => ({ ...prev, startDate, expiryDate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      // Convert chassis: i->1, o->0
      const processedChassisNum = formData.chassisNum
        ? formData.chassisNum.replace(/i/gi, "1").replace(/o/gi, "0")
        : "";

      const requestBody = {
        insuredName: formData.insuredName,
        address: formData.address,
        vehicleMake: formData.vehicleMake,
        vehicleBrand: formData.vehicleBrand,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        vehicleType: formData.vehicleType,
        vehicleCategory: formData.vehicleCategory,
        mobileNo: formData.mobileNo,
        email: formData.email,
        vehicleColor: formData.vehicleColor,
        engineNum: formData.engineNum,
        chassisNum: processedChassisNum,
        vehicleYear: formData.vehicleYear,
        rate: parseFloat(formData.rate) || 0,
        insuredValue: parseFloat(formData.insuredValue) || 0,
        grossPremium: parseFloat(formData.grossPremium) || 0,
        expiryDate: formData.expiryDate
          ? new Date(formData.expiryDate).toISOString()
          : null,
        vehicleRegNum: formData.vehicleRegNum,
        transDate: formData.transDate
          ? new Date(formData.transDate).toISOString()
          : null,
        refDNCNNo: formData.refDNCNNo,
        engineCapacity: formData.engineCapacity,
      };

      await axios.put(
        `${getApiBaseUrl()}/Certificate/motor/${certNo}`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage("Certificate updated successfully!");
      setIsError(false);

      setTimeout(() => {
        const redirectPath =
          userRole === "customer"
            ? "/client/certificates"
            : "/brokers/certificates/niid";
        navigate(redirectPath, { state: { refresh: true } });
      }, 500);
    } catch (error) {
      console.error("Error updating certificate:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to update certificate. Please try again."
      );
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => navigate(-1);
  if (fetchLoading) {
    return <LoadingState label="Loading the certificate…" />;
  }

  const full = "sm:col-span-2 xl:col-span-3";

  return (
    <PolicyFormPage
      title="Edit motor certificate"
      description={
        <span className="inline-flex flex-wrap items-center gap-2">
          <span className="font-mono font-semibold text-slate-800">{certNo}</span>
          <StatusPill tone="amber">Pending</StatusPill>
          <span>Only pending certificates can be changed.</span>
        </span>
      }
      onBack={handleGoBack}
      message={message}
      isError={isError}
      formId="edit-motor-policy"
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Save changes"
      summary={
        <>
          <SummaryRow label="Certificate" value={certNo} />
          <SummaryRow label="Insured" value={formData.insuredName} />
          <SummaryRow label="Vehicle" value={formData.vehicleRegNum} />
          <SummaryRow label="Cover starts" value={shortDate(formData.startDate)} />
          <SummaryRow label="Cover ends" value={shortDate(formData.expiryDate)} />
          <SummaryRow label="Insured value" value={naira(formData.insuredValue)} />
          <SummaryRow label="Premium" value={naira(formData.grossPremium)} strong />
        </>
      }
    >
      <FormSection icon={FileText} title="Policy and dates">
        <Field label="Reference DN/CN number">
          <input type="text" name="refDNCNNo" value={formData.refDNCNNo} onChange={handleChange} className={inputCls} />
        </Field>
        <Field label="Transaction date">
          <input type="date" name="transDate" value={formData.transDate} onChange={handleChange} className={inputCls} />
        </Field>
        <Field label="Start date" required>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleStartDateChange} required className={inputCls} />
        </Field>
        <Field label="Expiry date" required>
          <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required className={inputCls} />
          <span className="mt-1 block text-xs text-slate-500">Changing the start date sets this to one year later.</span>
        </Field>
      </FormSection>

      <FormSection icon={UserRound} title="Insured">
        <Field label="Insured name" required>
          <input type="text" name="insuredName" value={formData.insuredName} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Email" required>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Mobile number" required>
          <input type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} required className={inputCls} />
        </Field>
        <div className={full}>
          <Field label="Address" required>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputCls} />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={Car} title="Vehicle">
        <Field label="Registration number" required>
          <input type="text" name="vehicleRegNum" value={formData.vehicleRegNum} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Vehicle class" required>
          <select name="vehicleCategory" value={formData.vehicleCategory} onChange={handleChange} disabled={loadingVehicleClasses} required className={inputCls}>
            {loadingVehicleClasses ? <option value="">Loading…</option> : <option value="">Select a vehicle class</option>}
            {vehicleClasses.map((vClass, index) => (
              <option key={index} value={vClass.value}>
                {vClass.text}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle type" required>
          <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} disabled={loadingVehicleTypes} required className={inputCls}>
            {loadingVehicleTypes ? (
              <option value="">Loading…</option>
            ) : vehicleTypes.length > 0 ? (
              vehicleTypes.map((type, index) => (
                <option key={index} value={type.value === "NULL" ? "" : type.value}>
                  {type.text}
                </option>
              ))
            ) : (
              <option value="">Select a vehicle type</option>
            )}
          </select>
        </Field>
        <Field label="Make" required>
          <input type="text" name="vehicleMake" value={formData.vehicleMake} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Brand / model" required>
          <input type="text" name="vehicleBrand" value={formData.vehicleBrand} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Colour" required>
          <input type="text" name="vehicleColor" value={formData.vehicleColor} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Year" required>
          <input type="text" name="vehicleYear" value={formData.vehicleYear} onChange={handleChange} required inputMode="numeric" className={inputCls} />
        </Field>
        <Field label="Chassis number" required>
          <input type="text" name="chassisNum" value={formData.chassisNum} onChange={handleChange} required className={`${inputCls} font-mono`} />
          <span className="mt-1 block text-xs text-slate-500">The letters I and O are saved as 1 and 0.</span>
        </Field>
        <Field label="Engine number" required>
          <input type="text" name="engineNum" value={formData.engineNum} onChange={handleChange} required className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Engine capacity" required>
          <input type="text" name="engineCapacity" value={formData.engineCapacity} onChange={handleChange} required className={inputCls} />
        </Field>
      </FormSection>

      {/* On large screens these sit in the summary instead. */}
      <div className="lg:hidden">
        <FormSection icon={Wallet} title="Premium" text="Set for this cover; you cannot change it here.">
          <ReadOnlyField label="Insured value" value={naira(formData.insuredValue)} />
          <ReadOnlyField label="Gross premium" value={naira(formData.grossPremium)} />
          <ReadOnlyField label="Rate" value={formData.rate !== "" ? `${formData.rate}%` : null} hint="Not set" />
        </FormSection>
      </div>
    </PolicyFormPage>
  );
};

export default EditMotorPolicy;
