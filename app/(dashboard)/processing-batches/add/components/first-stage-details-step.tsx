"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProcessingBatchFormStore } from "@/app/stores/processing-batch-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect } from "react";

const firstStageFormStepSchema = z.object({
  processMethod: z.enum(["wet", "dry"], {
    required_error: "Process method is required",
  }),
  dateOfProcessing: z.date({
    required_error: "Date of Processing is required",
    invalid_type_error: "That's not a valid date!",
  }),
  doneBy: z.string().min(1, "Person responsible for P1 is required"),
});

type FirstStageFormValues = z.infer<typeof firstStageFormStepSchema>;

export function FirstStageDetailsStep() {
  const {
    firstStageDetails,
    setFirstStageDetails,
    form: zustandForm,
    setForm,
  } = useProcessingBatchFormStore();

  const getDateOfProcessing = (date: Date | string | null | undefined) => {
    if (date instanceof Date) return date;
    if (date) return new Date(date as string);
    return new Date();
  };

  const form = useForm<FirstStageFormValues>({
    resolver: zodResolver(firstStageFormStepSchema),
    defaultValues: {
      processMethod: firstStageDetails.processMethod || "wet",
      dateOfProcessing: getDateOfProcessing(firstStageDetails.dateOfProcessing),
      doneBy: firstStageDetails.doneBy || "",
    },
  });

  useEffect(() => {
    if (zustandForm !== form) {
      setForm(form);
    }
    const zustandDate = firstStageDetails.dateOfProcessing;
    form.reset({
      processMethod: firstStageDetails.processMethod || "wet",
      dateOfProcessing: getDateOfProcessing(zustandDate),
      doneBy: firstStageDetails.doneBy || "",
    });
  }, [firstStageDetails, form, zustandForm, setForm]);

  const handleValueChangeAndSyncToZustand = () => {
    const values = form.getValues();
    setFirstStageDetails(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: First Processing Stage (P1) Details</CardTitle>
        <CardDescription>
          Enter the details for the initial processing stage of this batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onChange={handleValueChangeAndSyncToZustand}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="processMethod"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="processMethod">Process Method</Label>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="processMethod">
                        <SelectValue placeholder="Select process method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wet">Wet</SelectItem>
                      <SelectItem value="dry">Dry</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfProcessing"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Label htmlFor="dateOfProcessing">
                    Date of Processing (P1)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          id="dateOfProcessing"
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doneBy"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="doneBy">
                    Done By (Responsible Person/Team)
                  </Label>
                  <FormControl>
                    <Input
                      id="doneBy"
                      placeholder="Enter name or team"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
