import { secondSeedTransactions } from "@/actions/secondSeed";
import { seedTransactions } from "@/actions/seed";

export async function GET() {
  const result = await seedTransactions();
  const result2 = await secondSeedTransactions();
  return Response.json(result, result2);
}
