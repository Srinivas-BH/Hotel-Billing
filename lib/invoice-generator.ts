/**
 * AI-powered invoice generation with deterministic fallback
 * Implements Hugging Face API integration with timeout and retry logic
 * Requirements: 6.1, 6.3, 6.4, 6.5, 14.5
 */

import { InvoiceJSON } from '@/types';

export interface OrderData {
  hotelName: string;
  tableNumber: number;
  items: {
    dishName: string;
    quantity: number;
    price: number;
  }[];
  gstPercentage: number;
  serviceChargePercentage: number;
  discountAmount: number;
}

interface HuggingFaceResponse {
  generated_text?: string;
  error?: string;
}

/**
 * Generate unique invoice number
 * Format: INV-{timestamp}-{random}
 * Requirements: 6.3
 */
export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `INV-${timestamp}-${random}`;
}

/**
 * Call Hugging Face Inference API with timeout and retry logic
 * @param orderData - Order data for invoice generation
 * @param retries - Number of retry attempts (default 2)
 * @param timeout - Timeout in milliseconds (default 10000)
 * @returns Generated invoice JSON or null on failure
 * Requirements: 6.4
 */
async function callHuggingFaceAPI(
  orderData: OrderData,
  retries: number = 2,
  timeout: number = 10000
): Promise<InvoiceJSON | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL || 'facebook/bart-large-cnn';

  if (!apiKey) {
    console.warn('HUGGINGFACE_API_KEY not configured');
    return null;
  }

  // Calculate totals for the prompt
  const subtotal = orderData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Ensure discount doesn't exceed subtotal
  const validDiscount = Math.min(orderData.discountAmount, subtotal);
  const discountedSubtotal = subtotal - validDiscount;
  const gstAmount = discountedSubtotal * (orderData.gstPercentage / 100);
  const serviceChargeAmount =
    discountedSubtotal * (orderData.serviceChargePercentage / 100);
  const grandTotal = subtotal + gstAmount + serviceChargeAmount - validDiscount;

  const invoiceNumber = generateInvoiceNumber();
  const date = new Date().toISOString();

  // Create structured prompt
  const itemsList = orderData.items
    .map((item) => `${item.dishName} x${item.quantity} @ $${item.price.toFixed(2)}`)
    .join(', ');

  const prompt = `Generate a structured hotel invoice in JSON format with the following details:

Hotel: ${orderData.hotelName}
Table: ${orderData.tableNumber}
Date: ${date}
Items: ${itemsList}
GST: ${orderData.gstPercentage}%
Service Charge: ${orderData.serviceChargePercentage}%
Discount: $${orderData.discountAmount.toFixed(2)}

Return only valid JSON with this structure:
{
  "invoiceNumber": "${invoiceNumber}",
  "tableNumber": ${orderData.tableNumber},
  "hotelName": "${orderData.hotelName}",
  "date": "${date}",
  "items": ${JSON.stringify(
    orderData.items.map((item) => ({
      dishName: item.dishName,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    }))
  )},
  "subtotal": ${subtotal.toFixed(2)},
  "gst": { "percentage": ${orderData.gstPercentage}, "amount": ${gstAmount.toFixed(2)} },
  "serviceCharge": { "percentage": ${orderData.serviceChargePercentage}, "amount": ${serviceChargeAmount.toFixed(2)} },
  "discount": ${validDiscount.toFixed(2)},
  "grandTotal": ${grandTotal.toFixed(2)}
}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: 1000,
              temperature: 0.1,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status}`);
      }

      const data: HuggingFaceResponse[] = await response.json();

      if (data && data[0] && data[0].generated_text) {
        // Try to parse JSON from the response
        const jsonMatch = data[0].generated_text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedInvoice = JSON.parse(jsonMatch[0]);
          return parsedInvoice as InvoiceJSON;
        }
      }

      throw new Error('Invalid response format from Hugging Face API');
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `Hugging Face API failed after ${retries + 1} attempts:`,
          error
        );
        return null;
      }
      console.warn(`Hugging Face API attempt ${attempt + 1} failed, retrying...`);
    }
  }

  return null;
}

/**
 * Generate invoice using deterministic algorithm (fallback)
 * @param orderData - Order data for invoice generation
 * @returns Generated invoice JSON
 * Requirements: 6.1, 6.3, 6.5
 */
export function generateInvoiceDeterministic(orderData: OrderData): InvoiceJSON {
  const invoiceNumber = generateInvoiceNumber();

  const items = orderData.items.map((item) => ({
    dishName: item.dishName,
    quantity: item.quantity,
    price: item.price,
    total: item.price * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  // Ensure discount doesn't exceed subtotal
  const validDiscount = Math.min(orderData.discountAmount, subtotal);
  const discountedSubtotal = subtotal - validDiscount;
  const gstAmount = discountedSubtotal * (orderData.gstPercentage / 100);
  const serviceChargeAmount =
    discountedSubtotal * (orderData.serviceChargePercentage / 100);
  const grandTotal = subtotal + gstAmount + serviceChargeAmount - validDiscount;

  return {
    invoiceNumber,
    tableNumber: orderData.tableNumber,
    hotelName: orderData.hotelName,
    date: new Date().toISOString(),
    items,
    subtotal,
    gst: {
      percentage: orderData.gstPercentage,
      amount: gstAmount,
    },
    serviceCharge: {
      percentage: orderData.serviceChargePercentage,
      amount: serviceChargeAmount,
    },
    discount: validDiscount,
    grandTotal,
  };
}

/**
 * Generate invoice with AI (Hugging Face) and fallback to deterministic
 * @param orderData - Order data for invoice generation
 * @returns Generated invoice JSON
 * Requirements: 6.4, 6.5, 14.5
 */
export async function generateInvoice(orderData: OrderData): Promise<InvoiceJSON> {
  try {
    // Try Hugging Face API first
    const aiInvoice = await callHuggingFaceAPI(orderData);

    if (aiInvoice) {
      console.log('Invoice generated successfully using Hugging Face API');
      return aiInvoice;
    }

    // Fall back to deterministic algorithm
    console.warn('AI service unavailable, using deterministic fallback');
    return generateInvoiceDeterministic(orderData);
  } catch (error) {
    // Fall back to deterministic algorithm on any error
    console.error('Error in AI invoice generation, using fallback:', error);
    return generateInvoiceDeterministic(orderData);
  }
}
