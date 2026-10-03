import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = "http://localhost:5000/api";
const AGENT_DEMO_URL = `${API_URL}/agent/demo`;

type Transaction = {
  transactionId: string;
  date: string;
  merchant: string;
  amount: number;
  transactionType: "credit" | "debit";
  category: string;
  location: string;
};

type AgentData = {
  success: boolean;
  workflow: string[];
  transactionResult?: {
    transactions: Transaction[];
    summary: {
      totalTransactions: number;
      totalIncome: number;
      totalExpenses: number;
    };
  };
  fraudResult?: {
    alerts: {
      transactionId: string;
      merchant: string;
      amount: number;
      riskScore: number;
      riskLevel: string;
      reason: string;
      status: string;
    }[];
    summary: {
      transactionsAnalyzed: number;
      suspiciousTransactions: number;
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
  };
  analysisResult?: {
    analysis: {
      totalIncome: number;
      totalExpenses: number;
      balance: number;
      categorySpending: Record<string, number>;
      highestSpendingCategory: string;
      highestSpendingAmount: number;
      transactionCount: number;
      fraudAlerts: number;
      insights: string[];
    };
  };
  reportResult?: {
    report: {
      reportId: string;
      generatedAt: string;
      status: string;
    };
  };
};

const fallbackTransactions: Transaction[] = [
  {
    transactionId: "TXN001",
    date: "2026-09-30",
    merchant: "Amazon",
    amount: 2499,
    transactionType: "debit",
    category: "Shopping",
    location: "Chennai",
  },
  {
    transactionId: "TXN002",
    date: "2026-09-29",
    merchant: "Swiggy",
    amount: 850,
    transactionType: "debit",
    category: "Food",
    location: "Chennai",
  },
  {
    transactionId: "TXN003",
    date: "2026-09-28",
    merchant: "Unknown Merchant",
    amount: 28500,
    transactionType: "debit",
    category: "Other",
    location: "Unknown",
  },
  {
    transactionId: "TXN004",
    date: "2026-09-27",
    merchant: "Salary",
    amount: 50000,
    transactionType: "credit",
    category: "Income",
    location: "Chennai",
  },
  {
    transactionId: "TXN005",
    date: "2026-09-26",
    merchant: "Uber",
    amount: 420,
    transactionType: "debit",
    category: "Transport",
    location: "Chennai",
  },
];

const monthlyData = [
  { month: "Jan", income: 42000, expenses: 28000 },
  { month: "Feb", income: 45000, expenses: 30000 },
  { month: "Mar", income: 47000, expenses: 29000 },
  { month: "Apr", income: 44000, expenses: 31000 },
  { month: "May", income: 48000, expenses: 32000 },
  { month: "Jun", income: 46000, expenses: 30000 },
  { month: "Jul", income: 50000, expenses: 34000 },
  { month: "Aug", income: 49000, expenses: 31500 },
  { month: "Sep", income: 50000, expenses: 32269 },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "fraud", label: "Fraud Detection", icon: ShieldAlert },
  { id: "analysis", label: "Financial Analysis", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "assistant", label: "AI Assistant", icon: Bot },
];

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function StatCard({
  title,
  value,
  change,
  positive,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className="rounded-xl bg-slate-800 p-2 text-emerald-400">
          {icon}
        </div>
      </div>

      <div className="text-2xl font-bold text-white">{value}</div>

      <div
        className={`mt-2 flex items-center gap-1 text-xs ${
          positive ? "text-emerald-400" : "text-slate-400"
        }`}
      >
        {positive && <ArrowUpRight size={14} />}
        {change}
      </div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      setAgentLoading(true);

      const response = await fetch(AGENT_DEMO_URL);

      if (!response.ok) {
        throw new Error("Agent API request failed");
      }

      const data = await response.json();

      if (data.success) {
        setAgentData(data);
        setBackendConnected(true);
      }
    } catch (error) {
      console.error("Failed to load agent workflow:", error);
      setBackendConnected(false);
    } finally {
      setAgentLoading(false);
    }
  };

  const financialAnalysis = agentData?.analysisResult?.analysis;

  const transactionSummary =
    agentData?.transactionResult?.summary;

  const fraudSummary = agentData?.fraudResult?.summary;

  const transactions =
    agentData?.transactionResult?.transactions ||
    fallbackTransactions;

  const fraudAlerts =
    agentData?.fraudResult?.alerts || [];

  const categorySpending =
    financialAnalysis?.categorySpending || {
      Shopping: 2499,
      Food: 850,
      Other: 28500,
      Transport: 420,
    };

  const totalIncome =
    transactionSummary?.totalIncome ?? 50000;

  const totalExpenses =
    transactionSummary?.totalExpenses ?? 32269;

  const balance =
    financialAnalysis?.balance ??
    totalIncome - totalExpenses;

  const suspiciousTransactions =
    fraudSummary?.suspiciousTransactions ??
    fraudAlerts.length;

  const highestSpendingCategory =
    financialAnalysis?.highestSpendingCategory ||
    "Other";

  const insights =
    financialAnalysis?.insights || [
      "Income is currently higher than expenses.",
      `${highestSpendingCategory} is currently the highest spending category.`,
      `${suspiciousTransactions} suspicious transaction(s) require review.`,
    ];

  const categoryChartData = useMemo(
    () =>
      Object.entries(categorySpending).map(
        ([name, value]) => ({
          name,
          value,
        }),
      ),
    [categorySpending],
  );

  const sendAssistantMessage = async () => {
    if (!assistantMessage.trim()) return;

    try {
      setAssistantLoading(true);

      const response = await fetch(`${API_URL}/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: assistantMessage,
        }),
      });

      const data = await response.json();

      setAssistantResponse(
        data.response ||
          data.message ||
          "I could not generate a response.",
      );
    } catch (error) {
      console.error(error);

      setAssistantResponse(
        "Unable to connect to the AI Assistant backend.",
      );
    } finally {
      setAssistantLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Financial Dashboard
        </h1>

        <p className="mt-1 text-slate-400">
          Overview of your financial activity
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
        <CheckCircle2 size={18} />
        {backendConnected
          ? "Backend Connected"
          : "Backend Disconnected"}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(totalIncome)}
          change="+12.5%"
          positive
          icon={<TrendingUp size={20} />}
        />

        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          change="-8.2%"
          positive
          icon={<ArrowDownRight size={20} />}
        />

        <StatCard
          title="Current Balance"
          value={formatCurrency(balance)}
          change="+15.4%"
          positive
          icon={<ArrowUpRight size={20} />}
        />

        <StatCard
          title="Fraud Alerts"
          value={String(suspiciousTransactions)}
          change={`${fraudSummary?.highRisk || 0} high risk`}
          icon={<AlertTriangle size={20} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Monthly Financial Activity
              </h2>

              <p className="text-sm text-slate-400">
                Income vs expenses
              </p>
            </div>

            <Activity
              size={20}
              className="text-emerald-400"
            />
          </div>

          <div className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#34d399"
                  fill="#34d399"
                  fillOpacity={0.12}
                />

                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="font-semibold text-white">
            Spending by Category
          </h2>

          <p className="mb-4 text-sm text-slate-400">
            Current expense distribution
          </p>

          <div className="h-60">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                >
                  {categoryChartData.map(
                    (_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={[
                          "#34d399",
                          "#60a5fa",
                          "#f59e0b",
                          "#a78bfa",
                          "#f87171",
                        ][index % 5]}
                      />
                    ),
                  )}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value))
                  }
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {categoryChartData.map(
              (category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-400">
                    {category.name}
                  </span>

                  <span className="font-medium text-white">
                    {formatCurrency(
                      Number(category.value),
                    )}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">
              AI Financial Insight
            </h2>

            <p className="text-sm text-slate-400">
              Generated by Financial Analysis Agent
            </p>
          </div>

          <Bot
            size={22}
            className="text-emerald-400"
          />
        </div>

        <div className="space-y-3">
          {insights.map(
            (insight, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300"
              >
                {insight}
              </div>
            ),
          )}
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Highest spending category:{" "}
          <span className="font-semibold text-white">
            {highestSpendingCategory}
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-white">
            Recent Transactions
          </h2>

          <p className="text-sm text-slate-400">
            Latest financial activity from Transaction Agent
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-4 py-3">
                  Transaction
                </th>

                <th className="px-4 py-3">
                  Category
                </th>

                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-4 py-3">
                  Amount
                </th>

                <th className="px-4 py-3">
                  Risk
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(
                (transaction) => {
                  const fraud = fraudAlerts.find(
                    (alert) =>
                      alert.transactionId ===
                      transaction.transactionId,
                  );

                  const isCredit =
                    transaction.transactionType ===
                    "credit";

                  const risk =
                    fraud?.riskLevel || "Low";

                  return (
                    <tr
                      key={
                        transaction.transactionId
                      }
                      className="border-b border-slate-800/70"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">
                          {transaction.merchant}
                        </div>

                        <div className="text-xs text-slate-500">
                          {
                            transaction.transactionId
                          }
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-400">
                        {transaction.category}
                      </td>

                      <td className="px-4 py-4 text-slate-400">
                        {new Date(
                          transaction.date,
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>

                      <td
                        className={`px-4 py-4 font-semibold ${
                          isCredit
                            ? "text-emerald-400"
                            : "text-white"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatCurrency(
                          transaction.amount,
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            risk === "High"
                              ? "bg-red-500/10 text-red-400"
                              : risk === "Medium"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {risk}
                        </span>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Transactions
        </h1>

        <p className="mt-1 text-slate-400">
          Transactions processed by the Transaction Agent
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-400">
              Total Transactions
            </p>

            <p className="mt-1 text-2xl font-bold text-white">
              {transactions.length}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">
              Total Income
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">
              Total Expenses
            </p>

            <p className="mt-1 text-2xl font-bold text-white">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-4 py-3">
                  ID
                </th>

                <th className="px-4 py-3">
                  Merchant
                </th>

                <th className="px-4 py-3">
                  Category
                </th>

                <th className="px-4 py-3">
                  Date
                </th>

                <th className="px-4 py-3">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(
                (transaction) => (
                  <tr
                    key={
                      transaction.transactionId
                    }
                    className="border-b border-slate-800/70"
                  >
                    <td className="px-4 py-4 text-slate-400">
                      {transaction.transactionId}
                    </td>

                    <td className="px-4 py-4 font-medium text-white">
                      {transaction.merchant}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {transaction.category}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {transaction.date}
                    </td>

                    <td
                      className={`px-4 py-4 font-semibold ${
                        transaction.transactionType ===
                        "credit"
                          ? "text-emerald-400"
                          : "text-white"
                      }`}
                    >
                      {transaction.transactionType ===
                      "credit"
                        ? "+"
                        : "-"}
                      {formatCurrency(
                        transaction.amount,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFraud = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Fraud Detection
        </h1>

        <p className="mt-1 text-slate-400">
          Suspicious activity detected by the Fraud Detection Agent
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Suspicious Transactions"
          value={String(
            fraudSummary?.suspiciousTransactions || 0,
          )}
          change="Requires review"
          icon={
            <ShieldAlert size={20} />
          }
        />

        <StatCard
          title="High Risk"
          value={String(
            fraudSummary?.highRisk || 0,
          )}
          change="Immediate attention"
          icon={
            <AlertTriangle size={20} />
          }
        />

        <StatCard
          title="Medium Risk"
          value={String(
            fraudSummary?.mediumRisk || 0,
          )}
          change="Review recommended"
          icon={
            <Activity size={20} />
          }
        />
      </div>

      <div className="space-y-4">
        {fraudAlerts.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-emerald-400">
            No suspicious transactions detected.
          </div>
        ) : (
          fraudAlerts.map((alert) => (
            <div
              key={alert.transactionId}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">
                      {alert.merchant}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        alert.riskLevel ===
                        "High"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {alert.riskLevel}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {alert.transactionId}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(
                      alert.amount,
                    )}
                  </p>

                  <p className="text-sm text-red-400">
                    Risk Score:{" "}
                    {alert.riskScore}/100
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-950/70 p-4">
                <p className="text-sm font-medium text-slate-300">
                  Detection Reason
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {alert.reason}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Financial Analysis
        </h1>

        <p className="mt-1 text-slate-400">
          Insights generated by the Financial Analysis Agent
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Income"
          value={formatCurrency(totalIncome)}
          change="Analyzed"
          positive
          icon={
            <TrendingUp size={20} />
          }
        />

        <StatCard
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          change="Analyzed"
          icon={
            <ArrowDownRight size={20} />
          }
        />

        <StatCard
          title="Balance"
          value={formatCurrency(balance)}
          change={
            balance >= 0
              ? "Positive balance"
              : "Negative balance"
          }
          positive={balance >= 0}
          icon={
            <Activity size={20} />
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-5 font-semibold text-white">
            Category Spending
          </h2>

          <div className="h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={categoryChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value))
                  }
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#34d399"
                  radius={[
                    8, 8, 0, 0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-5 font-semibold text-white">
            AI Insights
          </h2>

          <div className="space-y-3">
            {insights.map(
              (insight, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex gap-3">
                    <TrendingUp
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-400"
                    />

                    <p className="text-sm text-slate-300">
                      {insight}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Reports
        </h1>

        <p className="mt-1 text-slate-400">
          Reports generated by the Report Generation Agent
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FileText
                size={24}
                className="text-emerald-400"
              />

              <h2 className="font-semibold text-white">
                Financial Analysis Report
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Automated report generated from the complete
              multi-agent workflow.
            </p>
          </div>

          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            Generated
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">
              Income
            </p>

            <p className="mt-1 text-xl font-bold text-emerald-400">
              {formatCurrency(totalIncome)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">
              Expenses
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">
              Balance
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 p-4">
          <p className="text-sm text-slate-400">
            Report ID
          </p>

          <p className="mt-1 font-mono text-sm text-white">
            {agentData?.reportResult?.report
              ?.reportId || "Generating..."}
          </p>
        </div>
      </div>
    </div>
  );

  const renderAssistant = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          AI Financial Assistant
        </h1>

        <p className="mt-1 text-slate-400">
          Ask questions about your financial activity.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <MessageCircle size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Financial AI Assistant
            </h2>

            <p className="text-sm text-slate-400">
              Powered by the backend AI service
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={assistantMessage}
            onChange={(event) =>
              setAssistantMessage(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendAssistantMessage();
              }
            }}
            placeholder="Example: Analyze my spending"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
          />

          <button
            onClick={sendAssistantMessage}
            disabled={assistantLoading}
            className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assistantLoading
              ? "Thinking..."
              : "Ask AI"}
          </button>
        </div>

        {assistantResponse && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Bot
                size={18}
                className="text-emerald-400"
              />

              <span className="font-medium text-white">
                AI Response
              </span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
              {assistantResponse}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Profile
        </h1>

        <p className="mt-1 text-slate-400">
          User account information
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-slate-950">
            S
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Sarveswar
            </h2>

            <p className="text-slate-400">
              User
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case "transactions":
        return renderTransactions();

      case "fraud":
        return renderFraud();

      case "analysis":
        return renderAnalysis();

      case "reports":
        return renderReports();

      case "assistant":
        return renderAssistant();

      case "profile":
        return renderProfile();

      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileMenu
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500 p-2 text-slate-950">
                  <Bot size={22} />
                </div>

                <div>
                  <p className="font-bold text-white">
                    AI Finance
                  </p>

                  <p className="text-xs text-slate-500">
                    Agentic Assistant
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMobileMenu(false)
                }
                className="lg:hidden"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileMenu(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                      activePage === item.id
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />

                    {item.label}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setActivePage("profile");
                  setMobileMenu(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  activePage === "profile"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <User size={18} />
                Profile
              </button>
            </nav>

            <div className="border-t border-slate-800 p-4">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-900 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 font-bold text-slate-950">
                  S
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    Sarveswar
                  </p>

                  <p className="text-xs text-slate-500">
                    User
                  </p>
                </div>
              </div>

              <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {mobileMenu && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() =>
              setMobileMenu(false)
            }
          />
        )}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
              <button
                onClick={() =>
                  setMobileMenu(true)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
              >
                <Menu size={22} />
              </button>

              <div className="hidden lg:block">
                <p className="text-sm text-slate-400">
                  AI-powered financial intelligence
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadAgentData}
                  className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
                  title="Refresh agent data"
                >
                  <RefreshCw
                    size={18}
                    className={
                      agentLoading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-white">
                    Sarveswar
                  </p>

                  <p className="text-xs text-slate-500">
                    User
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 font-bold text-slate-950">
                  S
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">
            {agentLoading ? (
              <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                  <RefreshCw
                    size={32}
                    className="mx-auto animate-spin text-emerald-400"
                  />

                  <p className="mt-4 text-slate-400">
                    Running AI financial agents...
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Transaction → Fraud → Analysis → Report
                  </p>
                </div>
              </div>
            ) : (
              renderPage()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;