import { Update } from '../generated/SugarFeed/SugarFeed'
import { SugarFeedUpdate } from '../generated/schema'

export function handleUpdate(event: Update): void {
    const update = new SugarFeedUpdate(event.block.number.toString() + event.transaction.index.toString())
    update.timestamp = event.params.timestamp.toBigDecimal();
    update.value = event.params.value.toBigDecimal();
    update.feed = event.address.toHexString();
    update.save()
}