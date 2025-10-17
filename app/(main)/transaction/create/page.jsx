import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import React from 'react'
import AddTransactionForm from '../_components/add-transactions-form';
import { getTransaction } from '@/actions/transaction';

const AddTransactionPage = async ({ searchParams }) => {
  const params = await searchParams;
  const accounts = await getUserAccounts();
  const editId = params?.edit;

  let initialData = null;
  if(editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-5">
      <h1 className="text-5xl tracking-tight gradient-title mb-5">{editId ? "Edit" : "Add"} Transaction</h1>
      <AddTransactionForm 
        accounts={accounts} 
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  )
}

export default AddTransactionPage;