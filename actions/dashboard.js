"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { serializeTransacion } from "./serialize-transaction";

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if(!user) throw new Error("User not Found");
    //convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if(isNaN(balanceFloat)) {
      throw new Error("Invalid, balance amount");
    }
    //check if this is the user's first account
    const existingAccount = await db.account.findMany({
      where: { userId: user.id },
    });
    const shouldBeDefault = existingAccount.length === 0 ? true : data.isDefault;
    //if this account is default, unset other accounts as default 
    if(shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });
    const serializedAccount = serializeTransacion(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserAccounts() {
  const { userId } = await auth();
  if(!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if(!user) throw new Error("User not Found");
  
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  const serializedAccount = accounts.map(serializeTransacion);
  return serializedAccount;
}

export async function getDashboardData() {
  const { userId } = await auth();
  if(!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if(!user) throw new Error("User not Found");

  //get user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return transactions.map(serializeTransacion);
}