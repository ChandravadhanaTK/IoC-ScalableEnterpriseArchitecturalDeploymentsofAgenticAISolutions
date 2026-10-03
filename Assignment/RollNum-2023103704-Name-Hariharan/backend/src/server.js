const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { runECommerceWorkflow } = require("../../agents/orchestrator/orchestrator");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const orders = [
  {
    id: "ORD001",
    customer: "Arun Kumar",
    product: "Laptop Pro",
    amount: 75999,
    status: "Delivered",
  },
  {
    id: "ORD002",
    customer: "Priya S",
    product: "Smartphone X",
    amount: 45999,
    status: "Processing",
  },
  {
    id: "ORD003",
    customer: "Rahul M",
    product: "Wireless Headphones",
    amount: 8999,
    status: "Shipped",
  },
  {
    id: "ORD004",
    customer: "Karthik R",
    product: "Gaming Console",
    amount: 52999,
    status: "Pending",
  },
  {
    id: "ORD005",
    customer: "Divya P",
    product: "Smart Watch",
    amount: 12999,
    status: "Delivered",
  },
];

app.get("/", (req, res) => {
  res.json({
    message: "AI E-Commerce Assistant Backend is running",
    status: "success",
  });
});

app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.get("/api/dashboard", (req, res) => {
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.amount,
    0
  );

  const highRiskOrders = orders.filter(
    (order) => order.amount > 50000 || order.status === "Pending"
  ).length;

  res.json({
    totalRevenue,
    totalOrders: 1248,
    customers: 3842,
    highRiskOrders,
  });
});

app.post("/api/workflow", async (req, res) => {
  try {
    const order = req.body.order || orders[3];

    const customer = {
      id: "CUS001",
      name: order.customer,
      totalOrders: 6,
      totalSpent: 75000,
    };

    const result = await runECommerceWorkflow(
      order,
      customer,
      orders
    );

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "AI workflow failed",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});