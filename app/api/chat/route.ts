
function iteratorToStream(iterator: AsyncIterator<Uint8Array>) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
 
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}
 
function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
 
const encoder = new TextEncoder()
 
async function* makeIterator() {
  yield encoder.encode('Hello! ')
  await sleep(100)
  yield encoder.encode('I am ')
  await sleep(100)
  yield encoder.encode('a demo ')
  await sleep(100)
  yield encoder.encode('AI assistant. ')
  await sleep(100)
  yield encoder.encode('I can help you ')
  await sleep(100)
  yield encoder.encode('with various tasks. ')
  await sleep(100)
  yield encoder.encode('How can I help you today?')
}
 
export async function POST() {
  const iterator = makeIterator()
  const stream = iteratorToStream(iterator)
 
  return new Response(stream)
}
