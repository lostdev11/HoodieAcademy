/**
 * Represents a tweet from X (formerly Twitter).
 */
export interface Tweet {
  /**
   * The unique identifier of the tweet.
   */
id: string;
  /**
   * The username of the tweet's author.
   */
  author: string;
  /**
   * The text content of the tweet.
   */
  text: string;
  /**
   * The URL to the tweet.
   */
  url: string;
}

/**
 * Asynchronously fetches a list of tweets from a given X (formerly Twitter) feed.
 *
 * @param accountName The X account name to retrieve tweets from.
 * @returns A promise that resolves to an array of Tweet objects.
 */
export async function getTweets(accountName: string): Promise<Tweet[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      id: '1',
      author: '@hoodie',
      text: 'Welcome to Hoodie Academy! #StayBuilding #StayHODLing',
      url: 'https://twitter.com/hoodie/status/1'
    },
    {
      id: '2',
      author: '@hoodie',
      text: 'Learn about NFTs, meme coins, and more! #Web3',
      url: 'https://twitter.com/hoodie/status/2'
    },
    {
      id: '3',
      author: '@hoodie',
      text: 'The future of learning is here. Join us!',
      url: 'https://twitter.com/hoodie/status/3'
    }
  ];
}

