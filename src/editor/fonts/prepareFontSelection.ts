/** Keeps preparation out of document history and rejects superseded completions. */
export class FontSelectionRequest {
  private generation = 0;
  cancel(): void {
    this.generation += 1;
  }

  async run(args: {
    prepare: () => Promise<unknown>;
    isCurrent: () => boolean;
    commit: () => void;
  }): Promise<boolean> {
    const generation = ++this.generation;
    try {
      await args.prepare();
    } catch (error) {
      if (generation !== this.generation || !args.isCurrent()) return false;
      throw error;
    }
    if (generation !== this.generation || !args.isCurrent()) return false;
    args.commit();
    return true;
  }
}
