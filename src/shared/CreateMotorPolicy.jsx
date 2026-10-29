import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import { Car, FileText, UserRound, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../utils/config";
import { Field, inputCls } from "../components/UI/PageKit";
import { FormSection, PolicyFormPage, ReadOnlyField, SummaryRow } from "./PolicyForm";
import { localToday, naira, shortDate } from "./policyFormat";
import PaymentModal from "../components/Payment/PaymentModal";

const CreateMotorPolicy = ({ userRole = "broker" }) => {
  const navigate = useNavigate();
  const [payCertNo, setPayCertNo] = useState(null);
  const certificatesListPath =
    userRole === "customer" ? "/client/certificates" : "/brokers/certificates";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(false);
  const [vehicleClasses, setVehicleClasses] = useState([]);
  const [loadingVehicleClasses, setLoadingVehicleClasses] = useState(false);

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      setLoadingVehicleTypes(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${getApiBaseUrl()}/Certificate/vehicle-types`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
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
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
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

  const getBrokerId = () => {
    try {
      const encryptedUser = localStorage.getItem("user");
      if (encryptedUser) {
        // Decrypt the user data using the secret key
        const bytes = CryptoJS.AES.decrypt(encryptedUser, "your-secret-key");
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return (
          decryptedData.userId ||
          decryptedData.id ||
          decryptedData.brokerId ||
          ""
        );
      }
    } catch (error) {
      console.error("Error getting broker ID:", error);
    }
    return "";
  };

  const [formData, setFormData] = useState({
    certNo: "",
    insuredName: "",
    email: "",
    address: "",
    mobileNo: "",
    transDate: localToday(),
    policyNo: "",
    vehicleRegNum: "",
    vehicleClass: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleColor: "",
    engineNum: "",
    chassisNum: "",
    vehicleBrand: "",
    vehicleYear: "",
    startDate: "",
    expiryDate: "",
    engineCapacity: "",
    insuredValue: "3000000",
    grossPremium: "15100",
    refDNCNNo: "",
    brokerId: getBrokerId(),
    rate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      // Convert chassis number: i→1, o→0 (case insensitive)
      const processedChassisNum = formData.chassisNum
        ? formData.chassisNum.replace(/i/gi, "1").replace(/o/gi, "0")
        : "";

      const requestBody = {
        certNo: formData.certNo,
        insuredName: formData.insuredName,
        email: formData.email,
        address: formData.address,
        mobileNo: formData.mobileNo,
        transDate: new Date(formData.transDate).toISOString(),
        policyNo: formData.policyNo,
        vehicleCategory: formData.vehicleClass,
        vehicleRegNum: formData.vehicleRegNum,
        vehicleType: formData.vehicleType,
        vehicleMake: formData.vehicleMake,
        vehicleColor: formData.vehicleColor,
        engineNum: formData.engineNum,
        chassisNum: processedChassisNum,
        vehicleBrand: formData.vehicleBrand,
        vehicleYear: formData.vehicleYear,
        startDate: new Date(formData.startDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        engineCapacity: formData.engineCapacity,
        insuredValue: parseFloat(formData.insuredValue) || 0,
        grossPremium: parseFloat(formData.grossPremium) || 0,
        refDNCNNo: formData.refDNCNNo,
        brokerId: formData.brokerId,
        rate: parseFloat(formData.rate) || 0,
      };

      const response = await axios.post(
        `${getApiBaseUrl()}/Certificate/motor`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        setMessage("Motor policy created successfully!");
        setIsError(false);

        // Certificate is saved; offer payment (card or wallet) before leaving.
        const createdCertNo =
          response.data?.certificateNo || response.data?.CertificateNo;
        if (createdCertNo) {
          setPayCertNo(createdCertNo);
        } else {
          setTimeout(() => {
            navigate(certificatesListPath, { state: { refresh: true } });
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error creating policy:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to create policy. Please try again.",
      );
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };
  const full = "sm:col-span-2 xl:col-span-3";

  return (
    <>
    {payCertNo && (
      <PaymentModal
        certNo={payCertNo}
        returnPath={certificatesListPath}
        onClose={() => navigate(certificatesListPath, { state: { refresh: true } })}
      />
    )}
    <PolicyFormPage
      title="New NIID motor policy"
      description="Fill in the insured and vehicle details to issue a third party motor certificate."
      onBack={handleGoBack}
      message={message}
      isError={isError}
      formId="create-motor-policy"
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Create motor policy"
      loadingLabel="Creating policy…"
      summary={
        <>
          <SummaryRow label="Insured" value={formData.insuredName} />
          <SummaryRow label="Vehicle" value={formData.vehicleRegNum} />
          <SummaryRow label="Cover starts" value={shortDate(formData.startDate)} />
          <SummaryRow label="Cover ends" value={shortDate(formData.expiryDate)} />
          <SummaryRow label="Insured value" value={naira(formData.insuredValue)} />
          <SummaryRow label="Premium" value={naira(formData.grossPremium)} strong />
        </>
      }
    >
      <FormSection icon={FileText} title="Certificate and policy" text="Numbers and dates the system fills in, and when cover starts.">
        <ReadOnlyField label="Certificate number" value={formData.certNo} hint="Given when you save" />
        <ReadOnlyField label="Policy number" value={formData.policyNo} hint="Given when you save" />
        <Field label="Reference DN/CN number">
          <input type="text" name="refDNCNNo" value={formData.refDNCNNo} onChange={handleChange} className={inputCls} />
        </Field>
        <ReadOnlyField label="Transaction date" value={shortDate(formData.transDate)} />
        <Field label="Start date" required>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={(e) => {
              const startDate = e.target.value;
              setFormData((prev) => {
                // Calculate expiry date (1 year from start date)
                let expiryDate = "";
                if (startDate) {
                  const start = new Date(startDate);
                  const expiry = new Date(start);
                  expiry.setFullYear(expiry.getFullYear() + 1);
                  expiryDate = expiry.toISOString().split("T")[0];
                }
                return {
                  ...prev,
                  startDate: startDate,
                  expiryDate: expiryDate,
                };
              });
            }}
            required
            className={inputCls}
          />
        </Field>
        <ReadOnlyField label="Expiry date" value={shortDate(formData.expiryDate)} hint="One year from the start date" />
        <ReadOnlyField label="Super agent ID" value={formData.brokerId} />
      </FormSection>

      <FormSection icon={UserRound} title="Insured" text="The person or business the policy covers.">
        <Field label="Insured name" required>
          <input type="text" name="insuredName" value={formData.insuredName} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Email" required>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Mobile number" required>
          <input type="number" name="mobileNo" value={formData.mobileNo} onChange={handleChange} required className={inputCls} />
        </Field>
        <div className={full}>
          <Field label="Address" required>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputCls} />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={Car} title="Vehicle" text="As shown on the vehicle papers.">
        <Field label="Registration number" required>
          <input type="text" name="vehicleRegNum" value={formData.vehicleRegNum} onChange={handleChange} required className={`${inputCls}`} />
        </Field>
        <Field label="Vehicle class" required>
          <select name="vehicleClass" value={formData.vehicleClass} onChange={handleChange} disabled={loadingVehicleClasses} required className={inputCls}>
            {loadingVehicleClasses ? <option value="">Loading…</option> : vehicleClasses.length > 0 ? <option value="">Select a vehicle class</option> : null}
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
          <input type="text" name="vehicleMake" value={formData.vehicleMake} onChange={handleChange} required placeholder="e.g. Toyota" className={inputCls} />
        </Field>
        <Field label="Brand / model" required>
          <input type="text" name="vehicleBrand" value={formData.vehicleBrand} onChange={handleChange} required placeholder="e.g. Corolla" className={inputCls} />
        </Field>
        <Field label="Colour" required>
          <input type="text" name="vehicleColor" value={formData.vehicleColor} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Year" required>
          <input type="text" name="vehicleYear" value={formData.vehicleYear} onChange={handleChange} required placeholder="e.g. 2019" inputMode="numeric" className={inputCls} />
        </Field>
        <Field label="Chassis number" required>
          <input type="text" name="chassisNum" value={formData.chassisNum} onChange={handleChange} required className={`${inputCls} font-mono`} />
          <span className="mt-1 block text-xs text-slate-500">The letters I and O are saved as 1 and 0.</span>
        </Field>
        <Field label="Engine number" required>
          <input type="text" name="engineNum" value={formData.engineNum} onChange={handleChange} required className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Engine capacity" required>
          <input type="text" name="engineCapacity" value={formData.engineCapacity} onChange={handleChange} required placeholder="e.g. 1800cc" className={inputCls} />
        </Field>
      </FormSection>

      {/* On large screens these sit in the summary instead. */}
      <div className="lg:hidden">
        <FormSection icon={Wallet} title="Premium" text="Set for this cover; you cannot change it here.">
          <ReadOnlyField label="Insured value" value={naira(formData.insuredValue)} />
          <ReadOnlyField label="Gross premium" value={naira(formData.grossPremium)} />
          <ReadOnlyField label="Rate" value={formData.rate ? `${formData.rate}%` : null} hint="Not set" />
        </FormSection>
      </div>
    </PolicyFormPage>
    </>
  );
};

export default CreateMotorPolicy;
