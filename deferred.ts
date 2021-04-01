import {
    deferred
} from './deps.ts'
import {
    Deferred
} from './mod.d.ts'


export class DeferredStack<T> {

    entries: Array<T>
    queue: Array<Deferred<T>> = []

    index: number

    get available(): number {
        return this.entries.length
    }
    
    constructor(
        public max: number = 10,
        public iterable?: Iterable<T>,
        public initial?: () => Promise<T>
    ) {
        // deconstruct iterable to an array entries
        this.entries = iterable ? [...iterable] : []
        // current index default as entries length
        this.index = this.entries.length
    }

    push(entry: T): void {
        this.entries.push(entry)
        // push one just release one queue lock/mutex
        if (this.queue.length) {
            const func = this.queue.shift()!
            func.resolve()
        }
    }

    async pop(): Promise<T> {
        /** 
         * if not empty entries, pop one
         * the pop one will be pushed into entries after using
         */
        if (this.entries.length) {
            return this.entries.pop()!
        
        /**
         * if empty entries, call initial() create new one
         * the new one will be pished into entries after using
         */
        } else if (this.index < this.max && this.initial) {
            this.index++
            return await this.initial()
        }
        /**
         * pop one just acquire one queue lock/mutex
         * 
         * when max=1, `await func` means waiting lock/mutx released by others
         * it will pop entry after lock/mutex release
         */
        const func = deferred<T>()
        this.queue.push(func)
        await func
        // after waiting lock/mutex released, return pop entry
        return this.entries.pop()!
    }
}