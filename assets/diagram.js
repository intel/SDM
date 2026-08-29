"use strict";

// Copyright (C) 2025-2026 Intel Corporation

let show_borders = false; // debugging: show alignment boxes?

////////////////////////////////////////////////////////////////
// SVG helper functions
////////////////////////////////////////////////////////////////

const svg_namespace = 'http://www.w3.org/2000/svg';

function rect(x, y, w, h, fill, stroke) {
    const r = document.createElementNS(svg_namespace, 'rect');
    r.setAttribute('x', x);
    r.setAttribute('y', y);
    r.setAttribute('width', w);
    r.setAttribute('height', h);
    r.setAttribute('fill', fill);
    r.setAttribute('stroke', stroke);
    return r;
}

function line(x1,y1,x2,y2,stroke=null, stroke_width=null) {
    const r = document.createElementNS(svg_namespace, 'line');
    r.setAttribute('x1', x1);
    r.setAttribute('y1', y1);
    r.setAttribute('x2', x2);
    r.setAttribute('y2', y2);
    if (stroke !== null) { r.setAttribute('stroke', stroke); }
    if (stroke_width !== null) { r.setAttribute('stroke-width', stroke_width); }
    return r;
}

function path(d, stroke=null, stroke_width=null) {
    const r = document.createElementNS(svg_namespace, 'path');
    r.setAttribute('d', d);
    if (stroke !== null) { r.setAttribute('stroke', stroke); }
    if (stroke_width !== null) { r.setAttribute('stroke-width', stroke_width); }
    return r;
}

function text(x, y, font_family, font_size, fill) {
    const r = document.createElementNS(svg_namespace, 'text');
    r.setAttribute('x', x);
    r.setAttribute('y', y);
    r.setAttribute('font-family', font_family);
    r.setAttribute('font-size', font_size);
    r.setAttribute('fill', fill);
    return r;
}

function tspan(x, dy, textContent) {
    const r = document.createElementNS(svg_namespace, 'tspan');
    r.setAttribute('x', x);
    r.setAttribute('dy', dy);
    r.textContent = textContent;
    return r;
}

// Get the bounding box of an element (which should be unattached)
function get_bbox(e) {
    let div = document.createElement('div');
    div.setAttribute('style', "position:absolute; visibility:hidden; width:0; height:0");
    document.body.appendChild(div);
    const svg = document.createElementNS(svg_namespace, 'svg');
    svg.appendChild(e);
    div.appendChild(svg);
    let bb = e.getBBox();
    document.body.removeChild(div);
    return bb;
}

function union_boxes(a, b) {
    if (a.w == 0 || a.h == 0) {
        return b;
    } else if (b.w == 0 || b.h == 0) {
        return a;
    } else {
        const x0 = Math.min(a.x, b.x);
        const y0 = Math.min(a.y, b.y);
        const x1 = Math.max(a.x + a.w, b.x + b.w);
        const y1 = Math.max(a.y + a.h, b.y + b.h);
        return { x: x0, y: y0, w: x1-x0, h: y1-y0 };
    }
}

class Graphic {
    constructor(w, h, padding_left, padding_right, padding_top, padding_bottom, children=[]) {
        this.x = 0;
        this.y = 0;
        this.w = w;
        this.h = h;
        this.padding_left = padding_left;
        this.padding_right = padding_right;
        this.padding_top = padding_top;
        this.padding_bottom = padding_bottom;
        this.children = children;
    }

    get width() { return this.padding_left + this.w + this.padding_right; }
    get height() { return this.padding_top + this.h + this.padding_bottom; }

    get is_empty() { return this.w == 0 || this.h == 0; }

    get bounding_box() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
    get padded_box() {
        if (this.is_empty) {
            return { x: 0, y: 0, w: 0, h: 0 };
        } else {
            return { x: this.x-this.padding_left, y: this.y-this.padding_top, w: this.width, h: this.height };
        }
    }

