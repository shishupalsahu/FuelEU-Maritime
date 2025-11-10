import React, { useState } from "react";
import api from "../../infrastructure/apiClient";

interface PoolMember {
  shipId: string;
  cbBefore?: number;
  cbAfter?: number;
}

const PoolingTab: React.FC = () => {
  const [year, setYear] = useState(2025);
  const [members, setMembers] = useState<PoolMember[]>([
    { shipId: "R004" },
    { shipId: "R005" },
  ]);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    setMembers([...members, { shipId: "" }]);
  };

  const updateMember = (index: number, value: string) => {
    const updated = [...members];
    updated[index].shipId = value;
    setMembers(updated);
  };

  const createPool = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/pools", { year, members });
      setResult(res.data);
      setMessage("Pool created successfully!");
    } catch (err: any) {
      console.error("Error creating pool:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to create pool (check if total CB >= 0)";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pooling (Article 21)</h2>

      <div className="flex gap-3 mb-4">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border p-2 rounded w-24"
          placeholder="Year"
        />
        <button
          onClick={addMember}
          className="bg-gray-700 text-white px-3 py-2 rounded"
        >
          + Add Member
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {members.map((m, i) => (
          <input
            key={i}
            value={m.shipId}
            onChange={(e) => updateMember(i, e.target.value)}
            placeholder={`Ship ID #${i + 1}`}
            className="border p-2 rounded w-32"
          />
        ))}
      </div>

      <button
        onClick={createPool}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Creating..." : "Create Pool"}
      </button>

      {message && (
        <p
          className={`mt-3 p-2 rounded ${
            message.includes("success")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">
            Pool Summary (Year {year})
          </h3>
          <p className="mb-2">
            <strong>Pool ID:</strong> {result.poolId}
          </p>
          <p className="mb-2">
            <strong>Total CB:</strong>{" "}
            {result.totalCB?.toFixed?.(2) ?? result.totalCB}
          </p>

          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th>Ship ID</th>
                <th>CB Before</th>
                <th>CB After</th>
              </tr>
            </thead>
            <tbody>
              {result.members.map((m: any) => (
                <tr key={m.shipId} className="text-center border-b">
                  <td>{m.shipId}</td>
                  <td
                    className={`${
                      m.cbBefore >= 0 ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {m.cbBefore.toFixed(2)}
                  </td>
                  <td
                    className={`${
                      m.cbAfter >= 0 ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {m.cbAfter.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className={`mt-3 p-2 text-center rounded ${
              result.totalCB >= 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            Pool Sum Indicator:{" "}
            {result.totalCB >= 0 ? "✅ Valid Pool" : "❌ Invalid Pool"}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolingTab;
