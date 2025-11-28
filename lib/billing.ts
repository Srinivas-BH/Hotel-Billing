/**
 * Billing calculation utilities for the Hotel Billing Management Admin Portal
 * Implements calculations for subtotal, GST, service charge, discount, and grand total
 */

export interface OrderItem {
  price: number;
  quantity: number;
}

export interface BillingCalculation {
  subtotal: number;
  gstAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  grandTotal: number;
}

/**
 * Calculate subtotal by summing all item prices multiplied by quantities
 * @param items - Array of order items with price and quantity
 * @returns Subtotal amount
 * Requirements: 5.1
 */
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculate GST amount based on subtotal after discount
 * @param subtotal - The subtotal amount
 * @param discountAmount - The discount amount to subtract before GST
 * @param gstPercentage - The GST percentage to apply
 * @returns GST amount
 * Requirements: 5.2
 */
export function calculateGST(
  subtotal: number,
  discountAmount: number,
  gstPercentage: number
): number {
  const discountedSubtotal = subtotal - discountAmount;
  return discountedSubtotal * (gstPercentage / 100);
}

/**
 * Calculate service charge amount based on subtotal after discount
 * @param subtotal - The subtotal amount
 * @param discountAmount - The discount amount to subtract before service charge
 * @param serviceChargePercentage - The service charge percentage to apply
 * @returns Service charge amount
 * Requirements: 5.3
 */
export function calculateServiceCharge(
  subtotal: number,
  discountAmount: number,
  serviceChargePercentage: number
): number {
  const discountedSubtotal = subtotal - discountAmount;
  return discountedSubtotal * (serviceChargePercentage / 100);
}

/**
 * Apply discount to subtotal (discount is subtracted before GST and service charge)
 * @param subtotal - The subtotal amount
 * @param discountAmount - The discount amount to apply
 * @returns Discounted subtotal
 * Requirements: 5.4
 */
export function applyDiscount(subtotal: number, discountAmount: number): number {
  return subtotal - discountAmount;
}

/**
 * Calculate grand total as subtotal + GST + service charge - discount
 * @param items - Array of order items with price and quantity
 * @param gstPercentage - The GST percentage to apply (default 0)
 * @param serviceChargePercentage - The service charge percentage to apply (default 0)
 * @param discountAmount - The discount amount to apply (default 0)
 * @returns Complete billing calculation
 * Requirements: 5.5
 */
export function calculateGrandTotal(
  items: OrderItem[],
  gstPercentage: number = 0,
  serviceChargePercentage: number = 0,
  discountAmount: number = 0
): BillingCalculation {
  const subtotal = calculateSubtotal(items);
  // Ensure discount doesn't exceed subtotal
  const validDiscount = Math.min(discountAmount, subtotal);
  const gstAmount = calculateGST(subtotal, validDiscount, gstPercentage);
  const serviceChargeAmount = calculateServiceCharge(
    subtotal,
    validDiscount,
    serviceChargePercentage
  );
  const grandTotal = subtotal + gstAmount + serviceChargeAmount - validDiscount;

  return {
    subtotal,
    gstAmount,
    serviceChargeAmount,
    discountAmount: validDiscount,
    grandTotal,
  };
}
