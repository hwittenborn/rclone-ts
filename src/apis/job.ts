import { z } from "zod";
import { Transport } from "../transport";

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
  output: z.record(z.string(), z.any()).nullable().optional(),
  progress: z.any().optional(),
});

export type JobStatusResponse = z.infer<typeof JobStatusSchema>;

export class Job {
  constructor(private transport: Transport) {}

  public async batch(concurrency: number | undefined, inputs: any[]): Promise<any[]> {
    const data = await this.transport.post("job/batch", { concurrency, inputs });
    return data as any[];
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
