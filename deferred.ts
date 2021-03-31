import {
    deferred
} from './deps.ts'
import {
    Deferred
} from './mod.d.ts'


export class DeferredStack<T> {

    items: Array<T>
    queue: Array<Deferred<T>> = []

    get length(): number {
        return this.items.length
    }
    
    constructor(
        public max?: number,
        public iterable?: Iterable<T>,
        public initial?: () => Promise<T>
    ) {
        this.items = iterable ? [...iterable] : []
    }

    push(item: T): boolean {
        if (this.queue.length) {
            const func = this.queue.shift()!
            func.resolve()
        }
    }

    async pop(): Promise<T> {
        if (this.list.length > 0) {
            return this.list.pop()!
        } else if (this) {

        }
        const func = deferred<T>()
        this.queue.push(func)
        await func
        return this.queue.pop()!
    }
}