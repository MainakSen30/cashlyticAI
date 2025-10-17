"use client";

import { updateDefaultAccount } from '@/actions/accounts';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useFetch from '@/hooks/use-fetch';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Loader2 
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react'
import { toast } from 'sonner';

const AccountCard = ({ account }) => {
  const { 
    name, 
    type, 
    balance, 
    id, 
    isDefault, 
  } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultfn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async(event) => {
    event.preventDefault();
    if(isDefault) {
      toast.warning("You need at least one default account");
      return;
    }
    await updateDefaultfn(id);
  }

  useEffect(() => {
    if(updatedAccount?.success) {
      toast.success("Default account has been updated successfully");
    }
  }, [ updatedAccount, updateDefaultLoading ]);

  useEffect(() => {
    if(error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [ error ]);

  return (
    <Card className='hover:shadow-2xl transition-shadow group relative'>
      {updateDefaultLoading && (
        <div className='absolute inset-0 z-10 rounded-lg bg-background/70 backdrop-blur-sm flex items-start justify-end p-3'>
          <div className='inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground'>
            <Loader2 className='size-3 animate-spin' />
            Updating default...
          </div>
        </div>
      )}
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className='text-lg font-bold'>{ name }</CardTitle>
          <Switch 
            checked={ isDefault }
            onClick={ handleDefaultChange }
            disabled={ updateDefaultLoading }
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold py-2">
            ₹{parseFloat(balance).toFixed(2)}
          </div>
          <p className='text-sm text-muted-foreground'>
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className='flex items-center py-2'>
            <ArrowUpRight className='mr-1 size-4 text-green-500'/>
            Income
          </div>
          <div className='flex items-center'>
            <ArrowDownRight className='mr-1 size-4 text-red-500'/>
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  )
}

export default AccountCard;