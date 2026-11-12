/** A face was loaded successfully but cannot render the requested text. */
export class FontCoverageError extends Error {
  constructor(public readonly family: string, public readonly characters: string) {
    super(`${family} does not contain required characters: ${characters}`);
    this.name = "FontCoverageError";
  }
}
