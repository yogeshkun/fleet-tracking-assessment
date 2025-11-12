// src/event-emitter.ts
export class EventEmitter {
    private events: { [key: string]: Array<(data: any) => void> } = {};

    on(event: string, listener: (data: any) => void) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    emit(event: string, data: any) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }

    removeListener(event: string, listenerToRemove: (data: any) => void) {
        console.log("-->",event,listenerToRemove,this.events)
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    }
}
