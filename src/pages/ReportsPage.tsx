import { useState, useEffect } from "react";
import { Transaction } from "@/lib/types";
import { transactionAPI } from "@/lib/api";
import { Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await transactionAPI.getAll();
        // Handle both array and paginated response
        const transactions = Array.isArray(data) ? data : data.results || [];
        setTransactions(transactions);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const transDate = t.date.slice(0, 7);
    return transDate === filterMonth && t.status !== "deleted";
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Group transactions by date for journal
  const journalEntries = filteredTransactions
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t, idx) => ({
      ...t,
      debit: t.type === "income" ? 0 : t.amount,
      credit: t.type === "income" ? t.amount : 0,
    }));

  // Calculate running balance for trial balance
  const trialBalance: { [key: string]: { debit: number; credit: number } } = {};

  journalEntries.forEach((entry) => {
    const category = entry.category;
    if (!trialBalance[category]) {
      trialBalance[category] = { debit: 0, credit: 0 };
    }
    trialBalance[category].debit += entry.debit;
    trialBalance[category].credit += entry.credit;
  });

  const trialBalanceEntries = Object.entries(trialBalance).map(([category, amounts]) => ({
    category,
    ...amounts,
  }));

  const fmt = (n: number | undefined) => {
    if (n === undefined || n === null) return "₹0";
    return "₹" + Math.abs(Number(n)).toLocaleString("en-IN");
  };

  const exportToCSV = (type: "journal" | "trialBalance") => {
    let csv = "";

    if (type === "journal") {
      csv = "Journal Entries Report\n";
      csv += `Report Period: ${filterMonth}\n\n`;
      csv += "Date,Reference,Description,Category,Debit (₹),Credit (₹)\n";

      journalEntries.forEach((entry) => {
        csv += `${entry.date},"${entry.reference || ""}", "${entry.description}","${entry.category}",${entry.debit.toLocaleString("en-IN")},${entry.credit.toLocaleString("en-IN")}\n`;
      });

      csv += `\n\nTotal Income,,,,"${totalIncome.toLocaleString("en-IN")}",\n`;
      csv += `Total Expense,,,,"${totalExpense.toLocaleString("en-IN")}",\n`;
      csv += `Net Profit/Loss,,,,"${netProfit.toLocaleString("en-IN")}",\n`;
    } else {
      csv = "Trial Balance Report\n";
      csv += `Report Period: ${filterMonth}\n\n`;
      csv += "Account / Category,Debit (₹),Credit (₹)\n";

      trialBalanceEntries.forEach((entry) => {
        csv += `"${entry.category}",${entry.debit.toLocaleString("en-IN")},${entry.credit.toLocaleString("en-IN")}\n`;
      });

      const totalDebit = trialBalanceEntries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = trialBalanceEntries.reduce((sum, e) => sum + e.credit, 0);

      csv += `\nTotal,${totalDebit.toLocaleString("en-IN")},${totalCredit.toLocaleString("en-IN")}\n`;
    }

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute(
      "download",
      `${type === "journal" ? "journal" : "trial-balance"}_${filterMonth}.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">
            Journal entries, trial balance, and financial analysis
          </p>
        </div>
      </div>

      <div className="flex gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Filter by Month</label>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStr = date.toISOString().slice(0, 7);
                const monthName = date.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {monthName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading reports...</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Total Income</p>
            <p className="text-2xl font-bold text-success">{fmt(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">{fmt(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Net Profit/Loss</p>
            <p
              className={`text-2xl font-bold ${
                netProfit >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {netProfit >= 0 ? "+" : ""}{fmt(netProfit)}
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Journal Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Journal Entries</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportToCSV("journal")}
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="data-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-right">Debit (₹)</TableHead>
                  <TableHead className="text-xs text-right">Credit (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-4">
                      No transactions for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {journalEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs">{entry.date}</TableCell>
                        <TableCell className="text-xs font-mono">
                          {entry.reference || "—"}
                        </TableCell>
                        <TableCell className="text-xs">{entry.description}</TableCell>
                        <TableCell className="text-xs">{entry.category}</TableCell>
                        <TableCell className="text-xs text-right">
                          {entry.debit > 0 ? fmt(entry.debit) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {entry.credit > 0 ? fmt(entry.credit) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-secondary/50 font-bold">
                      <TableCell colSpan={4} className="text-xs text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {fmt(totalExpense)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {fmt(totalIncome)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trial Balance</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportToCSV("trialBalance")}
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="data-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Account / Category</TableHead>
                  <TableHead className="text-xs text-right">Debit (₹)</TableHead>
                  <TableHead className="text-xs text-right">Credit (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalanceEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">
                      No data for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {trialBalanceEntries.map((entry) => (
                      <TableRow key={entry.category}>
                        <TableCell className="text-xs font-medium">
                          {entry.category}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {entry.debit > 0 ? fmt(entry.debit) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {entry.credit > 0 ? fmt(entry.credit) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-secondary/50 font-bold">
                      <TableCell className="text-xs text-right">Total</TableCell>
                      <TableCell className="text-xs text-right">
                        {fmt(
                          trialBalanceEntries.reduce((sum, e) => sum + e.debit, 0)
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {fmt(
                          trialBalanceEntries.reduce((sum, e) => sum + e.credit, 0)
                        )}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
