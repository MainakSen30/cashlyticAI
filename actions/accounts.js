"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { serializeTransacion } from "./serialize-transaction";

export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if(!user) throw new Error("User not Found");

    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });
    revalidatePath("/dashboard");
    return { success: true, data: serializeTransacion(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAccountWithTransactions(accountId) {
  const { userId } = await auth();
  if(!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if(!user) throw new Error("User not Found");

  const account = await db.account.findUnique({
    where: {
      id: accountId,
      userId: user.id,
    },
    include: {
      transactions: {
        orderBy: {
          date: "desc",
        },
      },
      _count: {
        select: {
          transactions: true,
        }
      }
    }
  });

  if(!account) {
    return null;
  }

  return {
    ...serializeTransacion(account),
    transactions: account.transactions.map(serializeTransacion),
  };
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if(!user) throw new Error("User not Found");
    const transactions = await db.transaction.findMany({
      where: {
        id: {
          in: transactionIds
        },
        userId: user.id,
      }
    });

    const accountBalanceChanges = transactions.reduce((acc, transaction) => {
      const amountNumber = Number(transaction.amount);
      const change = transaction.type === 'EXPENSE' ? amountNumber : -amountNumber;
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
      return acc;
    }, {});

    //delete transactions and update account balances in an account
    await db.$transaction(async (tx) => {
      //delete transactions
      await tx.transaction.deleteMany({
        where: {
          id: {
            in: transactionIds
          },
          userId: user.id,
        }
      });
      for (const[accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: {
            id: accountId,
          },
          data: {
            balance: {
              increment: Number(balanceChange),
            },
          },
        })
      }
    });

    revalidatePath("/dashboard");
    // Revalidate the specific account page so header totals update
    if (transactions.length > 0) {
      const accountId = transactions[0].accountId;
      revalidatePath(`/account/${accountId}`);
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}