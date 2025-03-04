import Gtk from 'gi://Gtk?version=3.0';
import AgsWidget, { type BaseProps } from './widget.js';
import AgsBox, { type BoxProps } from './box.js';

export type CenterBoxProps = BaseProps<AgsCenterBox, Gtk.Box.ConstructorProperties & {
    vertical?: boolean
    start_widget?: Gtk.Widget
    center_widget?: Gtk.Widget
    end_widget?: Gtk.Widget
}>;

export default class AgsCenterBox extends AgsBox {
    static {
        AgsWidget.register(this, {
            properties: {
                'start-widget': ['widget', 'rw'],
                'center-widget': ['widget', 'rw'],
                'end-widget': ['widget', 'rw'],
            },
        });
    }

    constructor(props: CenterBoxProps = {}) {
        super(props as BoxProps);
    }

    set children(children: Gtk.Widget[]) {
        const newChildren = children || [];

        newChildren.filter(ch => !newChildren?.includes(ch))
            .forEach(ch => ch.destroy());

        if (children[0])
            this.start_widget = children[0];

        if (children[1])
            this.center_widget = children[1];

        if (children[2])
            this.end_widget = children[2];
    }

    get start_widget() { return this._get('start-widget') || null; }
    set start_widget(child: Gtk.Widget | null) {
        if (this.start_widget)
            this.start_widget.destroy();

        this._set('start-widget', child);

        if (!child)
            return;

        this.pack_start(child, true, true, 0);
        this.show_all();
    }

    get end_widget() { return this._get('end-widget') || null; }
    set end_widget(child: Gtk.Widget | null) {
        if (this.end_widget)
            this.end_widget.destroy();

        this._set('end-widget', child);

        if (!child)
            return;

        this.pack_end(child, true, true, 0);
        this.show_all();
    }

    get center_widget() { return this.get_center_widget(); }
    set center_widget(child: Gtk.Widget | null) {
        const center_widget = this.get_center_widget();
        if (!child && center_widget) {
            center_widget.destroy();
            return;
        }

        this.set_center_widget(child);
        this.notify('center-widget');
    }
}
