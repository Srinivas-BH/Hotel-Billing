// Core type definitions for the Hotel Billing Admin Portal
// These types align with the database schema and API contracts

export interface Hotel {
  id: string;
  email: string;
  hotelName: string;
  hotelPhotoKey: string | null;
  tableCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  hotelId: string;
  dishName: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  menuItemId: string | null;
  dishName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  hotelId: string;
  invoiceNumber: string;
  tableNumber: number;
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  discountAmount: number;
  grandTotal: number;
  invoiceJson: InvoiceJSON;
  pdfKey: string | null;
  items: InvoiceItem[];
  createdAt: Date;
}

export interface InvoiceJSON {
  invoiceNumber: string;
  tableNumber: number;
  hotelName: string;
  date: string;
  items: {
    dishName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  gst: {
    percentage: number;
    amount: number;
  };
  serviceCharge: {
    percentage: number;
    amount: number;
  };
  discount: number;
  grandTotal: number;
}

export interface DailyReport {
  date: string;
  invoiceCount: number;
  totalRevenue: number;
}

export interface MonthlyReport {
  month: string;
  year: number;
  invoiceCount: number;
  totalRevenue: number;
}
