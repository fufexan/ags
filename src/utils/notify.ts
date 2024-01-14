import GLib from 'gi://GLib?version=2.0';
import { type Urgency } from '../service/notifications.js';

type ClosedReason = ReturnType<typeof _CLOSED_REASON>
type Notification = NonNullable<Awaited<ReturnType<typeof libnotify>>>['Notification']

const _URGENCY = (urgency: Urgency) => {
    switch (urgency) {
        case 'low': return 0;
        case 'critical': return 2;
        default: return 1;
    }
};

const _CLOSED_REASON = (reason: number) => {
    switch (reason) {
        case -1: return 'unset';
        case 1: return 'timeout';
        case 2: return 'dismissed';
        case 3: return 'closed';
        default: return 'undefined';
    }
};

/*
 * this module gets loaded on startup, so in order
 * to make libnotify an optional dependency we do this
 */
async function libnotify() {
    try {
        import('gi://Notify');
    } catch (error) {
        console.error(Error('Missing dependency: libnotify'));
        return null;
    }

    const Notify = (await import('gi://Notify')).default;

    if (Notify.is_initted())
        return Notify;

    Notify.init(null);
    return Notify;
}

export interface NotificationArgs {
    appName?: string
    body?: string
    iconName?: string
    id?: number
    summary?: string
    urgency?: Urgency
    category?: string
    actions?: {
        [label: string]: () => void,
    }
    timeout?: number
    onClosed?: (reason: ClosedReason) => void

    // hints
    actionIcons?: boolean;
    desktopEntry?: string;
    image?: string;
    resident?: boolean;
    soundFile?: string;
    soundName?: string;
    suppressSound?: boolean;
    transient?: boolean;
    x?: number;
    y?: number;
}

export async function notify(args: NotificationArgs): Promise<Notification>
export async function notify(
    summary: string, body?: string, iconName?: string): Promise<Notification>

export async function notify(
    argsOrSummary: NotificationArgs | string,
    body = '',
    iconName = '',
) {
    const Notify = await libnotify();
    if (!Notify) {
        console.error(Error('missing dependency: libnotify'));
        // assume libnotify as installed, so that end users
        // won't have to check the return type of the promise
        return null as unknown as Notification;
    }

    const args = typeof argsOrSummary === 'object'
        ? argsOrSummary
        : {
            summary: argsOrSummary,
            body,
            iconName,
        };

    const n = new Notify.Notification({
        summary: args.summary ?? '',
        body: args.body ?? '',
        id: args.id ?? 0,
        iconName: args.iconName ?? '',
        appName: args.appName ?? Notify.get_app_name(),
    });

    n.set_urgency(_URGENCY(args.urgency ?? 'normal'));
    n.set_timeout(args.timeout ?? 0);

    const hint = (key: string, type: 'b' | 's' | 'i', value?: boolean | string | number) => {
        if (value)
            n.set_hint(key, new GLib.Variant(type, value));
    };

    hint('action-icons', 'b', args.actionIcons);
    hint('desktop-entry', 's', args.desktopEntry);
    hint('image-path', 's', args.image);
    hint('resident', 'b', args.resident);
    hint('sound-file', 's', args.soundFile);
    hint('sound-name', 's', args.soundName);
    hint('suppress-sound', 'b', args.suppressSound);
    hint('transient', 'b', args.transient);
    hint('x', 'i', args.x);
    hint('y', 'i', args.y);

    return await new Promise(resolve => {
        Object.keys(args.actions || {}).forEach((action, i) => {
            print(`${i}`, action, args.actions![action]);
            n.add_action(`${i}`, action, args.actions![action]);
        });
        n.connect('closed', () => {
            if (args.onClosed)
                args.onClosed(_CLOSED_REASON(n.get_closed_reason()));
        });
        n.show();
        resolve(n);
    });
}
