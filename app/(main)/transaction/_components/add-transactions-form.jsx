"use client";

import React, { 
  useEffect, 
  useState 
} from "react";
import { 
  createTransaction, 
  updateTransaction 
} from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarDays, Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";  
import { motion, AnimatePresence } from "framer-motion"; 
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ReceiptScanner from "./receipt-scanner";

const AddTransactionForm = ({ 
  accounts, 
  categories,
  editMode = false,
  initialData = null 
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [mounted, setMounted] = useState(false);

  // Fix hydration error: only render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const { 
    register,
    setValue,
    handleSubmit, 
    formState: { errors },
    watch, 
    getValues,
    reset, 
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: 
    editMode && initialData 
    ? {
      type: initialData.type,
      amount: initialData.amount.toString(),
      description: initialData.description,
      accountId: initialData.accountId,
      category: initialData.category,
      date: new Date(initialData.date),
      isRecurring: initialData.isRecurring,
      ...(initialData.recurringInterval && {
        recurringInterval: initialData.recurringInterval,
      }),
    } : {
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId: accounts.find((acc) => acc.isDefault)?.id,
      date: new Date(),
      isRecurring: false,
    },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionData,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const watchType = watch("type");
  const watchIsRecurring = watch("isRecurring");
  const watchDate = watch("date");

  const filteredCategories = categories.filter((category) => category.type === watchType);

  const onSubmit = async(data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };
    { editMode ? transactionFn(editId, formData) : transactionFn(formData) };
  };

  useEffect(() => {
    if(transactionData?.success && !transactionLoading) {
      toast.success(editMode ? "Transaction updated successfully" : "Transaction created successfully");
      reset();
      router.push(`/account/${transactionData.data.accountId}`);
    }
  }, [ transactionData, transactionLoading, editMode ]);

  const handleScanComplete = (scannedData) => {
    if(scannedData) {
      setValue("amount", scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));
      if(scannedData.description) {
        setValue("description", scannedData.description);
      }
      if(scannedData.category) {
        setValue("category", scannedData.category);
      }
    }
  }

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <form 
      className="container mx-auto border-2 rounded-3xl shadow-2xl p-6 space-y-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* AI receipt scanner */}
      { !editMode && <ReceiptScanner onScanComplete={handleScanComplete}/> }
      {/* Transaction Type */}
      <div className="space-y-2">
        <label className="text-sm font-bold">Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          defaultValue={watchType}
        >
          <SelectTrigger className="w-full rounded-md px-4 py-2 hover:shadow-md transition-all duration-300">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className="w-full rounded-md px-4 py-2 hover:shadow-md transition-all duration-300"
          />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>

        {/* Account */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger className="w-full rounded-md px-4 py-2 hover:shadow-md transition-all duration-300">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (₹{parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button 
                  variant="ghost"
                  className="w-full select-none items-center justify-start"
                >
                  <Plus className="size-4" />
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-sm text-red-500">{errors.accountId.message}</p>}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-bold">Category</label>
        <Select
          onValueChange={(value) => setValue("category", value)}
          defaultValue={getValues("category")}
        >
          <SelectTrigger className="w-full rounded-md px-4 py-2 hover:shadow-md transition-all duration-300">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-sm font-bold">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline"
              className="w-full pl-3 text-left font-normal rounded-md px-4 py-2 hover:shadow-md transition-all duration-300"
            >
              {watchDate ? format(watchDate, "PPP") : <span className="text-muted-foreground">Select Date</span>}
              <CalendarDays className="ml-auto size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar 
              mode="single"
              selected={watchDate}
              onSelect={(watchDate) => setValue("date", watchDate)}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-bold">Description</label>
        <input 
          placeholder="Enter Description"
          {...register("description")}
          className="w-full text-sm rounded-md px-4 py-2 border border-input hover:shadow-md transition-all duration-300"
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Recurring Switch */}
      <div className="flex items-center justify-between rounded-lg border p-3 hover:shadow-md transition-all duration-300">
        <div className="space-y-0.5">
          <label 
            htmlFor="isDefault" 
            className="block mb-2 text-sm font-semibold text-gray-700 cursor-pointer"
          >
            Recurring Transaction?
          </label>
          <p className="text-sm text-gray-400 font-semibold">
            This transaction will be marked as a recurring transaction
          </p>
        </div>
        <Switch 
          checked={watchIsRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {/* Recurring Interval Section */}
      <AnimatePresence mode="wait">
        {watchIsRecurring && (
          <motion.div
            key="recurring-interval"
            initial={{ opacity: 0, scaleY: 0.8, y: 10 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.8, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-2 origin-top"
          >
            <label className="text-sm font-bold">Recurring Interval</label>
            <Select
              onValueChange={(value) => setValue("recurringInterval", value)}
              defaultValue={getValues("recurringInterval")}
            >
              <SelectTrigger className="w-full rounded-md px-4 py-2 hover:shadow-md transition-all duration-300">
                <SelectValue placeholder="Select Interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
            {errors.recurringInterval && (
              <p className="text-sm text-red-500">{errors.recurringInterval.message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="container mx-auto border rounded-md shadow-lg p-5 flex items-center gap-4">
        <Button 
          type="button"
          variant="destructive"
          className="flex-1 p-3 w-full hover:shadow-lg transition-all duration-300"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 p-3 gap-3 hover:shadow-lg transition-all duration-300" 
          disabled={transactionLoading}
        >
          {transactionLoading ? (
            <>
              {" "}
              <Loader2 className="mr-2 size-4 animate-spin" />
              { editMode ? "Updating" : "Creating" }
            </>
          ) : editMode ? "Update Transaction" : "Create Transaction"}
        </Button>
      </div>
    </form>
  );
};

export default AddTransactionForm;
