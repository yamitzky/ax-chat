interface ReadableStream<R = any> {
  values(options?: { preventCancel?: boolean }): AsyncIterableIterator<R>
  [Symbol.asyncIterator](): AsyncIterableIterator<R>
}
