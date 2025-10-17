"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { GoogleGenAI } from "@google/genai";
import { serializeTransacion } from "./serialize-transaction";

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Define the exact list of valid categories
const VALID_CATEGORIES = [
  "housing",
  "transportation",
  "groceries",
  "utilities",
  "entertainment",
  "food",
  "shopping",
  "healthcare",
  "education",
  "personal",
  "travel",
  "insurance",
  "gifts",
  "bills",
  "other-expense",
];

/**
 * Helper function to calculate the next recurring date
 */
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid recurring interval: ${interval}`);
  }

  return date;
}

// ----------------------------------------------------------------------
// TRANSACTION CRUD ACTIONS
// ----------------------------------------------------------------------

export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeTransacion(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeTransacion(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeTransacion(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}
export async function scanReceipt(file) {
  try {
    // Convert File to ArrayBuffer and then to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    // Define the extraction prompt
    const prompt = `
      Analyze this receipt image. Extract the total amount, the date (in ISO 8601 format), a brief description of the purchase, the merchant/store name, and suggest the best single category from the following list: ${VALID_CATEGORIES.join(
      ", "
    )}.
      If the image is not a receipt or the information cannot be found, return an object with null values for all fields.
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        // Enforce JSON output for reliable parsing
        responseMimeType: "application/json",
        // Provide the exact schema for maximum adherence
        responseSchema: {
          type: "object",
          properties: {
            amount: { type: "number", description: "The total amount of the transaction." },
            date: { type: "string", format: "date-time", description: "The date of the transaction in ISO 8601 format." },
            description: { type: "string", description: "A brief summary of the purchase." },
            merchantName: { type: "string", description: "The name of the store or merchant." },
            category: { type: "string", enum: VALID_CATEGORIES, description: "The suggested category from the provided list." },
          },
        },
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64String,
                mimeType: file.type,
              },
            },
          ],
        },
      ],
    });

    //  FIX APPLIED HERE: Access the 'text' property directly on the 'result' object.
    const text = result.text.trim();

    let data;
    try {
      // With responseMimeType: "application/json", the text should be pure JSON
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError, "Raw text:", text);
      throw new Error("Invalid response format from Gemini.");
    }

    // Handle case where Gemini returns null/empty data for non-receipt
    if (!data || !data.amount) {
      return { amount: 0, date: new Date(), description: "Unrecognized receipt", category: "other-expense", merchantName: "Unknown" };
    }

    // Convert and return the structured data
    return {
      amount: parseFloat(data.amount || 0),
      date: new Date(data.date),
      description: data.description || "No description",
      category: data.category || "other-expense",
      merchantName: data.merchantName || "Unknown Merchant",
    };
  } catch (error) {
    // Re-throw a generic user-friendly error
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt. Please try again or enter manually.");
  }
}