    add_multiple(gs, update_bbox=true) {
        let bbox = this.bounding_box;
        let padded_box = this.padded_box;

        for (const [dx, dy, g] of gs) {
            let gbbox = g.bounding_box;
            gbbox.x += this.x + dx;
            gbbox.y += this.y + dy;
            bbox = union_boxes(bbox, gbbox);

            let gpbox = g.padded_box;
            gpbox.x += this.x + dx;
            gpbox.y += this.y + dy;
            padded_box = union_boxes(padded_box, gpbox);
        }

        if (update_bbox) {
            this.x = bbox.x;
            this.y = bbox.y;
            this.w = bbox.w;
            this.h = bbox.h;
        }

        // The padding is always updated because we need it to always include
        // all the 'ink' on the page.
        this.padding_left = this.x - padded_box.x;
        this.padding_right = (padded_box.x + padded_box.w) - (this.x + this.w);
        this.padding_top = this.y - padded_box.y;
        this.padding_bottom = (padded_box.y + padded_box.h) - (this.y + this.h);

        this.children.push(...gs);
    }

    // add objects to left and to right of 'this'
    // each graphic addition has an alignment pair and a gap
    //
    add_horizontal(lhs, rhs, update_bbox=true) {
        let gs = [];
        let x = this.x - this.padding_left;
        for (const [g, align1, align2, gap] of lhs.toReversed()) {
            const dx = (x - g.x) - (g.w + g.padding_right + gap);
            const dy = (this.y - g.y) + align1 * this.h - align2 * g.h;
            gs.push([dx, dy, g]);
            x -= dx + g.padding_left;
        };
        x = this.x + this.w + this.padding_right;
        for (const [g, align1, align2, gap] of rhs) {
            const dx = (x - g.x) + (gap + g.padding_left);
            const dy = (this.y - g.y) + align1 * this.h - align2 * g.h;
            gs.push([dx, dy, g]);
            x += dx + g.w + g.padding_right;
        }
        this.add_multiple(gs);
    }

    // add objects above and below 'this'
    // each graphic addition has an alignment pair and a gap
    //
    add_vertical(above, below, update_bbox=true) {
        let gs = [];
        let y = this.y - this.padding_top;
        for (const [g, align1, align2, gap] of above) {
            const dx = (this.x - g.x) + align1 * this.w - align2 * g.w;
            const dy = (y - g.y) - (gap + g.padding_bottom + g.h);
            gs.push([dx, dy, g]);
            y -= dy + g.padding_top;
        };
        y = this.y + this.h + this.padding_bottom;
        for (const [g, align1, align2, gap] of below) {
            const dx = (this.x - g.x) + align1 * this.w - align2 * g.w;
            const dy = (y - g.y) + gap + g.padding_top;
            gs.push([dx, dy, g]);
            y += g.h + g.padding_bottom;
        }
        this.add_multiple(gs);
    }

    add(g, dx, dy, update_bbox=true) {
        this.add_multiple([[dx, dy, g]], update_bbox);
    }

    add_to_right(g, align1=0, align2=0, gap=0, update_bbox=true) {
        this.add_horizontal([], [[g, align1, align2, gap]], update_bbox);
        return g;
    }

    add_to_left(g, align1=0, align2=0, gap=0, update_bbox=true) {
        this.add_horizontal([[g, align1, align2, gap]], [], update_bbox);
        return g;
    }

    add_above(g, align1=0, align2=0, gap=0, update_bbox=true) {
        this.add_vertical([[g, align1, align2, gap]], [], update_bbox);
        return g;
    }

    // Add graphic 'g' below 'this' such that
    // - the top of 'g's bounding box is 'gap' below the bottom of 'this's bounding box
    // - the bounding boxes are aligned at offset 'align1 * this.w' and 'align2 * g.w'
    //   (e.g., align1 == align2 == 0.5 => aligned at centre
    //          align1 == 1 & align2 == 0 => align rhs of this with lhs of g)
    add_below(g, align1=0, align2=0, gap=0, update_bbox=true) {
        this.add_vertical([], [[g, align1, align2, gap]], update_bbox);
        return g;
    }

