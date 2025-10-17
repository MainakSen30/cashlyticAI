"use client";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  endOfDay, 
  format, 
  startOfDay, 
  subDays 
} from 'date-fns';
import React, { useMemo, useState } from 'react'
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis } from 'recharts';

const DATE_RANGES = {
  "7D": {
    label: "Last 7 days",
    days: 7,
  },
  "1M": {
    label: "Last 1 month",
    days: 30,
  },
  "3M": {
    label: "Last 3 months",
    days: 90,
  },
  "6M": {
    label: "Last 6 months",
    days: 180,
  },
  ALL: {
    label: "All Time",
    days: null,
  },
};

const AccountChart = ({ transactions }) => {
  const [ dateRange, setDateRange ] = useState("1M");
  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days ? startOfDay(subDays(now, range.days)) : startOfDay(new Date(0));
    const filtered = transactions.filter((t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now));
    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");
      if(!acc[date]) {
        acc[date] = {
          date,
          income: 0,
          expense: 0,
        }
      }
      if(transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [ transactions, dateRange ]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, day) => ({
      income: acc.income + day.income, 
      expense: acc.expense + day.expense
    }), { income: 0, expense: 0 });
  }, [filteredData]);

  return (
    <Card className='border-2 rounded-2xl shadow-md'>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-2xl sm:text-4xl font-black tracking-tight gradient-title">Transaction Overview</CardTitle>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([ key, { label } ]) => {
              return <SelectItem key={ key } value={ key }>
                { label }
              </SelectItem>
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="container mx-auto border-2 rounded-full p-4 flex justify-between gap-4 shadow-md">
          <div className="container border-2 rounded-4xl p-4 flex flex-row gap-2">
            <p className="font-bold">Total Income: </p>
            <p className="font-bold text-green-700">₹{ totals.income.toFixed(2) }</p>
          </div>
          <div className="container border-2 rounded-4xl p-4 flex flex-row gap-2">
            <p className='font-bold'>Total Expenses: </p>
            <p className='font-bold text-red-700'>₹{ totals.expense.toFixed(2) }</p>
          </div>
          <div className="container border-2 rounded-4xl p-4 flex flex-row gap-2">
            <p className='font-bold'>Net { (totals.income - totals.expense) > 0 ? 'Profit' : 'Loss' }:</p>
            <p className={ `font-bold ${ (totals.income - totals.expense) > 0 ? 'text-green-700' : 'text-red-700' }` }>₹{ (totals.income - totals.expense).toFixed(2) }</p>
          </div>
        </div>
        
        <div className='container mx-auto border-2 rounded-2xl p-4 h-[300px] mt-5 shadow-md flex items-center justify-center'>
          {filteredData.length === 0 ? (
            <p className="text-gray-500 text-lg font-semibold">
              No data available for the selected range
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false} 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip formatter={(value) => [ `₹${value}`, undefined ]} />
                <Legend />
                <Bar 
                  dataKey="income"
                  name="Income" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expense" 
                  name="Expense" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </CardContent>
    </Card>
  );
}

export default AccountChart;