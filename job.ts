abstract class Job {
  abstract handle(): Promise<void>;
}

export { Job };
