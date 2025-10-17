"use client";

import { updateUserBudget } from "@/actions/budget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import useFetch from "@/hooks/use-fetch";
import { CheckSquareIcon, Loader2, LucidePencil, XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion"; 

const BudgetProgress = ({ initialBudget, currentExpenses }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const percentageUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const {
    loading: isLoading,
    fn: updateUserBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateUserBudget);

  const handleSave = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid budget amount.");
      return;
    }
  
    // Optimistically update the UI
    const oldBudget = initialBudget.amount;
    initialBudget.amount = amount; // immediate UI change
  
    setIsEditing(false);
    toast.message("Updating budget...");
  
    try {
      await updateUserBudgetFn(amount);
      toast.success("Budget updated successfully!");
    } catch (err) {
      //Revert if failed
      initialBudget.amount = oldBudget;
      toast.error("Failed to update budget");
    }
  };
  

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully.");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  return (
    <Card className="relative overflow-hidden shadow-lg transition-all duration-200">
      {/* Loading veil */}
      {isLoading && (
        <div
          className="absolute inset-0 z-50 rounded-lg pointer-events-none"
          style={{
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-white/40">
            <div className="absolute inset-0 bg-white/10 rounded-lg" />
          </div>
        </div>
      )}

      {/* Updating budget pill */}
      {isLoading && (
        <div
          className="absolute top-3 right-3 z-50 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm"
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-3 animate-spin" />
          Updating budget...
        </div>
      )}

      {/* Edit pill button */}
      {!isLoading && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-3 right-3 z-40 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm hover:shadow-md hover:bg-white/90 transition-all cursor-pointer"
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <LucidePencil className="size-3" />
          Edit
        </button>
      )}

      {/* Content */}
      <div
        className={`relative z-30 transition-opacity duration-200 ${
          isLoading ? "opacity-85 pointer-events-none" : "opacity-100"
        }`}
      >
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-2xl font-medium tracking-tight gradient-title">
            Monthly Budget (Default Account)
          </CardTitle>

          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <>
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-80"
                  placeholder="Enter new amount"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <CheckSquareIcon className="size-4 text-green-700 mr-1" /> Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <XIcon className="size-4 text-red-700 mr-1" /> Cancel
                </Button>
              </>
            ) : (
              <CardDescription className="text-sm font-medium">
                {initialBudget
                  ? `₹${currentExpenses.toFixed(2)} / ₹${initialBudget.amount.toFixed(
                      2
                    )}`
                  : "No budget set"}
              </CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* 👇 Animate presence for progress bar */}
          <AnimatePresence mode="wait">
            {!isEditing && initialBudget && (
              <motion.div
                key="progress-bar"
                initial={{ opacity: 0, scaleY: 0.8, y: 10 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.8, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-2 origin-top"
              >
                <Progress
                  value={percentageUsed}
                  extraStyles={`${
                    percentageUsed >= 90
                      ? "bg-red-700"
                      : percentageUsed >= 75
                      ? "bg-yellow-600"
                      : "bg-green-700"
                  }`}
                />
                <p className="text-xs text-muted-foreground text-right">{percentageUsed.toFixed(2)}% used</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </div>
    </Card>
  );
};

export default BudgetProgress;
