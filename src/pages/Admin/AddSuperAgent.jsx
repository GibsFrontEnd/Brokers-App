import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const initialState = {
  username: "",
  password: "",
  brokerName: "",
  email: "",
  mobilePhone: "",
  contactPerson: "",
  address: "",
  insCompanyID: "",
  tag: "",
  remarks: "",
  rate: "",
  value: "",
  lStartDate: "",
  lEndDate: "",
};

const AddSuperAgent = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");

    const payload = {
      ...form,
      submitDate: new Date().toISOString(),
      lStartDate: form.lStartDate || null,
      lEndDate: form.lEndDate || null,
    };

    try {
      await axios.post(
        "https://gibsbrokersapi.newgibsonline.com/api/Auth/create-broker",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      setSuccess("Super Agent created successfully.");
      window.alert("Super Agent created successfully.");
      setForm(initialState);
      setTimeout(() => navigate("/admin/users/agents-brokers"), 800);
    } catch (err) {
      console.error("Create broker error", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to create Super Agent";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Admin • Super Agents
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Add Super Agent
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
              Create a new super agent profile. Required fields are marked with
              *.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Username *
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Super Agent Name *
              </label>
              <input
                name="brokerName"
                value={form.brokerName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Mobile Phone *
              </label>
              <input
                name="mobilePhone"
                value={form.mobilePhone}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Contact Person
              </label>
              <input
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Address
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Insurance Company ID
              </label>
              <input
                name="insCompanyID"
                value={form.insCompanyID}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">Tag</label>
              <input
                name="tag"
                value={form.tag}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                Remarks
              </label>
              <input
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">Rate</label>
              <input
                name="rate"
                value={form.rate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">Value</label>
              <input
                name="value"
                value={form.value}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                License Start Date
              </label>
              <input
                type="date"
                name="lStartDate"
                value={form.lStartDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-800">
                License End Date
              </label>
              <input
                type="date"
                name="lEndDate"
                value={form.lEndDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Super Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSuperAgent;
