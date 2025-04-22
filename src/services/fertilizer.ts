/**
 * Represents information about a fertilizer.
 */
export interface Fertilizer {
  /**
   * The name of the fertilizer.
   */
  name: string;
  /**
   * A description of the fertilizer.
   */
  description: string;

  /**
   * The NPK ratio of the fertilizer.
   */
  npk: string;
}

/**
 * Asynchronously retrieves fertilizer information for a given fertilizer name.
 *
 * @param fertilizerName The name of the fertilizer to retrieve information for.
 * @returns A promise that resolves to a Fertilizer object containing the fertilizer's name, description, and NPK ratio.
 */
export async function getFertilizer(fertilizerName: string): Promise<Fertilizer> {
  // TODO: Implement this by calling an API.
  console.log(`retrieving fertilizer data for ${fertilizerName}`);
  return {
    name: 'Example Fertilizer',
    description: 'A general-purpose fertilizer for plants.',
    npk: '10-10-10',
  };
}
