"use client";
import React, { useEffect, useState } from 'react';
import { 
  Drawer,  
  DrawerClose,  
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from './ui/drawer';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import { accountSchema } from '@/app/lib/schema';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import useFetch from '@/hooks/use-fetch';
import { createAccount } from '@/actions/dashboard';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CreateAccountDrawer = ({children}) => {
  const [ open, setOpen ] = useState(false);
  const { 
    register, 
    handleSubmit, 
    formState:{ errors }, 
    setValue, 
    watch, 
    reset 
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    }
  });

  const { 
    data: newAccount, 
    error, 
    fn: createAccountFn, 
    loading: createAccountLoading, 
  } = useFetch(createAccount);

  useEffect(() => {
    if(newAccount && !createAccountLoading) {
      toast.success("Account created successfully");
      reset();
      setOpen(false);
    }
  }, [createAccountLoading, newAccount]);

  useEffect(() => {
    if(error) {
      toast.error(error.message || "Failed to create account");
    }
  }, [error]);

  const onSubmit = async(data) => {
    await createAccountFn(data);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Account</DrawerTitle>
        </DrawerHeader>
        <div className='px-4 py-4'>
          <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
            {/* account name */}
            <div className='space-y-2 py-2'>
              <label htmlFor='name' className='block mb-2 text-sm font-semibold text-gray-700'>Account Name</label>
              <Input
                id="name"
                placeholder="e.g., Main Checking"
                {...register("name")}
              />
              {errors.name && (
                <p className='text-sm text-red-500'>{errors.name.message}</p>
              )}
            </div>
            {/* account type */}
            <div className='space-y-2 py-2'>
              <label htmlFor='type' className='block mb-2 text-sm font-semibold text-gray-700'>Account Type</label>
              <Select 
                onValueChange={(value) => setValue("type", value)}
                defaultValue={watch("type")}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">CURRENT</SelectItem>
                  <SelectItem value="SAVINGS">SAVINGS</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className='text-sm text-red-500'>{errors.type.message}</p>
              )}
            </div>
            {/* initial balance */}
            <div className='space-y-2 py-2'>
              <label htmlFor='balance' className='block mb-2 text-sm font-semibold text-gray-700'>Initial Balance</label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("balance")}
              />
              {errors.balance && (
                <p className='text-sm text-red-500'>{errors.balance.message}</p>
              )}
            </div>
            {/* set as default */}
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='space-y-0.5'>
                <label 
                  htmlFor='isDefault' 
                  className='block mb-2 text-sm font-semibold text-gray-700 cursor-pointer'
                >
                  Set   As Default
                </label>
                <p className='text-sm text-gray-400 font-semibold'>This account will be selected as default for transactions</p>
              </div>
              <Switch 
                id="isDefault"
                onCheckedChange={(checked) => setValue("isDefault", checked)}
                checked={watch("isDefault")}
              />
            </div>
            {/* close drawer and save buttons */}
            <div>
              <div className='flex items-center justify-between gap-8 rounded-lg border p-5'>
                <DrawerClose asChild>
                  <Button type="button" variant="destructive" className="flex-1 p-3 gap-3 hover:shadow-lg transition-all duration-300">
                    Cancel
                  </Button>
                </DrawerClose>
                <Button 
                  type="submit" 
                  className="flex-1 p-3 gap-3 hover:shadow-lg transition-all duration-300" 
                  disabled={createAccountLoading}
                >
                  {createAccountLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : ("Create Account")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default CreateAccountDrawer;