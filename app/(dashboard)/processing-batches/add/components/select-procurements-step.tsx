"use client";

import { useEffect, useState, useMemo } from "react";
import {
  useProcessingBatchFormStore,
  type ProcurementWithFarmerForStore,
} from "@/app/stores/processing-batch-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getUnbatchedProcurementsAction } from "@/app/(dashboard)/procurements/lib/actions";
import { AxiosError } from "axios";

interface DisplayProcurement extends ProcurementWithFarmerForStore {
  isSelectableBasedOnLock: boolean;
  matchesSearchTerm: boolean;
}

export function SelectProcurementsStep() {
  const {
    initialCrop,
    initialLotNo,
    availableProcurements,
    selectedProcurementIds,
    setAvailableProcurements,
    toggleSelectedProcurement,
    lockedCrop,
    lockedLotNo,
    lockedProcuredForm,
    filterCriteriaLocked,
  } = useProcessingBatchFormStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProcurements = async () => {
      setIsLoading(true);
      try {
        const params: { crop?: string; lotNo?: string } = {};
        if (initialCrop) params.crop = initialCrop;
        if (initialLotNo) params.lotNo = initialLotNo.toString();

        const procurementsData = await getUnbatchedProcurementsAction(params);
        setAvailableProcurements(procurementsData);
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Error fetching unbatched procurements:", error);
          toast.error("Failed to load unbatched Procurements", {
            description: error.response?.data?.error || error.message,
          });
        } else {
          console.error("Error fetching unbatched procurements:", error);
          toast.error("Failed to load unbatched Procurements");
        }
        setAvailableProcurements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcurements();
  }, [initialCrop, initialLotNo, setAvailableProcurements]);

  const displayListItems = useMemo((): DisplayProcurement[] => {
    const lowerSearchTerm = searchTerm.trim().toLowerCase();

    return availableProcurements.map((p: ProcurementWithFarmerForStore) => {
      let isSelectableBasedOnLock = true;
      if (filterCriteriaLocked) {
        if (lockedCrop && p.crop !== lockedCrop)
          isSelectableBasedOnLock = false;
        if (lockedLotNo && p.lotNo !== lockedLotNo)
          isSelectableBasedOnLock = false;
        if (lockedProcuredForm && p.procuredForm !== lockedProcuredForm)
          isSelectableBasedOnLock = false;
      }

      let matchesSearchTerm = true;
      if (lowerSearchTerm) {
        matchesSearchTerm =
          p.farmer.name.toLowerCase().includes(lowerSearchTerm) ||
          p.procurementNumber.toLowerCase().includes(lowerSearchTerm) ||
          p.id.toString().includes(lowerSearchTerm) ||
          p.crop.toLowerCase().includes(lowerSearchTerm) ||
          p.procuredForm.toLowerCase().includes(lowerSearchTerm);
      }
      return { ...p, isSelectableBasedOnLock, matchesSearchTerm };
    });
  }, [
    availableProcurements,
    searchTerm,
    filterCriteriaLocked,
    lockedCrop,
    lockedLotNo,
    lockedProcuredForm,
  ]);

  const itemsToRender = useMemo(() => {
    return displayListItems.filter(
      (item) =>
        selectedProcurementIds.includes(item.id) ||
        (item.isSelectableBasedOnLock && item.matchesSearchTerm),
    );
  }, [displayListItems, selectedProcurementIds]);

  const totalSelectedQuantity = useMemo(() => {
    return availableProcurements
      .filter((p) => selectedProcurementIds.includes(p.id))
      .reduce((sum, p) => sum + p.quantity, 0);
  }, [availableProcurements, selectedProcurementIds]);

  const handleToggleSelection = (
    procurement: ProcurementWithFarmerForStore,
  ) => {
    toggleSelectedProcurement(procurement);
  };

  const getDescription = () => {
    if (filterCriteriaLocked) {
      return `Select procurements for batch: Crop: ${lockedCrop}, Lot: ${lockedLotNo}, Form: ${lockedProcuredForm}.`;
    }
    if (initialCrop || initialLotNo) {
      return `Showing initial procurements for: ${initialCrop || "Any Crop"}, Lot: ${initialLotNo || "Any Lot"}. First selection will lock full criteria.`;
    }
    return `Select your first procurement to set the Crop, Lot No, and Procured Form for this batch.`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Select Procurements</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
        {filterCriteriaLocked && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">Crop: {lockedCrop}</Badge>
            <Badge variant="secondary">Lot: {lockedLotNo}</Badge>
            <Badge variant="secondary">Form: {lockedProcuredForm}</Badge>
          </div>
        )}
        {totalSelectedQuantity > 0 && (
          <p className="text-sm font-medium mt-2">
            Total Selected Quantity: {totalSelectedQuantity.toFixed(2)} kg
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Filter list by Farmer, Proc. No., etc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isLoading && (
          <p className="text-center py-4">Loading procurements...</p>
        )}
        {!isLoading && itemsToRender.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No unbatched procurements found matching the criteria.
          </p>
        )}
        {!isLoading && itemsToRender.length > 0 && (
          <ScrollArea className="h-[300px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead>Proc. No.</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Proc. Form</TableHead>
                  <TableHead>Lot No.</TableHead>
                  <TableHead>Qty (kg)</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsToRender.map((proc) => {
                  const isChecked = selectedProcurementIds.includes(proc.id);
                  const isDisabledForSelection =
                    filterCriteriaLocked &&
                    !proc.isSelectableBasedOnLock &&
                    !isChecked;

                  return (
                    <TableRow
                      key={proc.id}
                      data-state={isChecked && "selected"}
                      className={isDisabledForSelection ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          id={`proc-${proc.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleToggleSelection(proc)}
                          disabled={isDisabledForSelection}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {proc.procurementNumber}
                      </TableCell>
                      <TableCell>{proc.farmer.name}</TableCell>
                      <TableCell>{proc.crop}</TableCell>
                      <TableCell>{proc.procuredForm}</TableCell>
                      <TableCell>{proc.lotNo}</TableCell>
                      <TableCell className="text-right">
                        {proc.quantity.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(proc.date), "dd/MM/yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
