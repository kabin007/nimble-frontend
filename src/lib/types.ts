export interface Employee {
  id: string | number;
  name: string;
  role: string;
  department: string;
  phone: string;
  salary: number;
  joinDate: string;
  profilePicture?: string;
  status: "active" | "inactive" | "deleted";
}

export interface EmployeeAdvance {
  id: string | number;
  employeeId: string | number;
  amount: number;
  date: string;
  reason?: string;
}

export interface Attendance {
  id: string | number;
  employeeId: string | number;
  date: string;
  status: "present" | "absent" | "leave";
  notes?: string;
}

export interface InventoryItem {
  id: string | number;
  name: string;
  category: "fabric" | "garment" | "accessory" | "raw_material";
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  reorderLevel: number;
  supplier: string;
  lastUpdated: string;
  status: "active" | "deleted";
}

export interface Order {
  id: string | number;
  orderNumber: string;
  customer: string;
  channel: "online" | "physical" | "dealer";
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: "pending" | "processing" | "delivered" | "completed";
  date: string;
  companyName?: string;
  personName?: string;
  contactNo?: string;
  address?: string;
  email?: string;
  vatNumber?: string;
  panNumber?: string;
}

export interface Transaction {
  id: string | number;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  reference?: string;
  source?: string | number; // dealer or other source
  status: "active" | "deleted";
}

export interface Bill {
  id: string | number;
  billNumber: string;
  vendor: string;
  amount: number;
  dueDate: string;
  status: "paid" | "unpaid" | "overdue" | "deleted";
  items: { description: string; amount: number }[];
  date: string;
  billImage?: string;
  transactionType?: string;
}

export interface Dealer {
  id: string | number;
  name?: string;
  contact?: string;
  company: string;
  phone?: string;
  email?: string;
  address?: string;
  region?: string;
  dealerType?: "buyer" | "supplier" | "stakeholder" | "other";
  totalOrders?: number;
  outstandingBalance?: number;
  status: "active" | "inactive" | "deleted";
}
