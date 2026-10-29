import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import { Car, FileText, MapPin, UserRound, Wallet } from "lucide-react";
import { getApiBaseUrl } from "../utils/config";
import { Field, inputCls } from "../components/UI/PageKit";
import { FormSection, PolicyFormPage, ReadOnlyField, SummaryRow } from "./PolicyForm";
import { localToday, naira, shortDate } from "./policyFormat";
import PaymentModal from "../components/Payment/PaymentModal";

// A select that shows "Loading…" or a hint until its options are ready.
const LookupSelect = ({ loading, placeholder, waitingFor, options, ...props }) => (
  <select {...props} disabled={loading || Boolean(waitingFor) || props.disabled} className={inputCls}>
    <option value="">{loading ? "Loading…" : waitingFor || placeholder}</option>
    {options.map((o) => (
      <option key={o.code} value={o.code}>
        {o.name}
      </option>
    ))}
  </select>
);

const CreateNiipMotorPolicy = ({ userRole = "broker" }) => {
  const navigate = useNavigate();
  const [payCertNo, setPayCertNo] = useState(null);
  const certificatesListPath =
    userRole === "customer" ? "/client/certificates" : "/brokers/certificates/niip";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // NIIP reference data
  const [states, setStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [lgas, setLgas] = useState([]);
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [colors, setColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [makes, setMakes] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [capacities, setCapacities] = useState([]);
  const [loadingCapacities, setLoadingCapacities] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(false);

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
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    nin: "",
    address: "",
    mobileNo: "",
    transDate: localToday(),
    // Vehicle information (NIIP)
    purpose: "", // holds the purpose value
    bizOption: "", // holds the business option
    state: "", // holds the state code
    lgArea: "", // holds the LGA code
    vehicleRegNum: "",
    chassisNum: "",
    engineNum: "",
    vehicleColor: "", // holds the color code
    vehicleMake: "", // holds the make code
    vehicleModel: "", // holds the model code
    engineCapacity: "", // holds the capacity code
    vehicleType: "",
    manufacturingYear: "",
    startDate: "",
    expiryDate: "",
    premium: "",
    coverTypeId: "",
    brokerId: getBrokerId(),
  });

  // Cover type options (id → label)
  const coverTypeOptions = [
    { value: "1", label: "Third-Party" },
    { value: "2", label: "TP Fire&Theft" },
    { value: "3", label: "Comprehensive" },
    { value: "4", label: "TP Trucks" },
  ];

  // Insured name is derived from the first, middle and last name fields
  const insuredName = [
    formData.firstName,
    formData.middleName,
    formData.lastName,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  // Purpose options (value → label)
  const purposeOptions = [
    { value: "3", label: "Private Motor" },
    { value: "4", label: "Motorcycle (Power Bike/Official Ride)" },
    { value: "5", label: "Special Types (Ambulance/Hearses)" },
    { value: "6", label: "Motor Trade (Road/Premises Risks)" },
    { value: "7", label: "Tricycle (Keke Napep)" },
    { value: "8", label: "Commercial (Own Good/ Staff Bus)" },
    { value: "9", label: "Commercial (Trucks/General Cartage)" },
  ];

  // Business options
  const bizOptions = ["NEW", "RENEWAL", "ADDITIONAL"];

  // Fetch reference data that does not depend on another selection
  useEffect(() => {
    const base = getApiBaseUrl();
    const token = localStorage.getItem("token");
    const authConfig = { headers: { Authorization: `Bearer ${token}` } };

    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const res = await axios.get(`${base}/niip-motor/states`, authConfig);
        setStates(res.data || []);
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setLoadingStates(false);
      }
    };

    const fetchColors = async () => {
      setLoadingColors(true);
      try {
        const res = await axios.get(`${base}/niip-motor/colors`, authConfig);
        setColors(res.data || []);
      } catch (error) {
        console.error("Error fetching colors:", error);
      } finally {
        setLoadingColors(false);
      }
    };

    const fetchMakes = async () => {
      setLoadingMakes(true);
      try {
        const res = await axios.get(`${base}/niip-motor/makes`, authConfig);
        setMakes(res.data || []);
      } catch (error) {
        console.error("Error fetching makes:", error);
      } finally {
        setLoadingMakes(false);
      }
    };

    const fetchCapacities = async () => {
      setLoadingCapacities(true);
      try {
        const res = await axios.get(
          `${base}/niip-motor/capacities`,
          authConfig,
        );
        setCapacities(res.data || []);
      } catch (error) {
        console.error("Error fetching capacities:", error);
      } finally {
        setLoadingCapacities(false);
      }
    };

    const fetchVehicleTypes = async () => {
      setLoadingVehicleTypes(true);
      try {
        const res = await axios.get(
          `${base}/Certificate/vehicle-types`,
          authConfig,
        );
        setVehicleTypes(res.data || []);
      } catch (error) {
        console.error("Error fetching vehicle types:", error);
      } finally {
        setLoadingVehicleTypes(false);
      }
    };

    fetchStates();
    fetchColors();
    fetchMakes();
    fetchCapacities();
    fetchVehicleTypes();
  }, []);

  // Fetch LGAs whenever the selected state changes
  useEffect(() => {
    if (!formData.state) {
      setLgas([]);
      return;
    }

    const fetchLgas = async () => {
      setLoadingLgas(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${getApiBaseUrl()}/niip-motor/states/${formData.state}/lgas`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setLgas(res.data || []);
      } catch (error) {
        console.error("Error fetching LGAs:", error);
      } finally {
        setLoadingLgas(false);
      }
    };

    fetchLgas();
  }, [formData.state]);

  // Fetch models whenever the selected make changes
  useEffect(() => {
    if (!formData.vehicleMake) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${getApiBaseUrl()}/niip-motor/makes/${formData.vehicleMake}/models`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setModels(res.data || []);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [formData.vehicleMake]);

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

      // Helper to turn a code/string into a number (0 when empty/invalid)
      const toNumber = (value) => {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      const requestBody = {
        insuredName: insuredName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        mobileNo: formData.mobileNo,
        email: formData.email,
        nin: formData.nin,
        address: formData.address,
        transDate: new Date(formData.transDate).toISOString(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.expiryDate).toISOString(),
        purpose: toNumber(formData.purpose),
        state: toNumber(formData.state),
        lga: toNumber(formData.lgArea),
        vehicleColor: toNumber(formData.vehicleColor),
        vehicleMake: toNumber(formData.vehicleMake),
        vehicleModel: toNumber(formData.vehicleModel),
        engineCap: toNumber(formData.engineCapacity),
        regNo: formData.vehicleRegNum,
        chassisNo: processedChassisNum,
        engineNo: formData.engineNum,
        vehicleType: formData.vehicleType,
        manufactureYear: toNumber(formData.manufacturingYear),
        premium: parseFloat(formData.premium) || 0,
        bizOption: formData.bizOption,
        coverTypeId: toNumber(formData.coverTypeId),
      };

      const response = await axios.post(
        `${getApiBaseUrl()}/niip-motor`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 200 || response.status === 201) {
        setMessage("NIIP motor policy created successfully!");
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
  const coverLabel = coverTypeOptions.find((o) => o.value === formData.coverTypeId)?.label;

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
      title="New NIIP motor policy"
      description="Fill in the insured, vehicle and cover details to issue a NIIP motor certificate."
      onBack={handleGoBack}
      message={message}
      isError={isError}
      formId="create-niip-motor-policy"
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Create NIIP policy"
      loadingLabel="Creating policy…"
      summary={
        <>
          <SummaryRow label="Insured" value={insuredName} />
          <SummaryRow label="Vehicle" value={formData.vehicleRegNum} />
          <SummaryRow label="Cover" value={coverLabel} />
          <SummaryRow label="Business" value={formData.bizOption} />
          <SummaryRow label="Cover starts" value={shortDate(formData.startDate)} />
          <SummaryRow label="Cover ends" value={shortDate(formData.expiryDate)} />
          <SummaryRow label="Premium" value={naira(formData.premium)} strong />
        </>
      }
    >
      <FormSection icon={FileText} title="Policy dates" text="When the cover starts; it runs for one year.">
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

      <FormSection icon={UserRound} title="Insured" text="The insured name is made from the first, middle and last names.">
        <Field label="First name" required>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Middle name">
          <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className={inputCls} />
        </Field>
        <Field label="Last name" required>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputCls} />
        </Field>
        <ReadOnlyField label="Insured name" value={insuredName} hint="Made from the names above" />
        <Field label="Email" required>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Mobile number" required>
          <input type="number" name="mobileNo" value={formData.mobileNo} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="NIN" required>
          <input type="text" name="nin" value={formData.nin} onChange={handleChange} required inputMode="numeric" className={`${inputCls} font-mono`} />
        </Field>
        <div className={full}>
          <Field label="Address" required>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required className={inputCls} />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={MapPin} title="Location" text="Where the vehicle is registered." columns={2}>
        <Field label="State" required>
          <LookupSelect
            name="state"
            value={formData.state}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                state: e.target.value,
                lgArea: "",
              }))
            }
            required
            loading={loadingStates}
            placeholder="Select a state"
            options={states}
          />
        </Field>
        <Field label="Local government area" required>
          <LookupSelect
            name="lgArea"
            value={formData.lgArea}
            onChange={handleChange}
            required
            loading={loadingLgas}
            waitingFor={!formData.state ? "Select a state first" : null}
            placeholder="Select an LGA"
            options={lgas}
          />
        </Field>
      </FormSection>

      <FormSection icon={Car} title="Vehicle" text="As shown on the vehicle papers.">
        <Field label="Registration number" required>
          <input type="text" name="vehicleRegNum" value={formData.vehicleRegNum} onChange={handleChange} required className={inputCls} />
        </Field>
        <Field label="Chassis number" required>
          <input type="text" name="chassisNum" value={formData.chassisNum} onChange={handleChange} required className={`${inputCls} font-mono`} />
          <span className="mt-1 block text-xs text-slate-500">The letters I and O are saved as 1 and 0.</span>
        </Field>
        <Field label="Engine number" required>
          <input type="text" name="engineNum" value={formData.engineNum} onChange={handleChange} required className={`${inputCls} font-mono`} />
        </Field>
        <Field label="Make" required>
          <LookupSelect
            name="vehicleMake"
            value={formData.vehicleMake}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                vehicleMake: e.target.value,
                vehicleModel: "",
              }))
            }
            required
            loading={loadingMakes}
            placeholder="Select a make"
            options={makes}
          />
        </Field>
        <Field label="Model" required>
          <LookupSelect
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={handleChange}
            required
            loading={loadingModels}
            waitingFor={!formData.vehicleMake ? "Select a make first" : null}
            placeholder="Select a model"
            options={models}
          />
        </Field>
        <Field label="Colour" required>
          <LookupSelect name="vehicleColor" value={formData.vehicleColor} onChange={handleChange} required loading={loadingColors} placeholder="Select a colour" options={colors} />
        </Field>
        <Field label="Engine capacity" required>
          <LookupSelect
            name="engineCapacity"
            value={formData.engineCapacity}
            onChange={handleChange}
            required
            loading={loadingCapacities}
            placeholder="Select a capacity"
            options={capacities}
          />
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
        <Field label="Year of manufacture" required>
          <input type="number" name="manufacturingYear" value={formData.manufacturingYear} onChange={handleChange} min="1900" max="2100" placeholder="e.g. 2020" required className={inputCls} />
        </Field>
        <div className={full}>
          <Field label="Purpose" required>
            <select name="purpose" value={formData.purpose} onChange={handleChange} required className={inputCls}>
              <option value="">Select a purpose</option>
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection icon={Wallet} title="Premium and cover">
        <Field label="Premium (₦)" required>
          <input type="number" name="premium" value={formData.premium} onChange={handleChange} required step="0.01" min="0" placeholder="0.00" className={inputCls} />
        </Field>
        <Field label="Cover type" required>
          <select name="coverTypeId" value={formData.coverTypeId} onChange={handleChange} required className={inputCls}>
            <option value="">Select a cover type</option>
            {coverTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Business" required>
          <select name="bizOption" value={formData.bizOption} onChange={handleChange} required className={inputCls}>
            <option value="">Select one</option>
            {bizOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>
    </PolicyFormPage>
    </>
  );
};

export default CreateNiipMotorPolicy;