    render() {
        const result = document.createDocumentFragment();
        for (const [dx,dy,c] of this.children) {
            result.appendChild(c.render());
        }
        if (show_borders && !this.is_empty) {
            const box1 = rect(this.x, this.y, this.w, this.h, 'none', 'blue');
            box1.setAttribute('stroke-width', 0.1);
            //box1.setAttribute('opacity', '30%');
            const box2 = rect(this.x - this.padding_left, this.y - this.padding_top, this.width, this.height, 'none', 'red');
            box2.setAttribute('stroke-width', 0.1);
            //box2.setAttribute('opacity', '30%');
            result.appendChild(box1);
            result.appendChild(box2);
        }
        return result;
    }

    normalize(ox, oy) {
        this.x += ox;
        this.y += oy;
        for (let i = 0; i < this.children.length; i++) {
            const [dx, dy, c] = this.children[i];
            c.normalize(ox+dx, oy+dy);
            this.children[i][0] = 0;
            this.children[i][1] = 0;
        }
    }
}

function emptyGraphic() { return new Graphic(0, 0, 0, 0, 0, 0, []);
}

function row(gs, align, gap=0) {
    const r = emptyGraphic();
    r.add_horizontal([], gs.map((g) => [g, align, align, (g == gs[0]) ? 0 : gap]));
    return r;
}

function column(gs, align, gap=0) {
    const r = emptyGraphic();
    r.add_vertical([], gs.map((g) => [g, align, align, (g == gs[0]) ? 0 : gap]));
    return r;
}


function distributeH(gs, align, width) {
    const r = emptyGraphic();
    if (gs.length == 1) {
        return gs[0];
    } else if (gs.length > 1) {
        let w = 0;
        for(const g of Array.from(gs)) {
            w += g.width;
        }
        w -= gs[0].padding_left;
        w -= gs[gs.length-1].padding_right;
        const gap = Math.max(0, (width - w) / (gs.length - 1)); // space between elements

        r.add_horizontal([], gs.map((g) => [g, align, align, (g == gs[0]) ? 0 : gap]));
    }
    return r;
}

function distributeV(gs, align, height) {
    const r = emptyGraphic();
    if (gs.length == 1) {
        return gs[0];
    } else if (gs.length > 1) {
        let h = 0;
        for(const g of Array.from(gs)) {
            h += g.height;
        }
        h -= gs[0].padding_top;
        h -= gs[gs.length-1].padding_bottom;
        const gap = Math.max(0, (height - h) / (gs.length - 1)); // space between elements

        r.add_vertical([], gs.map((g) => [g, align, align, (g == gs[0]) ? 0 : gap]));
    }
    return r;
}

////////////////////////////////////////////////////////////////
// Generating diagrams
////////////////////////////////////////////////////////////////

function output(g, i=0, dx=0.5, dy=0.8) {
    return { obj: g, port: i, dx: dx, dy: dy };
}

function input(g, i=0, dx=0.5, dy=-0.1) {
    return { obj: g, port: i, dx: dx, dy: dy };
}

class Cell extends Graphic {
    constructor(config, wd, { textContent = null, fill = null, vscale = 1, hscale = 1, hi = null, lo = null} = {}) {
        const padding_top = (hi !== null || lo != null) ? config.jut : 0
        const padding_bottom = config.padding_y
        super(wd * hscale * config.cell_width, vscale * config.cell_height,
              0, 0, padding_top, padding_bottom,
              []);

        this.config = config;
        this.wd = wd;
        this.textContent = textContent;
        this.hscale = hscale;
        this.vscale = vscale;
        this.hi = hi;
        this.lo = lo;
        this.fill = fill;
    }

