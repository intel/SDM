"use strict";

// Copyright (C) 2025-2026 Intel Corporation

const ISA_keywords = new Set([
    "UNSPECIFIED",
    "__assert",
    "__builtin",
    "__in",
    "__let",
    "__operator1",
    "__operator2",
    "and",
    "array",
    "as",
    "assert",
    "begin",
    "bitfield",
    "case",
    "catch",
    "do",
    "downto",
    "else",
    "elsif",
    "end",
    "endcase",
    "endif",
    "endfor",
    "endif",
    "endmodule",
    "endtry",
    "endwhile",
    "ensures",
    "enumeration",
    "exception",
    "for",
    "foreign",
    "function",
    "if",
    "implicit",
    "import",
    "impure",
    "in",
    "interface",
    "let",
    "module",
    "not",
    "of",
    "optimize",
    "or",
    "ordered",
    "others",
    "otherwise",
    "pure",
    "record",
    "repeat",
    "return",
    "then",
    "throw",
    "to",
    "try",
    "type",
    "unordered",
    "until",
    "use",
    "var",
    "when",
    "while",
    "with",
    "xor",
    "Bit",
    "Bits",
    "Boolean",
    "Integer",
]);

function add_tooltip(text, tip, url) {
    let link = text;
    if (url) {
        link = "<a href='" + url + "'>" + link + "</a>";
    }
    if (tip) {
        link = `<div class='tooltip'>${link}<span class='tooltiptext'>${tip}</span></div>`;
    }
    return link;
}

let keyword_text = {};
ISA_keywords.forEach(t => {
    keyword_text[t] = "<span class='isa_keyword'>" + t + "</span>"
})

function make_instruction_highlighting_table(f)
{
    let table = {};
    return table; // TODO
    f.inputs.forEach(input => {
        const tip = `Input ${input.name} : ${input.type}`;
        table[input.name] = add_tooltip(input.name, tip, null);
    });
    f.outputs.forEach(output => {
        const tip = `Output ${output.name} : ${output.type}`;
        table[output.name] = add_tooltip(output.name, tip, null);
    });
    return table;
}

function make_code_link(name, shown_name, kind, kind2) {
    const show_fun = kind == "Instruction" ? "show_instruction"
                     : kind == "Register" ? "show_instruction"
                     : "show_helper";
    const screen = 0;
    const link = `<a onclick="${show_fun}(${screen}, '${kind2 || 'instr'}', '${name}')">${shown_name}</a>`;
    return link;
}

function make_code_ref(name, shown_name, kind, kind2, shortdesc, longdesc) {
    const screen = 0;
    let link = make_code_link(name, shown_name, kind, kind2);
    let tip = "";
    if (shortdesc && shortdesc != "<shortdesc><phrase/></shortdesc>") {
        tip = `${tip}${shortdesc}`;
    }
    if (longdesc.length && longdesc[0].innerHTML != "") {
        if (tip.length != 0) {
            tip = `${tip}<br><br>`;
        }
        tip = `${tip}${longdesc[0].outerHTML}`;
    }
    if (tip.length != 0) {
        link = add_tooltip(link, tip, null);
    }
    return link;
}

let definition_links = {};

function make_instruction_highlighting_table2(instructions) {
    for (const [label, instr_funcs, shortdesc, filename] of instructions) {
        for (const func of instr_funcs) {
            definition_links[func] = make_code_ref(label, label, 'Instruction', 'instr', shortdesc, '');
        }
    }
}

function make_code_highlighting_table(helpers)
{
    for (const helper of helpers.getElementsByTagName('helper')) {
        const name = helper.getAttribute('name');
        const kind = helper.getAttribute('kind');
        const func = helper.getAttribute('func');
        const use_as = helper.getAttribute('use_as');
        const shortdesc = helper.getElementsByTagName('shortdesc')[0].outerHTML;
        const longdesc = helper.getElementsByTagName('longdesc');
        const fields = helper.getElementsByTagName('fields');

        const shown_name = use_as ? use_as : name;
        const link = make_code_ref(name, shown_name, kind, 'helper', shortdesc, longdesc);
        if (func) {
            definition_links[func] = link;
        } else {
            definition_links[name] = link;
        }
        if (use_as) {
            // use_as defines aliases that should also link here
            definition_links[use_as] = link;
        }

        // Register all other names defined in helper
        for (const def of helper.getElementsByTagName('defines')) {
            const dname = def.innerHTML;
            if (dname != def) {
                definition_links[dname] = make_code_ref(dname, dname, kind, 'helper', shortdesc, longdesc);
            }
        }

        // Register all of the individual fields of registers as well
        if (fields) {
            for (const field of fields) {
                const fname = field.getAttribute('name');
                const fshort = field.getAttribute('shortdesc');
                const flong  = field.getAttribute('longdesc');
                const fshown = `${name}.${field.name}`;
                const flabel = `Register_field_${fshown}`;
                const flink = make_code_ref(fname, fshown, 'Register_field', 'instr', fshort, flong);
                definition_links[flabel] = flink;
            }
        }
    }
}

function mk_code_links(code, label, tag) {
    let links = [];
    for (const ref of code.getElementsByTagName(tag)) {
        const f = ref.textContent;
        const link = definition_links[f];
        if (link) {
            links.push(link);
        }
    };
    let line = "";
    if (links.length > 0) {
        line += `<bold>${label}</bold> ` + links.join(', ') + "<br>";
    }
    return line;
}

function render_ISA_code(line, extra_links) {
    function highlight_ISA_ident(orig_match, offset, string) {
        // To handle field accesses like "RFLAGS.CF",
        // find the longest match in a name like 'Foo.Bar.Baz'
        let end = orig_match.length;
        do {
            const match = orig_match.substring(0, end);
            const tail = orig_match.substring(end);
            let link = extra_links[match];
            if (link) {
                return link + tail;
            }
            link = definition_links[match];
            if (link) {
                return link + tail;
            }
            link = keyword_text[match];
            if (link) {
                return link + tail;
            }
            end = match.lastIndexOf(".");
        } while (end > 0);
        return orig_match;
    }

    return line.replace(/([a-zA-Z_][a-zA-Z0-9_.:]*|\+:|\*:|-:|\+\+)/g, highlight_ISA_ident);
}

function render_ISA(lines, extra_links) {
    const counter_len = Math.ceil(Math.log10(1 + lines.length));
    let codes = ""
    for (const [i, line] of [...lines].entries()) {
        const line_number = (i + 1).toString().padStart(counter_len, '0');
        const code = render_ISA_code(line.innerHTML, extra_links);
        codes += `<span class='line_number'>${line_number}</span>  ${code}\n`;
    };
    const blank_number = " ".repeat(counter_len)
    codes += `<span class='line_number'>${blank_number}</span>  <span class='not_sample'>// This code is not 'Sample Code'</span>\n`;
    codes = "<pre>" + codes + "</pre>";
    return codes;
}

