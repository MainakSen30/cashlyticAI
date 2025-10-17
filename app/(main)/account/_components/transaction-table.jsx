"use client";

import { bulkDeleteTransactions } from '@/actions/accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,  
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { categoryColors } from '@/data/categories';
import useFetch from '@/hooks/use-fetch';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Clock, MoreHorizontal, RefreshCcw, Search, TrashIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react'
import { BarLoader } from 'react-spinners';
import { toast } from 'sonner';

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
}

const TransactionTable = ({ transactions }) => {
  const router = useRouter();
  const [ selectedIds, setSelectedIds ]= useState([]);
  const [ sortConfig, setSortConfig ]= useState({
    field: "date",
    direction: "desc",
  });

  const [ searchTerm, setSearchTerm ] = useState("");
  const [ typeFilter, setTypeFiler ] = useState("");
  const [ recurringFilter,setRecurringFilter ] = useState("");

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);
  
  // Animation states
  const [ showDeleteButton, setShowDeleteButton ] = useState(false);
  const [ showClearButton, setShowClearButton ] = useState(false);
  const [ deleteButtonAnimating, setDeleteButtonAnimating ] = useState(false);
  const [ clearButtonAnimating, setClearButtonAnimating ] = useState(false);
  
  // Dynamic header width sync
  const [ colWidths, setColWidths ] = useState([]);
  const fallbackColWidths = ['48px','200px','auto','160px','120px','120px','56px'];
  const headerWidths = colWidths.length ? colWidths : fallbackColWidths;
  const bodyScrollRef = useRef(null);
  const headerTableRef = useRef(null);
  const [ headerTableWidth, setHeaderTableWidth ] = useState(undefined);

  const measureAndSyncHeader = () => {
    try {
      const container = bodyScrollRef.current;
      if (!container) return;
      const clientWidth = container.clientWidth;
      if (clientWidth && clientWidth !== headerTableWidth) {
        setHeaderTableWidth(clientWidth);
      }
      const firstRow = container.querySelector('tbody tr');
      if (!firstRow) return;
      const cells = Array.from(firstRow.children);
      if (!cells.length) return;
      const widths = cells.map((cell) => `${cell.getBoundingClientRect().width}px`);
      setColWidths(widths);
    } catch (_) {}
  };

  useLayoutEffect(() => {
    measureAndSyncHeader();
    const onResize = () => measureAndSyncHeader();
    window.addEventListener('resize', onResize);
    let ro;
    if (typeof ResizeObserver !== 'undefined' && bodyScrollRef.current) {
      ro = new ResizeObserver(() => measureAndSyncHeader());
      ro.observe(bodyScrollRef.current);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      if (ro && bodyScrollRef.current) ro.disconnect();
    };
  }, [transactions, sortConfig, searchTerm, typeFilter, recurringFilter]);
  
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];
    if(searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) => 
        transaction.description?.toLowerCase().includes(searchLower)
      )
    }
    if(recurringFilter) {
      result = result.filter((transaction) => {
        if(recurringFilter === 'recurring') return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }
    if (typeFilter) {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default: comparison = 0;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    })
    return result;
  }, [
    transactions,
    searchTerm,
    typeFilter, 
    recurringFilter,
    sortConfig,
  ])

  const handleSort = (field) => {
    setSortConfig(current => ({
      field,
      direction: current.field == field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelect = (id) => {
    setSelectedIds((current) => 
      current.includes(id) ? current.filter((item) => item != id) : [...current, id]
    );
  }

  const handleSelectAll = () => {
    setSelectedIds((current) => 
      current.length === filteredAndSortedTransactions.length ?
      [] :
      filteredAndSortedTransactions.map((t) => t.id)
    );
  }

  const handleBulkDelete = async() => {
    if(!window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions? `)) {
      return;
    }
    const res = await deleteFn(selectedIds);
    if(!res?.success){
      toast.error(res?.error || 'Failed to delete transactions');
      return;
    }
  }

  useEffect(() => {
    if(deleted?.success && !deleteLoading) {
      toast.success("Transactions deleted successfully!");
      setSelectedIds([]);
      try { router.refresh?.(); } catch (_) {}
    }
  }, [ deleted, deleteLoading ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFiler("");
    setRecurringFilter("");
    setSelectedIds([]);
  }

  // Animations for buttons
  useEffect(() => {
    if (selectedIds.length > 0) {
      setShowDeleteButton(true);
    } else if (showDeleteButton) {
      setDeleteButtonAnimating(true);
      setTimeout(() => {
        setShowDeleteButton(false);
        setDeleteButtonAnimating(false);
      }, 160);
    }
  }, [selectedIds.length, showDeleteButton]);

  useEffect(() => {
    const hasFilters = searchTerm || typeFilter || recurringFilter;
    if (hasFilters) {
      setShowClearButton(true);
    } else if (showClearButton) {
      setClearButtonAnimating(true);
      setTimeout(() => {
        setShowClearButton(false);
        setClearButtonAnimating(false);
      }, 160);
    }
  }, [searchTerm, typeFilter, recurringFilter, showClearButton]);

  return (
    <div className='space-y-4'>
      { deleteLoading && (
        <BarLoader className='mt-4' width={'100%'} color='#036c5f' />
      )}
      
      {/* Filters */}
      <div className='container mx-auto border-2 p-4 rounded-4xl shadow-md flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-2 top-2.5 size-4 text-muted-foreground'/>
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
            className='pl-8 rounded-4xl'
          />
        </div>
        <div className='flex gap-2'>
          <Select value={typeFilter} onValueChange={setTypeFiler}>
            <SelectTrigger className="w-[180px] rounded-4xl">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME" >Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
  
          <Select 
            value={recurringFilter} 
            onValueChange={(value) => setRecurringFilter(value)}
          >
            <SelectTrigger className="w-[180px] rounded-4xl">
              <SelectValue placeholder="All transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring only</SelectItem>
              <SelectItem value="non-recurring">Non-recurring only</SelectItem>
            </SelectContent>
          </Select>

          {showDeleteButton && (
            <div className={`flex items-center gap-2 ${deleteButtonAnimating ? 'fade-out-down' : 'fade-in-up'}`}>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={deleteLoading} className='rounded-4xl'>
                <TrashIcon className='size-4 mr-1' />Delete Selected ({selectedIds.length})
              </Button>
            </div>
          )}

          {showClearButton && (
            <Button 
              variant ='destructive'
              onClick={handleClearFilters}
              title='Clear Filters'  
              className={clearButtonAnimating ? 'fade-out-down' : 'fade-in-up'}
            >
              <X className='size-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className='rounded-2xl border-2 shadow-md'>
        {/* Smoothly animated header */}
        <div 
          className={
            `transition-all duration-300 overflow-hidden ${filteredAndSortedTransactions.length === 0 ? "max-h-0 opacity-0" : "max-h-[200px] opacity-100"}`}
        >
          <Table 
            ref={headerTableRef} 
            style={{ width: headerTableWidth ? `${headerTableWidth}px` : '100%' }}
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" style={{ width: headerWidths[0] }}>
                  <Checkbox
                    onCheckedChange={handleSelectAll}
                    checked={
                      selectedIds.length === filteredAndSortedTransactions.length &&
                      filteredAndSortedTransactions.length > 0
                    } 
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  style={{ width: headerWidths[1] }}
                  onClick={() => handleSort("date")}
                >
                  <div className='flex items-center font-black'>
                    <Badge className="px-2 py-1 text-xs font-bold">
                      Date {sortConfig.field === 'date' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className='ml-1 size-4'/> : <ChevronDown className='ml-1 size-4'/>
                      )}
                    </Badge>
                  </div>
                </TableHead>
                <TableHead className='font-black' style={{ width: headerWidths[2] }}>
                  <div className='flex items-center font-black'>
                    <Badge className="px-2 py-1 text-xs font-bold">Description</Badge>
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  style={{ width: headerWidths[3] }}
                  onClick={() => handleSort("category")}
                >
                  <div className='flex items-center font-black'>
                    <Badge className="px-2 py-1 text-xs font-bold">
                      Category {sortConfig.field === 'category' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className='ml-1 size-4'/> : <ChevronDown className='ml-1 size-4'/>
                      )}
                    </Badge>
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  style={{ width: headerWidths[4] }}
                  onClick={() => handleSort("amount")}
                >
                  <div className='flex items-center justify-end font-black'>
                    <Badge className="px-2 py-1 text-xs font-bold">
                      Amount {sortConfig.field === 'amount' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className='ml-1 size-4'/> : <ChevronDown className='ml-1 size-4'/>
                      )}
                    </Badge>
                  </div>
                </TableHead>
                <TableHead className='font-black' style={{ width: headerWidths[5] }}>
                  <div className='flex items-center font-black'>
                    <Badge className="px-2 py-1 text-xs font-bold ">Recurring</Badge>
                  </div>
                </TableHead>
                <TableHead className="w-[50px]" style={{ width: headerWidths[6] }} />
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        {/* Scrollable body table */}
        <div 
          ref={bodyScrollRef} 
          className='overflow-y-auto' 
          style={{ 
            maxHeight: '520px', 
            scrollbarGutter: 'stable' 
          }}>
          <Table style={{ width: '100%' }}>
            <TableBody>
              {filteredAndSortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Checkbox 
                        onCheckedChange={() => handleSelect(transaction.id)}
                        checked={selectedIds.includes(transaction.id)}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(transaction.date),"PPP")}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="capitalize">
                      <span
                        style={{
                          background: categoryColors[transaction.category],
                        }}
                        className='px-2 py-1 rounded-xl text-white text-sm'
                      >
                        {transaction.category}
                      </span>
                    </TableCell>
                    <TableCell 
                      className="text-right font-medium"
                      style={{
                        color: transaction.type === "INCOME" ? "green" : "red",
                      }}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      ₹{transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="px-2 py-1 text-xs font-medium gap-1 bg-teal-100 text-teal-700 hover:bg-teal-200">
                              <RefreshCcw className='size-3'/>
                              {RECURRING_INTERVALS[transaction.recurringInterval]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className='space-y-1 text-sm'>
                              <div className='font-medium'>Next Occurence:</div>
                              <div className='font-bold'>{format(new Date(transaction.nextRecurringDate), "PPP")}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="px-2 py-1 text-xs font-medium text-muted-foreground">
                        <Clock className='size-3'/>
                        One-Time
                      </Badge>
                    )}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="size-8 p-0">
                            <MoreHorizontal className='size-4'/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => 
                              router.push(`/transaction/create?edit=${transaction.id}`)
                            }
                          >Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteFn([transaction.id])}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default TransactionTable;