    render() {
        const config = this.config;
        const x = this.x;
        const y = this.y;
        const w = this.w;
        const h = this.h;
        const hi = this.hi;
        const lo = this.lo;
        const fill = this.fill;

        const result = document.createDocumentFragment();

        const r = rect(x, y, w, h, fill || config.reg_fill, config.stroke);
        result.appendChild(r);

        if (this.textContent !== null) {
            const mx = x + w/2
            const my = y + h/2 + config.cell_font_size * 0.3
            const t = text(mx, my, config.font, config.cell_font_size, config.text_stroke);
            t.setAttribute('text-anchor', "middle");
            t.textContent = this.textContent;
            result.appendChild(t);
        }

        if (hi !== null) {
            result.appendChild(line(x, y, x, y-config.jut, config.jut_stroke, config.stroke_width));
        }
        if (lo !== null) {
            result.appendChild(line(x+w, y, x+w, y-config.jut, config.jut_stroke, config.stroke_width));
        }

        if (hi !== null && hi == lo) {
            const t = text(x+w/2, y-config.cell_dy, config.font, config.jut_font_size, config.jut_stroke);
            t.setAttribute('text-anchor', 'middle');
            t.textContent = hi.toString();
            result.appendChild(t);
        } else {
            if (hi !== null) {
                const t = text(x+config.cell_dx, y-config.cell_dy, config.font, config.jut_font_size, config.jut_stroke);
                t.textContent = hi.toString();
                result.appendChild(t);
            }
            if (lo !== null) {
                const t = text(x+w-config.cell_dx, y-config.cell_dy, config.font, config.jut_font_size, config.jut_stroke);
                t.setAttribute('text-anchor', 'end');
                t.textContent = lo.toString();
                result.appendChild(t);
            }
        }
        result.appendChild(super.render());
        // console.log((new XMLSerializer()).serializeToString(result));
        return result;
    }

    get num_ports() { return 1; }

    port(ignored, ax, ay) {
        const x = this.x + this.w * ax;
        const y = this.y + this.h * ay;
        return [x, y];
    }
}

class Para extends Graphic {
    constructor(config, lines, font_size) {
        let w = 0;
        for (const line of Array.from(lines)) {
            const t = text(0, 0, config.font, font_size, config.text_stroke);
            t.textContent = line;
            const tw = get_bbox(t);
            w = Math.max(w, tw.width);
        }
        const h = lines.length * config.line_spacing * font_size;
        super(w, h,
              config.padding_para_x, config.padding_para_x,
              config.padding_para_y, config.padding_para_y, []);
        this.config = config;
        this.lines = lines;
        this.font_size = font_size;
    }

    render() {
        const config = this.config;
        const x = this.x;
        const y = this.y;
        const lines = this.lines;
        const t = text(x, y, config.font, this.font_size, config.text_stroke);
        for (const line of Array.from(lines)) {
            const s = tspan(x, this.font_size * config.line_spacing, line);
            s.setAttribute('font-family', config.font);
            s.setAttribute('text-anchor', 'start');
            t.appendChild(s);
        }
        const result = document.createDocumentFragment();
        result.appendChild(t);
        result.appendChild(super.render());
        return result;
    }

    get num_ports() { return 1; }

    port(ignored, ax, ay) {
        const x = this.x + this.w * ax;
        const y = this.y + this.h * ay;
        return [x, y];
    }

}

// is the name of a field too large for the associated Cell?
function fieldname_overflows(config, field, hscale, vscale) {
    const width = field.bitWidth * hscale * config.cell_width;
    const height = vscale * config.cell_height;
    const t = text(0, 0, config.font, config.cell_font_size, config.text_stroke);
    t.textContent = field.name;
    const box = get_bbox(t);
    return box.width > width || box.height > height;
}

// choose display style for register
// (based on size of text, etc.)
function choose_style(config, reg_spec, hscale=1, vscale=1) {
    if (reg_spec.fields.some(f => fieldname_overflows(config, f, hscale, vscale))) {
        return "outline";
    }
    return "inline"; // default if nothing bad
}

// Normalize the spec:
// - sort fields into descending order
// - insert reserved fields in any gaps
function normalize_register_spec(spec) {
    spec.fields.sort((a, b) => b.bitIndex - a.bitIndex);

    function mk_reserved(i, w) {
        return {
            name: null,
            bitIndex: i,
            bitWidth: w,
            longdesc: null,
            reserved: true,
        };
    }

    let top = spec.size;
    let fields = [];
    for (const field of spec.fields) {
        const f_top = field.bitIndex + field.bitWidth;
        if (top != f_top) { // gap between fields
            fields.push(mk_reserved(f_top, top - f_top));
        }
        fields.push(field);
        top = field.bitIndex;
    }
    if (top != 0) {
        fields.push(mk_reserved(0, top));
    }
    spec.fields = fields;
}

