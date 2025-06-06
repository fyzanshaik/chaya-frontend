"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnFiltersState,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { batchColumns, defaultVisibleBatchColumns } from "../lib/columns-batch";
import type { ProcessingBatchWithSummary } from "../lib/types";
import { useProcessingBatchCache } from "../context/processing-batch-cache-context";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  RefreshCw,
  Eye,
  Wind,
  CheckSquare,
  ShoppingCart,
  Layers,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { useAuth } from "@/app/providers/auth-provider";
import { ColumnFilter } from "./column-filter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { BatchDetailsDialog } from "./dialogs/batch-details-dialog";
import { AddDryingDialog } from "./dialogs/add-drying-dialog";
import { FinalizeStageDialog } from "./dialogs/finalize-stage-dialog";
import { StartNextStageDialog } from "./dialogs/start-next-stage-dialog";
import { RecordSaleDialog } from "./dialogs/record-sale-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface ProcessingBatchesTableProps {
  query: string;
  currentPage: number;
  statusFilter: string;
}

export default function ProcessingBatchesTable({
  query,
  currentPage,
  statusFilter,
}: ProcessingBatchesTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const {
    fetchProcessingBatchesSummary,
    refreshCurrentPageSummary,
    clearBatchDetailCache,
  } = useProcessingBatchCache();

  const [records, setRecords] = useState<ProcessingBatchWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility: Record<string, boolean> = {};
    defaultVisibleBatchColumns.forEach((colId) => {
      initialVisibility[colId] = true;
    });
    batchColumns.forEach((col) => {
      if (
        col.id &&
        initialVisibility[col.id] === undefined &&
        col.enableHiding !== false
      ) {
        initialVisibility[col.id] = true;
      }
    });
    return initialVisibility;
  });

  const [selectedBatchForAction, setSelectedBatchForAction] =
    useState<ProcessingBatchWithSummary | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddDryingDialog, setShowAddDryingDialog] = useState(false);
  const [showFinalizeStageDialog, setShowFinalizeStageDialog] = useState(false);
  const [showStartNextStageDialog, setShowStartNextStageDialog] =
    useState(false);
  const [showRecordSaleDialog, setShowRecordSaleDialog] = useState(false);
  const [showDeleteBatchDialog, setShowDeleteBatchDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(
    async (page: number, q: string, status: string) => {
      setLoading(true);
      try {
        const data = await fetchProcessingBatchesSummary(page, q, status);
        setRecords(data);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error loading batches:", error);
          toast.error(`Failed to load processing batches: ${error.message}`);
        } else {
          toast.error("Failed to load processing batches.");
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchProcessingBatchesSummary]
  );

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const freshData = await refreshCurrentPageSummary(
        currentPage,
        query,
        statusFilter
      );
      setRecords(freshData);
      toast.success("Data refreshed successfully");
      if (selectedBatchForAction) {
        clearBatchDetailCache(selectedBatchForAction.id);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error refreshing data:", error);
        toast.error(`Failed to refresh data: ${error.message}`);
      } else {
        toast.error("Failed to refresh data.");
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshing,
    currentPage,
    query,
    statusFilter,
    refreshCurrentPageSummary,
    selectedBatchForAction,
    clearBatchDetailCache,
  ]);

  useEffect(() => {
    fetchData(currentPage, query, statusFilter);
  }, [fetchData, currentPage, query, statusFilter]);

  useEffect(() => {
    const handleDataChange = () => handleRefresh();
    document.addEventListener("processingBatchDataChanged", handleDataChange);
    return () =>
      document.removeEventListener(
        "processingBatchDataChanged",
        handleDataChange
      );
  }, [handleRefresh]);

  const table = useReactTable({
    data: records,
    columns: batchColumns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  const openDialog = (
    dialogSetter: React.Dispatch<React.SetStateAction<boolean>>,
    batch: ProcessingBatchWithSummary
  ) => {
    setSelectedBatchForAction(batch);
    dialogSetter(true);
  };

  const confirmDeleteBatch = async () => {
    if (!selectedBatchForAction) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/processing-batches/${selectedBatchForAction.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to parse error from server" }));
        throw new Error(
          errorData.error ||
            `Failed to delete batch. Status: ${response.status}`
        );
      }

      toast.success(`Batch ${selectedBatchForAction.batchCode} deleted.`);
      setShowDeleteBatchDialog(false);
      handleRefresh();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to delete batch: ${error.message}`);
      } else {
        toast.error("Failed to delete batch an unknown error occurred.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTableSkeleton = () => (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <ScrollArea className="rounded-md border h-[calc(100vh-350px)] w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            <TableRow>
              {batchColumns.map((col, idx) => (
                <TableHead key={`skel-head-${idx}`}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              <TableHead className="sticky right-0 bg-secondary z-10 text-center">
                <Skeleton className="h-4 w-16 mx-auto" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skel-row-${i}`}>
                {batchColumns.map((col, j) => (
                  <TableCell key={`skel-cell-${i}-${j}`}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                <TableCell className="sticky right-0 bg-background z-0 flex items-center justify-center gap-1 py-1.5">
                  <Skeleton className="h-7 w-7" />{" "}
                  <Skeleton className="h-7 w-7" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );

  if (loading && records.length === 0) {
    return renderTableSkeleton();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="h-8"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
        <ColumnFilter table={table} />
      </div>
      <ScrollArea className="rounded-md border h-[calc(100vh-350px)] w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 bg-secondary z-10 text-center">
                  Actions
                </TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const batchSummary = row.original;
                const latestStage = batchSummary.latestStageSummary;
                const canPerformStageActions =
                  latestStage &&
                  latestStage.status !== "SOLD_OUT" &&
                  latestStage.status !== "CANCELLED";

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="sticky right-0 bg-background z-0 flex items-center justify-center gap-1 py-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedBatchForAction(batchSummary);
                          setShowDetailsDialog(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {canPerformStageActions &&
                        latestStage.status === "IN_PROGRESS" && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                openDialog(setShowAddDryingDialog, batchSummary)
                              }
                              title="Add Drying Data"
                            >
                              {" "}
                              <Wind className="h-4 w-4" />{" "}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                openDialog(
                                  setShowFinalizeStageDialog,
                                  batchSummary
                                )
                              }
                              title="Finalize Stage"
                            >
                              {" "}
                              <CheckSquare className="h-4 w-4" />{" "}
                            </Button>
                          </>
                        )}
                      {canPerformStageActions &&
                        latestStage.status === "FINISHED" && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                openDialog(
                                  setShowStartNextStageDialog,
                                  batchSummary
                                )
                              }
                              title="Start Next Stage"
                              disabled={batchSummary.netAvailableQuantity <= 0}
                            >
                              {" "}
                              <Layers className="h-4 w-4" />{" "}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                openDialog(
                                  setShowRecordSaleDialog,
                                  batchSummary
                                )
                              }
                              title="Record Sale"
                              disabled={batchSummary.netAvailableQuantity <= 0}
                            >
                              {" "}
                              <ShoppingCart className="h-4 w-4" />{" "}
                            </Button>
                          </>
                        )}
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() =>
                            openDialog(setShowDeleteBatchDialog, batchSummary)
                          }
                          title="Delete Batch"
                        >
                          {" "}
                          <Trash2 className="h-4 w-4" />{" "}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={batchColumns.length + 1}
                  className="h-24 text-center"
                >
                  No batches found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {selectedBatchForAction && showDetailsDialog && (
        <BatchDetailsDialog
          batchId={selectedBatchForAction.id}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}

      {selectedBatchForAction &&
        selectedBatchForAction.latestStageSummary &&
        showAddDryingDialog && (
          <AddDryingDialog
            processingStageId={selectedBatchForAction.latestStageSummary.id}
            batchCode={selectedBatchForAction.batchCode}
            processingCount={
              selectedBatchForAction.latestStageSummary.processingCount
            }
            stageInitialQuantity={
              selectedBatchForAction.latestStageSummary.initialQuantity
            }
            open={showAddDryingDialog}
            onOpenChange={setShowAddDryingDialog}
            onSuccess={handleRefresh}
          />
        )}
      {selectedBatchForAction &&
        selectedBatchForAction.latestStageSummary &&
        showFinalizeStageDialog && (
          <FinalizeStageDialog
            processingStageId={selectedBatchForAction.latestStageSummary.id}
            batchCode={selectedBatchForAction.batchCode}
            processingCount={
              selectedBatchForAction.latestStageSummary.processingCount
            }
            currentInitialQuantity={
              selectedBatchForAction.latestStageSummary.initialQuantity
            }
            open={showFinalizeStageDialog}
            onOpenChange={setShowFinalizeStageDialog}
            onSuccess={handleRefresh}
          />
        )}
      {selectedBatchForAction &&
        selectedBatchForAction.latestStageSummary &&
        showStartNextStageDialog &&
        selectedBatchForAction.latestStageSummary.status === "FINISHED" && (
          <StartNextStageDialog
            processingBatchId={selectedBatchForAction.id}
            batchCode={selectedBatchForAction.batchCode}
            previousStageId={selectedBatchForAction.latestStageSummary.id}
            previousProcessingCount={
              selectedBatchForAction.latestStageSummary.processingCount
            }
            previousStageYield={selectedBatchForAction.netAvailableQuantity}
            open={showStartNextStageDialog}
            onOpenChange={setShowStartNextStageDialog}
            onSuccess={handleRefresh}
          />
        )}
      {selectedBatchForAction &&
        selectedBatchForAction.latestStageSummary &&
        showRecordSaleDialog &&
        selectedBatchForAction.latestStageSummary.status === "FINISHED" && (
          <RecordSaleDialog
            processingBatchId={selectedBatchForAction.id}
            processingStage={{
              id: selectedBatchForAction.latestStageSummary.id,
              processingCount:
                selectedBatchForAction.latestStageSummary.processingCount,
              quantityAfterProcess:
                selectedBatchForAction.latestStageSummary.quantityAfterProcess,
              status: selectedBatchForAction.latestStageSummary.status,
            }}
            batchCode={selectedBatchForAction.batchCode}
            availableForSaleFromStage={
              selectedBatchForAction.netAvailableQuantity
            }
            open={showRecordSaleDialog}
            onOpenChange={setShowRecordSaleDialog}
            onSuccess={handleRefresh}
          />
        )}

      <AlertDialog
        open={showDeleteBatchDialog}
        onOpenChange={setShowDeleteBatchDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Batch: {selectedBatchForAction?.batchCode}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. All associated data will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDeleteBatch}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Batch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
