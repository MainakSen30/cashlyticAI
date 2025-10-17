import { getAccountWithTransactions } from '@/actions/accounts'
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react'
import TransactionTable from '../_components/transaction-table';
import { BarLoader } from 'react-spinners';
import AccountChart from '../_components/account-chart';

const AccountsPage = async({ params }) => {
  const { id } = await params;
  const accountData = await getAccountWithTransactions(id);
  if(!accountData) {
    notFound();
  }
  const { transactions, ...account } = accountData;
  return (
    <div className='space-y-8 px-5'>
      {/* Account Header */}
      <div className='flex items-end justify-between'>
        <div>
          <h1 className='text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize'>
            { account.name }
          </h1>
          <p className='font-bold text-muted-foreground'>
            { account.type.charAt(0) + account.type.slice(1).toLowerCase() } Account
          </p>
        </div>
        <div className='text-right'>
          <div className='text-2xl sm:text-3xl font-black'>
            ₹{ parseFloat(account.balance).toFixed(2) }
          </div>
          <p className='font-bold text-muted-foreground'>{ account._count.transactions } Transactions</p>
        </div>
      </div>
      
      {/* Chart Section */}
      <Suspense
        fallback={ <BarLoader className='mt-4' width={"100%"} color='#036c5f'/> }
      >
        <AccountChart transactions={ transactions }/>
      </Suspense>

      {/* Transactions Table */}
      <Suspense
        fallback={ <BarLoader className='mt-4' width={"100%"} color='#036c5f'/> }
      >
        <TransactionTable transactions={ transactions }/>
      </Suspense>
    </div>
  )
}

export default AccountsPage;