class Register extends Graphic {
    constructor(config, spec, { title_pos = "left", hscale=1, vscale=1 } = {}) {
        // First, normalize the spec
        normalize_register_spec(spec);

        const style = choose_style(config, spec, hscale); // automatically choose layout

        // Generate a Para for a field 'f'
        function mk_field_desc(f) {
            const name = f.name;
            const shortdesc = f.shortdesc;
            const longdesc = f.longdesc;
            const too_big = fieldname_overflows(config, f, hscale, vscale);

            if (!too_big && !shortdesc && !longdesc && !f.values) {
                return null;
            }

            let text = [];
            if (name && shortdesc) {
                text.push(`${shortdesc} (${name})`);
            } else if (name) {
                text.push(name);
            } else if (shortdesc) {
                text.push(shortdesc);
            }
            if (longdesc) {
                text.push(longdesc);
            }

            if (f.values) {
                const lo = f.bitIndex;
                const hi = lo + f.bitWidth - 1;
                const slice = lo == hi ? lo : `${hi}:${lo}`;
                for (const v of Array.from(f.values).values()) {
                    text.push(`${spec.name}[${slice}] = ${v.value} : ${v.shortdesc}`);
                }
            }

            if (text.length == 0) {
                return null;
            }
            return new Para(config, text, config.register_font_size);
        }

        super(0, 0,
              config.padding_x, config.padding_x,
              config.padding_y, config.padding_y,
              []);

        let texts = [];
        let reg = emptyGraphic();
        let cells = [];
        // todo: handle gaps between fields
        for (const f of Array.from(spec.fields)) {
            const wd = f.bitWidth;
            const lo = f.bitIndex;
            const hi = (lo + wd - 1);
            const display_width = wd > 128 ? 16 : wd; // really wide fields get abbreviated

            const reserved = f.reserved || false;
            const too_big = fieldname_overflows(config, f, hscale, vscale);

            let label = too_big
                        ? ""
                        : f.name || f.shortdesc || "";
            if (label == "" && reserved && wd >= 8) { label = "Reserved"; }
            const fill = reserved ? config.reserved_color : null;
            const c = new Cell(config, display_width, { textContent: label, fill: fill, hi: hi, lo: lo, hscale: hscale, vscale: vscale});
            cells.unshift(c);
            reg.add_to_right(c);
            const t = mk_field_desc(f);
            if (t) {
                texts.push([t, c]);
            }
        }

        if (spec.name !== null) {
            const label = new Para(config, [spec.name], config.register_font_size);
            if (title_pos == "topleft") {
                reg.add_above(label, 0.0, 0.0, config.padding_title_y, false);
            } else if (title_pos == "topright") {
                reg.add_above(label, 1.0, 1.0, config.padding_title_y, false);
            } else if (title_pos == "right") {
                reg.add_to_right(label, 0.0, 0.0, config.padding_title_x, false);
            } else {
                reg.add_to_left(label, 0.0, 0.0, config.padding_title_x, false);
            }
        }

        this.add_below(reg);

        if (false && style == "inline") {
            this.add_below(row(texts.map(x=>x[0]), 0, config.register_field_gap_x), 0.5, config.register_field_gap_y);
            texts.map(([t, c]) => this.add(new Connect(config, output(c, 0, 0.5, 1), input(t, 0, 0.1, 0), false)));
        } else {
            const mid = Math.floor(texts.length / 2);
            const left_texts = texts.slice(0, mid);
            const right_texts = texts.slice(mid).toReversed();
            const left_column = column(left_texts.map(x=>x[0]), 1.0);
            const right_column = column(right_texts.map(x=>x[0]), 0.0);

            this.add_horizontal([[left_column, 2.0, 0.0, config.register_field_gap_x]],
                                [[right_column, 2.0, 0.0, config.register_field_gap_x]]);
            left_texts.map(([t, c]) => this.add(new Connect(config, output(c, 0, 0.5, 1), input(t, 0, 1.0, 0.5), false, "VH")));
            right_texts.map(([t, c]) => this.add(new Connect(config, output(c, 0, 0.5, 1), input(t, 0, 0.0, 0.5), false, "VH")));
        }

        this.config = config;
        this.spec = spec;
        this.hscale = hscale;
        this.title_pos = title_pos;
        this.vscale = vscale;
        this.cells = cells;
    }

