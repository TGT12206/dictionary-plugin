import { View } from "obsidian";
import { Optional } from "./shorthand";
import { VariableEditor } from "./variable-editor";

/**
 * An update notification tells other editors that something has changed, and they might be outdated.
 */
export class UpdateNotification {
    /**
     * Context to know what needs to be changed. Usually this is the old value of whatever needs to change.
     */
    context: Optional<any> = null;

    constructor (
        /**
         * A reference to the editor sending the notice.
         */
        public source: VariableEditor<any>,
        public handler: UNHandler
    ) {}

    async Send(view: View, context: Optional<any>) {
        this.context = context;
        await this.handler(view, this);
        this.context = null;
    }
}

export class UpdateTrigger {
    notifications: Map<VariableEditor<any>, UpdateNotification> = new Map();
    constructor(
        public source: VariableEditor<any>
    ) {}
    async TriggerUpdate(view: View, context: any) {
        for (const n of this.notifications.entries()) {
            await n[1].Send(view, context);
        }
    }
    Register(editor: VariableEditor<any>, handler: UNHandler) {
        const notification = new UpdateNotification(this.source, handler); 
        this.notifications.set(editor, notification);
    }
    Unregister(editor: VariableEditor<any>) {
        this.notifications.delete(editor);
    }
}

export type UNHandler = (view: View, notification: UpdateNotification) => Promise<void>;