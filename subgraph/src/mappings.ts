import { Update } from '../generated/SugarFeed/SugarFeed'
import { SugarFeed, SugarFeedUpdate } from '../generated/schema'
import { Address } from '@graphprotocol/graph-ts';

export function handleUpdate(event: Update): void {
    const update = new SugarFeedUpdate(event.block.hash.toHexString())
    update.timestamp = event.params.timestamp.toBigDecimal();
    update.value = event.params.value.toBigDecimal();
    update.feed = getSugarFeed(event.address).id;
    update.save()
}

export function getSugarFeed(address: Address): SugarFeed {
    let feed = SugarFeed.load(address.toHexString()) as SugarFeed
    if (feed == null) {
        feed = new SugarFeed(address.toHexString())
    }
    return feed
}