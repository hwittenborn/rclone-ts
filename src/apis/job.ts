import { z } from "zod";
import { Transport } from "../transport";
import { JsonObjectSchema, JsonObject } from "../types";

export const JobListSchema = z.object({
  executeId: z.string().optional(),
  jobids: z.array(z.number()),
  runningIds: z.array(z.number()).optional(),
  finishedIds: z.array(z.number()).optional(),
});

export type JobListResponse = z.infer<typeof JobListSchema>;

export const JobStatusSchema = z.object({
  id: z.number(),
  duration: z.number(),
  startTime: z.string(),
  endTime: z.string().optional(),
  error: z.string(),
  finished: z.boolean(),
  success: z.boolean(),
  output: JsonObjectSchema.nullable().optional(),
  progress: JsonObjectSchema.optional(),
});

export type JobStatusResponse = z.infer<typeof JobStatusSchema>;

const JobBatchResultSchema = z.union([
  JsonObjectSchema,
  z.object({
    error: z.string(),
    input: JsonObjectSchema.optional(),
    path: z.string().optional(),
    status: z.number().optional(),
  }),
]);

const JobBatchResponseSchema = z.object({
  results: z.array(JobBatchResultSchema),
});

export type JobBatchResult = z.infer<typeof JobBatchResultSchema>;
export type JobBatchResponse = z.infer<typeof JobBatchResponseSchema>;

export class Job {
  constructor(private transport: Transport) {}

  public async batch(
    concurrency: number | undefined,
    inputs: JsonObject[],
  ): Promise<JobBatchResponse> {
    const data = await this.transport.post("job/batch", { concurrency, inputs });
    return JobBatchResponseSchema.parse(data);
  }

  public async list(): Promise<JobListResponse> {
    const data = await this.transport.post("job/list");
    return JobListSchema.parse(data);
  }

  public async status(jobid: number): Promise<JobStatusResponse> {
    const data = await this.transport.post("job/status", { jobid });
    return JobStatusSchema.parse(data);
  }

  public async stop(jobid: number): Promise<void> {
    await this.transport.post("job/stop", { jobid });
  }

  public async stopGroup(group: string): Promise<void> {
    await this.transport.post("job/stopgroup", { group });
  }
}