    get num_ports() { return this.spec.fields.length; }

    port(i, ax, ay) {
        return this.cells[i].port(0, ax, ay);
    }
}


class Connect extends Graphic {
    constructor(config, src, dst, add_arrow=true, style="D") {
        super(0, 0, 0, 0, 0, 0);
        this.config = config;
        this.src = src;
        this.dst = dst;
        this.add_arrow = add_arrow;
        this.style = style;
    }

    render() {
        const config = this.config;
        const style = this.style;
        const [x1, y1] = this.src.obj.port(this.src.port, this.src.dx, this.src.dy);
        const [x2, y2] = this.dst.obj.port(this.dst.port, this.dst.dx, this.dst.dy);

        // The 'style' is a string like "VHV" indicating that the line should be
        // split into 3 segments: vertical then horizontal then vertical
        // or "D" indicating that the line should be diagonal
        function dx(c) { return (c == "H" || c == "D") ? 1 : 0; }
        function dy(c) { return (c == "V" || c == "D") ? 1 : 0; }

        let w = 0;
        let h = 0;
        for (const c of style) { w += dx(c) }
        for (const c of style) { h += dy(c) }

        const step_x = (x2 - x1) / w;
        const step_y = (y2 - y1) / h;

        // Construct path from (x1, y1) to (x2, y2) based on style
        let p = `M ${x1} ${y1}`;
        for (const c of style) {
            if (c == "H") { p += ` h ${step_x}`;
            } else if (c == "V") { p += ` v ${step_y}`;
            } else { p += ` l ${step_x} ${step_y}`;
            }
        }

        function mk_line(is_halo, add_arrow) {
            const color = is_halo ? config.bg_color : config.connect_stroke;
            const width = config.connect_width + (is_halo ? config.connect_halo : 0);
            const r = path(p, color, width);
            r.setAttribute('fill', 'transparent');
            if (is_halo) {
                r.setAttribute('opacity', '70%');
            }
            if (add_arrow) {
                r.setAttribute('marker-end', "url(#arrow)");
            }
            return r;
        }

        const result = document.createDocumentFragment();

        // Connectors consist of two lines:
        // 1) A 'halo' line of twice the thickness in the background color
        //    This makes lines clearer when they cross other lines, text or objects.
        //    And it makes the order of lines more obvious.
        result.appendChild(mk_line(true, false));

        // 2) The line itself with an optional arrow on the end
        result.appendChild(mk_line(false, this.add_arrow));

        return result;
    }
}

function render_diagram(config, g) {
    const canvas = document.createElementNS(svg_namespace, 'svg');
    // const w = 1000;
    // const h = (g.height / g.width) * w;
    const w = g.width;
    const h = g.height;
    canvas.setAttribute('width', w);
    canvas.setAttribute('height', h);
    canvas.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const defs = document.createElementNS(svg_namespace, 'defs');
    canvas.appendChild(defs);
    const marker = document.createElementNS(svg_namespace, 'marker');
    defs.appendChild(marker);
    marker.setAttribute('id', 'arrow');
    marker.setAttribute('viewBox', `0 0 ${config.arrow_length} ${config.arrow_width}`);
    marker.setAttribute('refX', config.arrow_length * 0.7);
    marker.setAttribute('refY', config.arrow_width / 2);
    marker.setAttribute('markerWidth', config.arrow_length);
    marker.setAttribute('markerHeight', config.arrow_width);
    marker.setAttribute('style', `fill: ${config.connect_stroke};`);
    marker.setAttribute('orient', 'auto-start-reverse');
    const path = document.createElementNS(svg_namespace, 'path');
    path.setAttribute('d', `M 0 0 L ${config.arrow_length} ${config.arrow_width/2} L 0 ${config.arrow_width} L ${config.arrow_length * 0.2} ${config.arrow_width/2} z`);
    marker.appendChild(path);

    g.normalize(g.padding_left - g.x, g.padding_top-g.y);
    // g.normalize(g.padding_left, g.padding_top);
    canvas.appendChild(g.render());

    return canvas;
}

////////////////////////////////////////////////////////////////
// End
////////////////////////////////////////////////////////////////
